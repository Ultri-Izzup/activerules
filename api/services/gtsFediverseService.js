import fp from "fastify-plugin";
// Used to run GoToSocial command
import { exec, spawn } from "child_process";

const createService = async (email, username, domain, password) => {
	const slug = domain.split(".")[0];

	const cmd = "./gotosocial/gotosocial";
	const cmdOpts = [
		"--config-path",
		"./gotosocial/config-" + slug + ".yaml",
		"admin",
		"account",
		"create",
		"--username",
		username,
		"--email",
		email,
		"--password",
		password,
	];

	console.log("CMD", cmd);
	console.log("OPTS", cmdOpts);

	const gts = spawn(cmd, cmdOpts);

	gts.stdout.on("data", (data) => {
		console.log(`stdout: ${data}`);
	});

	gts.stderr.on("data", (data) => {
		console.error(`stderr: ${data}`);
	});

	gts.on("close", (code) => {
		console.log(`child process exited with code ${code}`);
	});
};

const servicePassword = async (username, domain, password) => {
	const slug = domain.split(".")[0];

	const cmd = "./gotosocial/gotosocial";
	const cmdOpts = [
		"--config-path",
		"./gotosocial/config-" + slug + ".yaml",
		"admin",
		"account",
		"password",
		"--username",
		username,
		"--password",
		password,
	];

	const gts = spawn(cmd, cmdOpts);

	gts.stdout.on("data", (data) => {
		console.log(`stdout: ${data}`);
	});

	gts.stderr.on("data", (data) => {
		console.error(`stderr: ${data}`);
	});

	gts.on("close", (code) => {
		console.log(`child process exited with code ${code}`);
	});
};

const GtsFediverseService = (postgres) => {
	const getAccountsByCredentialUid = async (credentialUid) => {
		const client = await postgres.connect();

		try {
			const result = await client.query(
				`SELECT 
            f.username,
            r.domain,
            f.created_at AS createdAt,
            f.status
          FROM entity.credential c
            JOIN entity.fediverse f ON f.member_id = c.member_id
            JOIN entity.realm r ON r.id = f.realm_id
            WHERE c.uid = $1
        `,
				[credentialUid],
			);

			return { accounts: result.rows };
		} catch (e) {
			console.log(e);
		} finally {
			// Release the client immediately after query resolves, or upon error
			client.release();
		}
	};

	const checkAvailability = async (credentialUid, request) => {
		const client = await postgres.connect();

		const username = request.body.username.toLowerCase();

		try {
			const result = await client.query(
				`SELECT 
          f.username,
          f.status,
          r.domain,
          f.member_id = c.member_id AS memberOwned
        FROM entity.fediverse f
        INNER JOIN entity.realm r ON r.id = f.realm_id
        INNER JOIN entity.credential c ON c.uid = $1
        WHERE 
          r.domain = ANY ($3)
        AND (
          f.username = $2 
          OR
          f.member_id = c.member_id
          )
        `,
				[credentialUid, username, request.body.domains],
			);

			const available = [];
			const usernameClaimed = [];
			const realmExhausted = [];

			// Each returned row is NOT available, the remainder are available.
			for (const row of result.rows) {
				if (row.memberOwned) {
					realmExhausted.push(row.domain);
				} else {
					usernameClaimed.push(row.domain);
				}
			}

			for (const dom of request.body.domains) {
				if (!usernameClaimed.includes(dom) && !realmExhausted.includes(dom)) {
					available.push(dom);
				}
			}

			return {
				username: username,
				domains: {
					available: available,
					usernameClaimed: usernameClaimed,
					realmExhausted: realmExhausted,
				},
			};
		} catch (e) {
			console.log(e);
		} finally {
			// Release the client immediately after query resolves, or upon error
			client.release();
		}
	};

	const claimUsername = async (credentialUid, request) => {
		const client = await postgres.connect();

		const username = request.body.username.toLowerCase();

		try {
			const result = await client.query(
				`
        INSERT INTO entity.fediverse(username, realm_id, status, member_id)
        SELECT 
          $2 AS username, 
          r.id AS realm_id,
          'reserved' AS status, 
          (SELECT * FROM entity.member_id_by_credential_uid($1) AS member_id
          )
        FROM entity.realm r
        WHERE r.domain = ANY ($3)
        `,
				[credentialUid, username, request.body.domains],
			);

			return {
				username: username,
				domains: {
					claimed: request.body.domains,
				},
			};
		} catch (e) {
			console.log("CLAIM ERROR", e);
			return {
				error: "username not available",
			};
		} finally {
			// Release the client immediately after query resolves, or upon error
			client.release();
		}
	};

	const _setFediverseProcessing = async (credentialUid, fediDomain) => {
		const client = await postgres.connect();

		try {

			const result = await client.query(
				`
				UPDATE entity.fediverse AS f
				SET status = 'processing'
				FROM entity.member m 
				WHERE m.id = f.member_id
				AND f.realm_id = (SELECT r.id FROM entity.realm r WHERE r.domain = $2)
				AND f.member_id = entity.member_id_by_credential_uid($1)
				RETURNING f.id AS "fediverseId", f.username, f.status, f.updated_at AS "updatedAt", m.email
				`,
				[credentialUid, fediDomain],
			);

			console.log('START RESULT', result)

			return result.rows[0];

		} catch (e) {
			console.log("ERROR IN PROCESSING", e);
			return {
				error: "unable to update fediverse record",
			};
		} finally {
			// Release the client immediately after query resolves, or upon error
			client.release();
		}
	};

	const _setFediverseProvisioned = async (fediverseId) => {
		const client = await postgres.connect();

		try {

			const result = await client.query(
				`
				UPDATE entity.fediverse 
				SET status = 'active'
				WHERE id = $1
				RETURNING status, updated_at AS "updatedAt"
				`,
				[fediverseId],
			);

			console.log('END RESULT', result)

			return result;

		} catch (e) {
			console.log("ERROR SETTING PROVISIONED", e);
			return {
				error: "unable to set fediverse status provisioned",
			};
		} finally {
			// Release the client immediately after query resolves, or upon error
			client.release();
		}
	};

	const provisionUsername = async (credentialUid, request) => {
		if (credentialUid && request.body.domain && request.body.password) {

			// Update Fediverse account status to 'processing'
			// Return the Fediverse account id, and the member ID and email
			const fediData = await _setFediverseProcessing(credentialUid, request.body.domain);

			console.log('FEDIDATA', fediData);
			// Call GTS Binary w/ domain specific config
			// Update the account to 'active'
			// // Call the GTS shell script
			// const serviceResult = await createService(
			// 	newService.email,
			// 	newService.username,
			// 	domain,
			// 	password,
			// );
			// console.log("SHELL RESULT\n", serviceResult);
			const finalData = await _setFediverseProvisioned(fediData.fediverseId);

			console.log('FEDIDATA', finalData);

			return {
				username: fediData.username,
				domain: request.body.domain,
				status: finalData.status,
				updatedAt: finalData.updatedAt,
			}
		}
	};

	const usernamePassword = async (credentialUid, request) => {
		if (credentialUid && request.body.domain && request.body.password) {

			// Update Fediverse account status to 'processing'
			// Return the Fediverse account id, and the member ID and email
			const fediData = await _setFediverseProcessing(credentialUid, request.body.domain);

			console.log('FEDIDATA', fediData);
			// Call GTS Binary w/ domain specific config
			// Update the account to 'active'
			// // Call the GTS shell script
			// const serviceResult = await createService(
			// 	newService.email,
			// 	newService.username,
			// 	domain,
			// 	password,
			// );
			// console.log("SHELL RESULT\n", serviceResult);
			const finalData = await _setFediverseProvisioned(fediData.fediverseId);

			console.log('FEDIDATA', finalData);

			return {
				username: fediData.username,
				domain: request.body.domain,
				status: finalData.status,
				updatedAt: finalData.updatedAt,
			}



			// return {
			// 	status: "OK",
			// 	service: {
			// 		status: "active",
			// 		createdAt: newService.createdAt,
			// 	},
			// };
		}
	};

	//   /**
	//    * Create a Fediverse account.
	//    *
	//    * @param {*} memberUid
	//    * @param {*} domain
	//    * @param {*} password
	//    * @returns
	//    */
	//   const provision = async (memberUid, domain, password) => {
	//     if (memberUid && domain && password) {

	//       // @todo Test password strength before sending to GTS

	//       const newService = await _initService(memberUid, domain);
	//       console.log('NEW SERVICE\n', newService);

	//       // Call the GTS shell script
	//       const serviceResult = await createService(newService.email, newService.username, domain, password);
	//       console.log('SHELL RESULT\n', serviceResult);

	//       await _activateService(newService.accountId, 'fediverse');

	//       return {
	//         status: "OK",
	//         service: {
	//           status: 'active',
	//           createdAt: newService.createdAt
	//         },
	//       };

	//     } else {
	//       throw new Error("Unable to create a Fediverse account.");
	//     }
	//   };

	//   /**
	//    * Create a Fediverse account.
	//    *
	//    * @param {*} memberUid
	//    * @param {*} domain
	//    * @param {*} password
	//    * @returns
	//    */
	//   const password = async (memberUid, domain, password) => {
	//       if (memberUid && domain && password) {

	//         // @todo Test password strength before sending to GTS

	//         const existingService = await _getService(memberUid, domain);
	//         console.log('EXISTING SERVICE\n', existingService);

	//         // Call the GTS shell script
	//         const serviceResult = await servicePassword(existingService.username, domain, password);
	//         console.log('SHELL RESULT\n', serviceResult);

	//         await _updateStatus(existingService.account_id, 'fediverse', 'active');

	//         return {
	//           status: "OK",
	//           service: {
	//             status: 'updated'
	//           },
	//         };

	//       } else {
	//         throw new Error("Unable to update password.");
	//       }
	//     };

	//   const _getService = async (memberUid, domain) => {
	//     const client = await postgres.connect();

	//     console.log("CREATE SERVICE", memberUid, domain);

	//     try {
	//       const { rows } = await client.query(
	//         `SELECT
	//         account_id AS "accountId",
	//         username,
	//         status
	//       FROM member_account_service($1, $2, 'fediverse')`,
	//         [memberUid, domain]
	//       );
	//       const result = rows[0];
	//         console.log('FEDIVERSE SERVICE\n', result)
	//       return result;
	//     } catch (e) {

	//     } finally {
	//       // Release the client immediately after query resolves, or upon error
	//       client.release();
	//     }
	//   }

	//   /**
	//    * Initialize Fediverse account, reserving the username.
	//    *
	//    * @param {*} memberUid
	//    * @param {*} domain
	//    */
	//   const _initService = async (memberUid, domain) => {
	//     const client = await postgres.connect();

	//     console.log("CREATE SERVICE", memberUid, domain);

	//     try {
	//       const { rows } = await client.query(
	//         `SELECT
	//         account_id AS "accountId",
	//         email,
	//         username,
	//         created_at AS "createdAt"
	//       FROM init_service('fediverse', $1, $2)`,
	//         [memberUid, domain]
	//       );
	//       const result = rows[0];
	//         console.log('FEDIVERSE SERVICE\n', result)
	//       return result;
	//     } catch (e) {

	//     } finally {
	//       // Release the client immediately after query resolves, or upon error
	//       client.release();
	//     }

	//   };

	//   /**
	//    * Set account active.
	//    *
	//    * @param {*} accountId
	//    * @param {*} service
	//    * @returns
	//    */
	//   const _activateService = async (accountId, service) => {
	//     const client = await postgres.connect();
	//     try {
	//       await client.query(`UPDATE account_service SET status = 'active'
	//       WHERE account_id = $1
	//       AND service = $2`, [
	//         accountId, service
	//       ]);
	//     } catch (e) {
	//       console.log(e);
	//     } finally {
	//       // Release the client immediately after query resolves, or upon error
	//       client.release();
	//     }
	//   };

	//   /**
	//    * Set account active.
	//    *
	//    * @param {*} accountId
	//    * @returns
	//    */
	//   const _updateStatus = async (accountId, service, status) => {
	//     const client = await postgres.connect();
	//     try {
	//       await client.query(`UPDATE account_service SET status = $1
	//       WHERE account_id = $2 AND service = $3`, [
	//         status, accountId, service
	//       ]);
	//     } catch (e) {
	//       console.log(e);
	//     } finally {
	//       // Release the client immediately after query resolves, or upon error
	//       client.release();
	//     }
	//   };

	return {
		getAccountsByCredentialUid,
		checkAvailability,
		claimUsername,
		provisionUsername,
		usernamePassword
		// provision,
		// password,
	};
};

export default fp((fastify, options, next) => {
	fastify.decorate("gtsFediverseService", GtsFediverseService(fastify.pg));
	next();
});

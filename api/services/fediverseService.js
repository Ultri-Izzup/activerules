import fp from "fastify-plugin";
// Used to run GoToSocial command
import { exec, spawn } from "child_process";

const createService = async (email, username, domain, password) => {
  const slug = domain.split(".")[0];

  const cmd = './gotosocial/gotosocial';
  const cmdOpts = [
    '--config-path',
    './gotosocial/config-' + slug + '.yaml',
    'admin',
    'account',
    'create',
    '--username',
    username,
    '--email',
    email,
    '--password',
    password
  ];

  const gts = spawn(cmd, cmdOpts);

  gts.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  
  gts.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
  
  gts.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  }); 

};

const servicePassword = async (username, domain, password) => {
  const slug = domain.split(".")[0];

  const cmd = './gotosocial/gotosocial';
  const cmdOpts = [
    '--config-path',
    './gotosocial/config-' + slug + '.yaml',
    'admin',
    'account',
    'password',
    '--username',
    username,
    '--password',
    password
  ];

  const gts = spawn(cmd, cmdOpts);

  gts.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  
  gts.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
  
  gts.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  }); 
};

const FediverseService = (postgres) => {
  /**
   * Get authenticated member accounts.
   *
   * @param {*} userId
   * @returns
   */
  const getService = async (userId, domain) => {
    const client = await postgres.connect();

    try {
      const result = await client.query(
        `SELECT 
            username,
            domain,
            account_host AS "accountHost",
            fediverse_host AS "fediverseHost",
            matrix_host AS "matrixHost",
            created_at AS "createdAt",
            status 
          FROM member_accounts(
          $1
        )`,
        [userId]
      );

      return { accounts: result.rows };
    } catch (e) {
      console.log(e);
    } finally {
      // Release the client immediately after query resolves, or upon error
      client.release();
    }
  };

  /**
   * Create a Fediverse account.
   *
   * @param {*} memberUid
   * @param {*} domain
   * @param {*} password
   * @returns
   */
  const provision = async (memberUid, domain, password) => {
    if (memberUid && domain && password) {

      // @todo Test password strength before sending to GTS
      
      const newService = await _initService(memberUid, domain);
      console.log('NEW SERVICE\n', newService);

      // Call the GTS shell script
      const serviceResult = await createService(newService.email, newService.username, domain, password);
      console.log('SHELL RESULT\n', serviceResult);

      await _activateService(newService.accountId, 'fediverse');

      return {
        status: "OK",
        service: {
          status: 'active',
          createdAt: newService.createdAt
        },
      };

    } else {
      throw new Error("Unable to create a Fediverse account.");
    }
  };

  /**
   * Create a Fediverse account.
   *
   * @param {*} memberUid
   * @param {*} domain
   * @param {*} password
   * @returns
   */
  const password = async (memberUid, domain, password) => {
      if (memberUid && domain && password) {
  
        // @todo Test password strength before sending to GTS
        
        const existingService = await _getService(memberUid, domain);
        console.log('EXISTING SERVICE\n', existingService);
  
        // Call the GTS shell script
        const serviceResult = await servicePassword(existingService.username, domain, password);
        console.log('SHELL RESULT\n', serviceResult);

        await _updateStatus(existingService.account_id, 'fediverse', 'active'); 

        return {
          status: "OK",
          service: {
            status: 'updated'
          },
        };
  
      } else {
        throw new Error("Unable to update password.");
      }
    };

  const _getService = async (memberUid, domain) => {
    const client = await postgres.connect();

    console.log("CREATE SERVICE", memberUid, domain);

    try {
      const { rows } = await client.query(
        `SELECT 
        account_id AS "accountId",
        username,
        status
      FROM member_account_service($1, $2, 'fediverse')`,
        [memberUid, domain] 
      );
      const result = rows[0];
        console.log('FEDIVERSE SERVICE\n', result)
      return result;
    } catch (e) {

    } finally {
      // Release the client immediately after query resolves, or upon error
      client.release();
    }
  }

  /**
   * Initialize Fediverse account, reserving the username.
   *
   * @param {*} memberUid
   * @param {*} domain
   */
  const _initService = async (memberUid, domain) => {
    const client = await postgres.connect();

    console.log("CREATE SERVICE", memberUid, domain);

    try {
      const { rows } = await client.query(
        `SELECT 
        account_id AS "accountId",
        email, 
        username,
        created_at AS "createdAt"
      FROM init_service('fediverse', $1, $2)`,
        [memberUid, domain] 
      );
      const result = rows[0];
        console.log('FEDIVERSE SERVICE\n', result)
      return result;
    } catch (e) {

    } finally {
      // Release the client immediately after query resolves, or upon error
      client.release();
    }

  };

  /**
   * Set account active.
   *
   * @param {*} accountId
   * @param {*} service
   * @returns
   */
  const _activateService = async (accountId, service) => {
    const client = await postgres.connect();
    try {
      await client.query(`UPDATE account_service SET status = 'active' 
      WHERE account_id = $1
      AND service = $2`, [
        accountId, service
      ]);
    } catch (e) {
      console.log(e);
    } finally {
      // Release the client immediately after query resolves, or upon error
      client.release();
    }
  };

  /**
   * Set account active.
   *
   * @param {*} accountId
   * @returns
   */
  const _updateStatus = async (accountId, service, status) => {
    const client = await postgres.connect();
    try {
      await client.query(`UPDATE account_service SET status = $1 
      WHERE account_id = $2 AND service = $3`, [
        status, accountId, service
      ]);
    } catch (e) {
      console.log(e);
    } finally {
      // Release the client immediately after query resolves, or upon error
      client.release();
    }
  };

  return {
    getService,
    provision,
    password,
  };
};

export default fp((server, options, next) => {
  server.decorate("fediverseService", FediverseService(server.pg));
  next();
});

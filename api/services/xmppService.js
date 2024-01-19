import fp from "fastify-plugin";
// Used to run shell command
import { exec } from "child_process";

const createService = async (email, username, domain, password) => {

  const slug = domain.split('.')[0]

  const goToSocialCommand = [
    "./gotosocial/gotosocial --config-path ./gotosocial/config-" + slug + ".yaml admin account create",
  ];
  goToSocialCommand.push(...["--username", username]);
  goToSocialCommand.push(...["--email", email]);
  goToSocialCommand.push(...["--password", password]);

  const commandStr = goToSocialCommand.join(" ");

  // console.log("SHELL COMMAND \n", commandStr);

  // Run shell command to add the user
  exec(commandStr, (err, output) => {
    // once the command has completed, the callback function is called
    if (err) {
      // log and return if we encounter an error
      console.error("could not execute command: ", err);
      return;
    }
    // log the output received from the command
    console.log("SHELL RESULT: \n", output);
  });
}

const servicePassword = async (email, username, domain, password) => {

    const slug = domain.split('.')[0]
  
    const goToSocialCommand = [
      "./gotosocial/gotosocial --config-path ./gotosocial/config-" + slug + ".yaml admin account create",
    ];
    goToSocialCommand.push(...["--username", username]);
    goToSocialCommand.push(...["--email", email]);
    goToSocialCommand.push(...["--password", password]);
  
    const commandStr = goToSocialCommand.join(" ");
  
    // console.log("SHELL COMMAND \n", commandStr);
  
    // Run shell command to add the user
    exec(commandStr, (err, output) => {
      // once the command has completed, the callback function is called
      if (err) {
        // log and return if we encounter an error
        console.error("could not execute command: ", err);
        return;
      }
      // log the output received from the command
      console.log("SHELL RESULT: \n", output);
    });
}

const XmppService = (postgres) => {

    /**
     * Get authenticated member account info.
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

        return { accounts : result.rows } ;
        
        } catch(e) {
        console.log(e) 
        } finally {
        // Release the client immediately after query resolves, or upon error
        client.release();
        }

    };

    /**
     * Provision an Account
     * 
     * @param {*} memberUid 
     * @param {*} username 
     * @param {*} domain 
     * @param {*} password 
     * @param {*} opts 
     * @returns 
     */
    const provisionService = async (memberUid, username, domain, password, opts) => {
    
        if(memberUid && username && domain && password) {
        
        // Call the shell script
        console.log('Creating account')
        const gtsResult = gtsCreate(email, username, domain, password);
        //console.log(gtsResult);

        await _enableAccount(accountId);

        const fediverseServer = fediHost + '.' + domain;

        return {
            status: "OK",
            account: {
            username: username,
            fediverseAddress: '@' + username + '@' + domain,
            fediverseHost: fediverseServer,
            fediversePage: 'https://' + fediverseServer + '/@' + username,
            matrixHost: matrixHost ? matrixHost + '.' + domain : '',
            matrixAddress: matrixHost ? '@' + username + ':' + domain : '',
            signInEmail: email
            }
        }

        } else {
        throw new Error('Unable to create a Fediverse account.'); 
        }
    };

    /**
     * Update Password
     * 
     * @param {*} memberUid 
     * @param {*} username 
     * @param {*} domain 
     * @param {*} password 
     * @returns 
     */
    const servicePassword = async (memberUid, username, domain, password) => {

    if(memberUid && username && domain && password) {
        
        // Call the shell script
        console.log('Creating account')
        const gtsResult = gtsCreate(email, username, domain, password);
        //console.log(gtsResult);

        await _enableAccount(accountId);

        const fediverseServer = fediHost + '.' + domain;

        return {
        status: "OK",
        account: {
            username: username,
            fediverseAddress: '@' + username + '@' + domain,
            fediverseHost: fediverseServer,
            fediversePage: 'https://' + fediverseServer + '/@' + username,
            matrixHost: matrixHost ? matrixHost + '.' + domain : '',
            matrixAddress: matrixHost ? '@' + username + ':' + domain : '',
            signInEmail: email
        }
        }

    } else {
        throw new Error('Unable to create a Fediverse account.'); 
    }
  };

  const _activateService = async (accountServiceId) => {

  }

  return { 
    getService,
    provisionService,
    servicePassword
  };

};

export default fp((server, options, next) => {
  server.decorate("xmppService", XmppService(server.pg));
  next();
});

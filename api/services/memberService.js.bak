import fp from "fastify-plugin";
// Used to run GoToSocial command
import { exec } from "child_process";

import blockedUsernames from "../js/blockedUsernames.js";

const MemberService = (postgres) => {

  /**
   * Check if username available
   * 
   * @param {*} username 
   * @param {*} domain 
   * @returns 
   */
  const usernameAvailable = async (username, domain) => {

    if(username.length < 5 || username.length > 30) {
      return { 
        available: false
      };
    }

    if(blockedUsernames.has(username)) {
      return { 
        available: false
      };
    }

    const client = await postgres.connect();

    try {
      const { rows } = await client.query(
        `SELECT username_available
          FROM username_available($1, $2)`,
        [username, domain]
      );
      return { 
        available: rows[0].username_available
      };
    } catch(e) {
      console.log(e) 
    } finally {
      // Release the client immediately after query resolves, or upon error
      client.release();
    }

  };

  /**
   * Check if username available for a particular member.
   * Determines if the member already an account in the domain.
   * 
   * @param {*} memberUid 
   * @param {*} username 
   * @param {*} domain 
   * @returns 
   */
    const memberUsernameAvailable = async (memberUid, username, domain) => {

      if(username.length < 5 || username.length > 30) {
        return { 
          available: false,
          message: 'Username must be between 5 and 30 characters.'
        };
      }
  
      if(blockedUsernames.has(username)) {
        return { 
          available: false,
          message: 'Username unavailable'
        };
      }
  
      const client = await postgres.connect();
  
      let available = false;
  
      console.log(username, domain)
  
      try {
        const { rows } = await client.query(
          `SELECT *
            FROM verify_username_available($1, $2, $3)`,
          [memberUid, username, domain]
        );

        const status =  rows[0].verify_username_available;
        if(status == 'available') {
          return { 
            available: true
          };
        } else if(status == 'realm_limit') {
          return { 
            available: false,
            message: 'Account already created in ' + domain
          };
        } else  {
          return { 
            available: false,
            message: 'Username unavailable'
          };
        }

        
      } catch(e) {
        console.log(e) 
      } finally {
        // Release the client immediately after query resolves, or upon error
        client.release();
      }
  
    };

  /**
   * Get authenticated member accounts.
   * 
   * @param {*} userId 
   * @returns 
   */
  const getMemberById = async (userId) => {
    const client = await postgres.connect();

    try {
      const result = await client.query(
        `SELECT 
            username,
            domain,
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

  const getRealmServices = async (userId, realm) => {
    const client = await postgres.connect();

    try {
      const result = await client.query(
        `SELECT 
            service,
            status 
          FROM member_account_services(
          $1, $2
        )`,
        [userId, realm]
      );

      console.log('RREERREESULT'. result)

      return { services : result.rows } ;
      
    } catch(e) {
      console.log('REALM SERVICE ERROR\b', e) 
    } finally {
      // Release the client immediately after query resolves, or upon error
      client.release();
    }
  }


  /**
   * Log cookie or policy consent, or removal, for a member.
   * 
   * @param {*} memberUid 
   * @param {*} target 
   * @param {*} version 
   * @param {*} consented 
   */
  const logConsent = async (memberUid, target, version, consented) => {
    
    const client = await postgres.connect();

    console.log('LOG CONSENT', memberUid, target, version, consented)

    try {
      const result = await client.query(
        `INSERT INTO member_consent(member_id, type, policy_version, consented)
          VALUES((SELECT id from member WHERE uid = $1), $2, $3, $4)`,
        [memberUid, target, version, consented]
      );
      console.log(result);
    } catch(e) {
      console.log(e) 
    } finally {
      // Release the client immediately after query resolves, or upon error
      client.release();
    }
  }

  /**
   * Claim a username.
   * 
   * @param {*} memberUid 
   * @param {*} username 
   * @param {*} domain 
   */
    const claimUsername = async (memberUid, username, domain) => {

      const client = await postgres.connect();
  
      console.log('CLAIM USERNAME', memberUid, username, domain);

      const charCount = username.length;
      if(charCount < 5) {
        return { 
          status: "ERROR",
          message: 'username_too_short',
          username: username,
          domain: domain
        }
      } 
      if(charCount > 30) {
        return { 
          status: "ERROR",
          message: 'username_too_long',
          username: username,
          domain: domain
        }
      }
      if(username != username.toLowerCase()) {
        return { 
          status: "ERROR",
          message: 'no_uppercase',
          username: username,
          domain: domain
        }
      }
      const regex = /^[a-z0-9_]*$/
      if(!regex.test(username)) {
        return { 
          status: "ERROR",
          message: 'invalid_characters',
          username: username,
          domain: domain
        }
      }
  
      try {
        const { rows } = await client.query(
          `SELECT 
            account_id AS "accountId", 
            created_at AS "createdAt"
          FROM claim_username($1, $2, $3)`,
          [memberUid, username, domain]
        );
      
          const result = rows[0];
          return { 
            status: "OK",
            createdAt: result.createdAt,
            username: username,
            domain: domain
          }
      
 
      } catch(e) {
        console.log(e) 
        return { 
          status: "ERROR",
          message: 'username_unavailable',
          username: username,
          domain: domain
        }
      } finally {
        // Release the client immediately after query resolves, or upon error
        client.release();
      }
  
    }

  /**
   * Check a username across 
   * Determines if the member already an account in the domain.
   * 
   * @param {*} memberUid 
   * @param {*} username 
   * @param {*} domain 
   * @returns 
   */
    const checkAvailabilityMulti = async (memberUid, username, domains) => {

      const lowerDomains = domains.map(domain => domain.toLowerCase());

        if(username.length < 5 || username.length > 30) {
        return { 
          available: false,
          message: 'Username must be between 5 and 30 characters.'
        };
      }
  
      if(blockedUsernames.has(username)) {
        return { 
          available: false,
          message: 'Username unavailable'
        };
      }
  
      const client = await postgres.connect();
  
      let available = false;
  
      try {
        const result = await client.query(
          `SELECT 
            unavailable
          FROM member_username_unavailable_multi($1, $2, $3)`,
          [memberUid, username, lowerDomains]
        );

        if(result.rowCount === 0) {
          return {
            status: "OK",
            username: username,
            available: lowerDomains,
            unavailable: []
          }
        } else {

          const unavailable = result.rows[0].unavailable;

          unavailable.forEach(dom => {
            const ix = lowerDomains.indexOf(dom);
            lowerDomains.splice(ix, 1);
          })
          
          return {
            status: "OK",
            username: username,
            available: lowerDomains,
            unavailable: unavailable
          }
        }
        
      } catch(e) {
        console.log(e) 
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
  const _enableAccount = async (accountId) => {
    const client = await postgres.connect();

    console.log('ENABLE ACCOUNT', accountId)

    try {
      await client.query(
        `UPDATE account SET status = 'active' WHERE id = $1`,
        [accountId]
      );
    } catch(e) {
      console.log(e) 
    } finally {
      // Release the client immediately after query resolves, or upon error
      client.release();
    }
  }

  return { 
    usernameAvailable, 
    memberUsernameAvailable, 
    checkAvailabilityMulti,
    getMemberById, 
    getRealmServices,
    logConsent,
    claimUsername
  };
};

export default fp((server, options, next) => {
  server.decorate("memberService", MemberService(server.pg));
  next();
});

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
  const getAccounts = async (credentialUid) => {

    const client = await postgres.connect();

    try {
      const { rows } = await client.query(
        `SELECT 
        member_uid AS "memberUid",
        display_name AS "displayName",
        created_at AS "createdAt",
        email,
        account_name AS "accountName",
        related AS "accountId",
        related_at AS "accountCreatedAt",
        domain
        FROM entity.member_accounts($1)`,
        [credentialUid]
      );
      return rows;
    } catch(e) {
      console.log(e) 
    } finally {
      // Release the client immediately after query resolves, or upon error
      client.release();
    }

  };

  return { 
    getAccounts
  };
};

export default fp((server, options, next) => {
  server.decorate("memberService", MemberService(server.pg));
  next();
});

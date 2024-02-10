import fp from "fastify-plugin";

// Used to run GoToSocial command
import { exec } from "child_process";

import blockedUsernames from "../js/blockedUsernames.js";

const MemberService = (postgres) => {

  const getMemberByCredentialUid = async (credentialUid) => {

    const client = await postgres.connect();

    try {
      const { rows } = await client.query(
        `SELECT 
        display_name AS "displayName",
        realm
        FROM entity.member_by_credential_uid($1)`,
        [credentialUid]
      );
    
      return rows[0];

    } catch(e) {
      console.log(e) 
    } finally {
      // Release the client immediately after query resolves, or upon error
      client.release();
    }

  };

  return { 
    getMemberByCredentialUid
  };
};

export default fp((server, options, next) => {
  server.decorate("memberService", MemberService(server.pg));
  next();
});

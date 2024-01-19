import fp from "fastify-plugin";

const RealmService = (postgres) => {

  const getAll = async () => {

    const client = await postgres.connect();

    try {
      const { rows } = await client.query(
        `
        SELECT 
          domain,
          display,
          account_host AS "accountHost",
          fediverse_host AS "fediverseHost",
          matrix_host AS "matrixHost",
          sip_host AS "sipHost",
          xmpp_host AS "xmppHost",
          services::text[]
        FROM public.realm
        WHERE 'fediverse' = ANY (services)
        ORDER BY display ASC
        `
      );
      return { 
        domains: rows
      };
    } catch(e) {
      console.log(e) 
    } finally {
      // Release the client immediately after query resolves, or upon error
      client.release();
    }

  };

  return { getAll };
};

export default fp((server, options, next) => {
  server.decorate("realmService", RealmService(server.pg));
  next();
});

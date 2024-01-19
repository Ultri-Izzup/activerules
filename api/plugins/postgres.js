"use strict";
import fp from "fastify-plugin";
import fastifyPostgres from "@fastify/postgres";

export default fp((server, opts, done) => {
  // server.register(fastifyPostgres, {
  //   connectionString: server.config.API_POSTGRES_URI /* other postgres options */,
  // });
  server.register(fastifyPostgres, {
    host: server.config.POSTGRES_SERVER,
    user: server.config.POSTGRES_USER,
    password: server.config.POSTGRES_PASSWORD,
    database: server.config.DB_NAME
  });

  done();
});

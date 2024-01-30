import fastifyPlugin from "fastify-plugin";
import { verifySession } from "supertokens-node/recipe/session/framework/fastify/index.js";

async function routes(server, options) {

  server.get(
    "/health/reflect",
    {
      schema: {
        description:
          "Reflect the client info the API received",
        tags: ["health"],
        summary: "Get the client info, used for debugging connections",
        response: {
          200: {
            description: "Success Response",
            type: "object",
            properties: {
              ip: { type: "string" },
              hostname: { type: "string"}
            },
          },
        },
      },
    },
    async (request, reply) => {
        return { 
            ip: request.ip,
            hostname: request.hostname
        };
    }
  );
}

export default fastifyPlugin(routes);
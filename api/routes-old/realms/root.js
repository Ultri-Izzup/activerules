import fastifyPlugin from "fastify-plugin";
import { verifySession } from "supertokens-node/recipe/session/framework/fastify/index.js";

async function fediverseRoutes(server, options) {

  server.get("/realms",
  {
    schema: {
      description:
        "Get realms, domains and services",
      tags: ["realms"],
      summary: "Returns all realm and domain data for the app",
      response: {
        200: {
          description: "Success Response",
          type: "object",
          properties: {
            domains: { 
              type: "array" ,
              items: {
                type: "object",
                properties: {
                  domain: {type: "string"},
                  display: {type: "string"},
                  accountHost: {type: "string"},
                  fediverseHost: {type: "string"},
                  matrixHost: {type: "string"},
                  xmppHost: {type: "string"},
                  sipHost: {type: "string"},
                  services: {
                    type: "array",
                    items: {type: "string"}
                  },
                }
              }
            },
          },
        },
      },
    },
  },
  async (request, reply) => {

    const result = await server.realmService.getAll();

    return result;
  
  });
  
}

export default fastifyPlugin(fediverseRoutes);
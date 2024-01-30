import fastifyPlugin from "fastify-plugin";
import { verifySession } from "supertokens-node/recipe/session/framework/fastify/index.js";

async function fediverseRoutes(server, options) {

  server.post("/fediverse/username/available",
  {
    schema: {
      description:
        "Check if a username is available",
      tags: ["public"],
      summary: "Return true/false if the username is avilable for a new member.",
      response: {
        200: {
          description: "Success Response",
          type: "object",
          properties: {
            available: { type: "boolean" },
          },
        },
      },
    },
  },
  async (request, reply) => {

    const result = await server.memberService.usernameAvailable(request.body.username, request.body.domain);

    return result;
  
  });
  
}

export default fastifyPlugin(fediverseRoutes);
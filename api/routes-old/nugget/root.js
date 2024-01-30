import fastifyPlugin from "fastify-plugin";
import { verifySession } from "supertokens-node/recipe/session/framework/fastify/index.js";

async function memberRoutes(server, options) {
  server.get("/nugget/:nuggetUid",
  {
    preHandler: verifySession(),
    schema: {
      description:
        "Get a nugget",
      tags: ["nugget"],
      summary: "Return all permitted data for the nugget",
      response: {
        200: {
          description: "Success Response",
          type: "object",
          properties: {
            member: { 
              type: "object",
              properties: {
                userId: {type: "string"},
                email: {type: "string"},
                username: {type: "string"},
                admin: {type: "boolean"},
                moderator: {type: "boolean"},
                disabled: {type: "boolean"},
                approved: {type: "boolean"},
                bot: {type: "boolean"},
                locked: {type: "boolean"},
                gtsUserId: {type: "string"},
                accountId: {type: "string"},
                createdAt: {type: "string"},
                userUpdatedAt: {type: "string"},
                accountUpdatedAt: {type: "string"}
              }
            },
          },
        },
      },
    },
  },
  async (request, reply) => {
    let userId = request.session.getUserId();
    console.log("USERID", userId);

    const result = await server.memberService.getMemberByUid(userId);

    return result;
  
  });
}

export default fastifyPlugin(memberRoutes);
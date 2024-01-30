import fastifyPlugin from "fastify-plugin";
import { verifySession } from "supertokens-node/recipe/session/framework/fastify/index.js";

async function memberFediverseRoutes(server, options) {

  server.post("/member/fediverse",
  {
    preHandler: verifySession(),
    schema: {
      description:
        "Create a member's Fediverse account",
      tags: ["member"],
      summary: "Creates a user and account in GoToSocial",
      response: {
        200: {
          description: "Success Response",
          type: "object",
          properties: {
            fediverseAccount: {
              type: "object",
              properties: {
                username: { type: "string" },
                fediverseAddress: { type: "string" },
                fediverseHost: { type: "string" },
                fediversePage: { type: "string" },
                matrixHost: { type: "string"},
                matrixAddress: { type: "string"},
                signInEmail: { type: "string" },
              }
            }
          },
        },
      },
    },
  },
  async (request, reply) => {
    let userId = request.session.getUserId();
    console.log("USERID", userId);

    try {

      const result = await server.memberService.createFediverse(userId, request.body.username, request.body.domain, request.body.password);
      
      if(result.status == 'OK') {
        return {
          fediverseAccount: result.account
        }
      } else {
        reply.code(422);
        return { message: result.message };
      }

    } catch (e) {
      reply.code(500);
      return { message: 'Account creation failed' };
    }
  });

  server.post("/member/fediverse/password",
  {
    schema: {
      description:
        "Update a member's Fediverse password",
      tags: ["member"],
      summary: "Used by members for password updates.",
      response: {
        200: {
          description: "Success Response",
          type: "object",
          properties: {
            status: {type: "string"},
          },
        },
      },
    },
  },
  async (request, reply) => {
    let userId = request.session.getUserId();
    console.log("USERID", userId);

    const result = await server.memberService.createFediverse(userId, req.body.password);

    return result;
  
  });

}

export default fastifyPlugin(memberFediverseRoutes);
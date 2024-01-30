import fastifyPlugin from "fastify-plugin";
import { verifySession } from "supertokens-node/recipe/session/framework/fastify/index.js";

async function memberAccountRoutes(server, options) {
  server.get(
    "/member/account",
    {
      preHandler: verifySession(),
      schema: {
        description: "Get account info",
        tags: ["member"],
        summary: "Get provisioned accounts for a member",
        response: {
          200: {
            description: "Success Response",
            type: "object",
            properties: {
              services: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    service: { type: "string" },
                    status: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      
      const userId = request.session.getUserId();

      console.log("USERID", userId);

      const realm = request.params.accountRealm;
      console.log(realm);

      try {
        const result = await server.memberService.getAccounts(
          userId
        );

        console.log(result)

        return result;
      } catch (e) {
        console.log(e);
        reply.code(500);
        return { message: "Unable to fetch member accounts" };
      }
    }
  );

  server.post(
    "/member/account/fediverse",
    {
      preHandler: verifySession(),
      schema: {
        description: "Create a member's Fediverse account",
        tags: ["member"],
        summary: "Creates a user and account in GoToSocial",
        response: {
          200: {
            description: "Success Response",
            type: "object",
            properties: {
              status: { type: "string" },
              createdAt: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      let userId = request.session.getUserId();
      console.log("USERID", userId);

      try {
        const result = await server.fediverseService.provision(
          userId,
          request.body.domain,
          request.body.password
        );

        console.log("ROUTER RESULT\n", result);

        return result.service;
        
      } catch (e) {
        console.log(e);
        reply.code(500);
        return { message: "Account creation failed" };
      }
    }
  );

  server.post(
    "/member/account/fediverse/password",
    {
      preHandler: verifySession(),
      schema: {
        description: "Update a member's Fediverse password",
        tags: ["member"],
        summary: "Update a password in GoToSocial",
        response: {
          200: {
            description: "Success Response",
            type: "object",
            properties: {
              status: { type: "string" },
              createdAt: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      let userId = request.session.getUserId();
      console.log("USERID", userId);

      try {
        const result = await server.fediverseService.password(
          userId,
          request.body.domain,
          request.body.password
        );

        console.log("PASSWORD ROUTER RESULT\n", result);

        return result.service;
        
      } catch (e) {
        console.log(e);
        reply.code(500);
        return { message: "Password change failed" };
      }
    }
  );
}

export default fastifyPlugin(memberAccountRoutes);

import fastifyPlugin from "fastify-plugin";
import { verifySession } from "supertokens-node/recipe/session/framework/fastify/index.js";

async function memberFediverseRoutes(server, options) {
  server.post(
    "/member/fediverse/username/available",
    {
      preHandler: verifySession(),
      schema: {
        description: "Check if a Fediverse username is available",
        tags: ["member"],
        summary: "Check availability of a username in a realm",
        response: {
          200: {
            description: "Success Response",
            type: "object",
            properties: {
                available: { type: "boolean" }
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

        return { accounts: result };
      } catch (e) {
        console.log(e);
        reply.code(500);
        return { message: "Unable to fetch member accounts" };
      }
    }
  );

  server.post(
    "/member/fediverse/username/claim",
    {
      preHandler: verifySession(),
      schema: {
        description: "Claim an available Fediverse username",
        tags: ["member"],
        summary: "Assign username in realm to the member",
        response: {
          200: {
            description: "Success Response",
            type: "object",
            properties: {
                available: { type: "boolean" }
  
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

        return { accounts: result };
      } catch (e) {
        console.log(e);
        reply.code(500);
        return { message: "Unable to fetch member accounts" };
      }
    }
  );

  server.post(
    "/member/fediverse/username/provision",
    {
      preHandler: verifySession(),
      schema: {
        description: "Provision a claimed Fediverse username",
        tags: ["member"],
        summary: "Create the GoToSocial account",
        response: {
          200: {
            description: "Success Response",
            type: "object",
            properties: {
                available: { type: "boolean" }
  
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

        return { accounts: result };
      } catch (e) {
        console.log(e);
        reply.code(500);
        return { message: "Unable to fetch member accounts" };
      }
    }
  );
}

export default fastifyPlugin(memberFediverseRoutes);

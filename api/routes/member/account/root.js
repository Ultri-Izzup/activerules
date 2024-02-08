import { verifySession } from "supertokens-node/recipe/session/framework/fastify/index.js";

export default async (fastify, options) => {
    fastify.get("/",
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
              accounts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    memberUid: { type: "string" },
                    displayName: { type: "string" },
                    createdAt: { type: "string" },
                    email: { type: "string" },
                    accountName: { type: "string" },
                    accountId: { type: "string" },
                    accountCreatedAt: { type: "string" },
                    domain: { type: "string" }
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
        const result = await fastify.memberService.getAccounts(
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
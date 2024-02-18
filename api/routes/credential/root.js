import { verifySession } from "supertokens-node/recipe/session/framework/fastify/index.js";

export default async (fastify, options) => {
    fastify.get("/",
    {
      preHandler: verifySession(),
      schema: {
        description: "Get account info",
        tags: ["credential"],
        summary: "Get SuperTokens credential accounts for a member",
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
                    displayName: { type: "string" },
                    realm: { type: "string"}
                  }
                }
              }
            },
          },
        },
      },
    },
    async (request, reply) => {
      
      const userId = request.session.getUserId();

      try {
        const result = await fastify.memberService.getMemberByCredentialUid(
          userId
        );

        return {
          accounts: result
        };
      } catch (e) {
        console.log(e);
        reply.code(500);
        return { message: "Unable to fetch member accounts" };
      }
    }
  );
}
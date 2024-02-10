import { verifySession } from "supertokens-node/recipe/session/framework/fastify/index.js";

export default async (fastify, options) => {
    fastify.get("",
    {
      preHandler: verifySession(),
      schema: {
        description: "Get GoToSocial Fediverse account info",
        tags: ["fediverse"],
        summary: "Get GoToSocial Fediverse accounts for a member",
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
                    username: { type: "string" },
                    domain: { type: "string"},
                    createdAt: { type: "string" },
                    status: { type: "string" }
                  } 

                },
               
              }
            },
          },
        },
      },
    },
    async (request, reply) => {
      
      const userId = request.session.getUserId();

      try {
        const result = await fastify.gtsFediverseService.getAccountsByCredentialUid(
          userId
        );

        return result;
      } catch (e) {
        console.log(e);
        reply.code(500);
        return { message: "Unable to fetch member accounts" };
      }
    }
  );
}
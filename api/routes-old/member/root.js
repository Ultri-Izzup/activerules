import fastifyPlugin from "fastify-plugin";
import { verifySession } from "supertokens-node/recipe/session/framework/fastify/index.js";

async function memberRoutes(server, options) {
  server.get(
    "/member",
    {
      preHandler: verifySession(),
      schema: {
        description: "Get member Fediverse Accounts",
        tags: ["member"],
        summary:
          "Called on login or later to load current member accounts and status",
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
                    domain: { type: "string" },
                    accountHost: { type: "string" },
                    fediverseHost: { type: "string" },
                    matrixHost: { type: "string" },
                    createdAt: { type: "string" },
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
      let userId = request.session.getUserId();
      console.log("USERID", userId);

      const result = await server.memberService.getMemberById(userId);
      console.log("RESULT", result);

      return result;
    }
  );
}

export default fastifyPlugin(memberRoutes);

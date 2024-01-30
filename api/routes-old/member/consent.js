import fastifyPlugin from "fastify-plugin";
import { verifySession } from "supertokens-node/recipe/session/framework/fastify/index.js";

async function memberConsentRoutes(server, options) {

  server.post("/member/consent",
  {
    preHandler: verifySession(),
    schema: {
      description:
        "Log consent actions for policy and cookies",
      tags: ["member"],
      summary: "Log member consent or removal of consent, for particular cookies and policies.",
      response: {
        200: {
          description: "Success Response",
          type: "object",
          properties: {
            status: { type: "string" }
          },
        },
      },
    },
  },
  async (request, reply) => {
    let userId = request.session.getUserId();
    console.log("USERID", userId);

    const result = await server.memberService.logConsent(userId, request.body.target, request.body.version, request.body.consented);

    return { status: "OK" };
  
  });

}
export default fastifyPlugin(memberConsentRoutes);
import { verifySession } from "supertokens-node/recipe/session/framework/fastify/index.js";

export default async (fastify, options) => {
	fastify.post(
		"/provision",
		{
			preHandler: verifySession(),
			schema: {
				description: "Provision username",
				tags: ["fediverse"],
				summary: "Provision service for a claimed username.",
				body: {
					type: "object",
					properties: {
						domain: { type: "string" },
                        password: { type: "string" }
						},
				},
				response: {
					200: {
						description: "Success Response",
						type: "object",
			
						properties: {
							username:{ type: "string" },
							domain:{ type: "string" },
							status:{ type: "string" },
							updatedAt:{ type: "string" },
					
						},
					},
				},
			},
		},
		async (request, reply) => {
			const userId = request.session.getUserId();

			try {
				const result =
					await fastify.gtsFediverseService.provisionUsername(userId, request);

				return result;
			} catch (e) {
				console.log(e);
				reply.code(500);
				return { message: "Unable to provision GTS account" };
			}
		},
	);
};

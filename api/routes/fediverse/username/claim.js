import { verifySession } from "supertokens-node/recipe/session/framework/fastify/index.js";

export default async (fastify, options) => {
	fastify.post(
		"/claim",
		{
			preHandler: verifySession(),
			schema: {
				description: "Claim available username",
				tags: ["fediverse"],
				summary: "Claim a Fediverse username that is available in one or more domains",
				body: {
					type: "object",
					properties: {
						username: { type: "string" },
						domains: {
							type: "array",
							items: {
								type: "string",
							},
						},
					},
				},
				response: {
					200: {
						description: "Success Response",
						type: "object",
						properties: {
							username: { type: "string"},
							domains: {
								type: "object",
								properties: {
									claimed: {
										type: "array",
										items: {
											type: "string"
										}
									}
								}									
							}
						},
					},
					409: {
						description: "username unavailable",
						type: "object",
						properties: {
							message: { type: "string"}
						},
					},
				},
			},
		},
		async (request, reply) => {
			const userId = request.session.getUserId();

			try {
				const result =
				await fastify.gtsFediverseService.claimUsername(userId, request);

				if(result.error) {
					reply.code(409);
					return { message: "Username not available, try another" };
				}
					
				return result;
				
				
			} catch (e) {
				console.log(e);
				reply.code(500);
				return { message: "Unable to claim GTS Fediverse accounts" };
			}
		},
	);
};

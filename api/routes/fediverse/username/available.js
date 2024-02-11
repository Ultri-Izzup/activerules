import { verifySession } from "supertokens-node/recipe/session/framework/fastify/index.js";

export default async (fastify, options) => {
	fastify.post(
		"/available",
		{
			preHandler: verifySession(),
			schema: {
				description: "Username available",
				tags: ["fediverse"],
				summary: "Check if a username is available in one or more domains.",
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
							available: {
								type: "array",
								items: {
									type: "string",
								},
							},
							usernameClaimed: {
								type: "array",
								items: {
									type: "string",
								},
							},
							realmExhausted: {
								type: "array",
								items: {
									type: "string",
								},
							},
						},
					},
				},
			},
		},
		async (request, reply) => {
			const userId = request.session.getUserId();

			try {
				const result =
					await fastify.gtsFediverseService.checkAvailability(userId, request);
				console.log('REAALALLAL', result)
				return result;
			} catch (e) {
				console.log(e);
				reply.code(500);
				return { message: "Unable to check availablility of GTS accounts" };
			}
		},
	);
};

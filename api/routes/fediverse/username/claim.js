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
							success: {
								type: "array",
								items: {
									type: "string",
								},
							},
                            failed: {
								type: "array",
								items: {
									type: "string",
								},
							},
							realmLimit: {
								type: "array",
								items: {
									type: "string",
								},
							},
							taken: {
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
					await fastify.memberService.getMemberByCredentialUid(userId);

				return result;
			} catch (e) {
				console.log(e);
				reply.code(500);
				return { message: "Unable to claim GTS Fediverse accounts" };
			}
		},
	);
};

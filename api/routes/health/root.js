export default async (fastify, options) => {
    fastify.get('/', 
    {
        schema: {
          description:
            "This is an endpoint for basic API health check",
          tags: ["health"],
          summary: "Verify the app server is up",
          response: {
            200: {
              description: "Success Response",
              type: "object",
              properties: {
                status: { type: "string" },
              },
            },
          },
        },
      },
      async (request, reply) => {
        return {
          status: "OK",
        };
      });
}
export default async (fastify, options) => {
    fastify.get('/reflect', 
    {
        schema: {
          description:
            "Reflect the client info the API received",
          tags: ["health"],
          summary: "Get the client info, used for debugging connections",
          response: {
            200: {
              description: "Success Response",
              type: "object",
              properties: {
                ip: { type: "string" },
                hostname: { type: "string"}
              },
            },
          },
        },
      },
      async (request, reply) => {
          return { 
              ip: request.ip,
              hostname: request.hostname
          };
      }
    );

}
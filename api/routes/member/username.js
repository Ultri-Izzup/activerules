import fastifyPlugin from "fastify-plugin";
import { verifySession } from "supertokens-node/recipe/session/framework/fastify/index.js";

async function memberUsernameRoutes(server, options) {
  /**
   * Verify the username is valid for a particular member.
   */
  server.post(
    "/member/username/available",
    {
      preHandler: verifySession(),
      schema: {
        description: "Check if a username is available for a member",
        tags: ["member"],
        summary:
          "Return true/false if the username is avilable for a given member.",
        response: {
          200: {
            description: "Success Response",
            type: "object",
            properties: {
              username: { type: "string" },
              domain: { type: "string" },
              available: { type: "boolean" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      let userId = request.session.getUserId();

      const result = await server.memberService.memberUsernameAvailable(
        userId,
        request.body.username,
        request.body.domain
      );

      return result;
    }
  );

  /**
   * Claim username.
   * This repeats the availability check.
   */
  server.post(
    "/member/username/claim",
    {
      preHandler: verifySession(),
      schema: {
        description: "Allow a member to claim a username",
        tags: ["member"],
        summary: "The first step in provisioning services",
        response: {
          200: {
            description: "Success Response",
            type: "object",
            properties: {
              account: {
                type: "object",
                properties: {
                  username: { type: "string" },
                  domain: { type: "string" },
                  createdAt: { type: "string" },
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

      try {
        const result = await server.memberService.claimUsername(
          userId,
          request.body.username,
          request.body.domain
        );

        if (result.status == "OK") {
          return {
            account: {
              username: request.body.username,
              domain: request.body.domain,
              createdAt: result.createdAt,
            },
          };
        } else {
          reply.code(422);
          reply.send({ message: result.message });
        }
      } catch (e) {
        reply.code(500);
        return { message: "Failed to claim username" };
      }
    }
  );

  /**
   * Check username availability across multiple domains
   */
  server.post(
    "/member/username/available/multi",
    {
      preHandler: verifySession(),
      schema: {
        description: "Check availability in multiple domains",
        tags: ["member"],
        summary: "Makes it easier to use the same username across communities",
        response: {
          200: {
            description: "Success Response",
            type: "object",
            properties: {
              username: { type: "string" },
              available: { type: "array", items: { type: "string" } },
              unavailable: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    async (request, reply) => {
      let userId = request.session.getUserId();
      console.log("USERID", userId);

      try {
        const result = await server.memberService.checkAvailabilityMulti(
          userId,
          request.body.username,
          request.body.domains
        );

        if (result.status == "OK") {
          return {
            username: result.username,
            available: result.available,
            unavailable: result.unavailable,
          };
        }
      } catch (e) {
        reply.code(500);
        return { message: "Availability check failed" };
      }
    }
  );

  /**
   * Claim username across multiple domains
   */
  server.post(
    "/member/username/claim/multi",
    {
      preHandler: verifySession(),
      schema: {
        description: "Allow a member to claim a username in multiple domains",
        tags: ["member"],
        summary: "Quicker and more efficient than doing them separately",
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
                    createdAt: { type: "string" },
                  },
                },
              },
              failed: {
                type: "array",
                items: {
                  type: "string"
                },
              }
            },
          },
        },
      },
    },
    async (request, reply) => {
      let userId = request.session.getUserId();
      console.log("USERID", userId);

      try {
        const accounts = [];
        const failed = [];

        // Claim all username/domain combos in parallel
        // Add successful attempts to accounts, add failure to failedDomains
        // const promises = [];

        const username = request.body.username;
        const domains = request.body.domains.map(domain => domain.toLowerCase());

        const results = await Promise.allSettled(
          domains.map(async (domain) => {
            try {
              const domResult = await server.memberService.claimUsername(
                userId,
                username,
                domain
              );

              if (domResult.status == "OK") {
                accounts.push({
                  username: username,
                  domain: domain,
                  createdAt: domResult.createdAt,
                });
              } else {
                failed.push(domain);
              }

              return domResult;
            } catch (e) {
              failed.push(domain);
            }
          })
        );

        return {
          accounts: accounts,
          failed: failed
        }

        console.log("RRRRREESESEESESE", results);
        console.log("PASS", accounts);
        console.log("FAIL", failed);
      } catch (e) {
        reply.code(500);
        return { message: "Username claims failed" };
      }
    }
  );
}

export default fastifyPlugin(memberUsernameRoutes);

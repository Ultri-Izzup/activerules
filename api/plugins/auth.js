import cors from "@fastify/cors";
import formDataPlugin from "@fastify/formbody";
import fastifyPlugin from "fastify-plugin";

// Used to run GoToSocial command
import { exec } from "child_process";

import Module from "node:module";

const require = Module.createRequire(import.meta.url);

const zxcvbn = require("zxcvbn");

import blockedUsernames from "../js/blockedUsernames.js";

import supertokens from "supertokens-node";
import Session from "supertokens-node/recipe/session/index.js";
import Passwordless from "supertokens-node/recipe/passwordless/index.js";
import EmailPassword from "supertokens-node/recipe/emailpassword/index.js";
import EmailVerification from "supertokens-node/recipe/emailverification/index.js";
import { SMTPService as PasswordlessSMTPService } from "supertokens-node/recipe/passwordless/emaildelivery/index.js";
import { SMTPService } from "supertokens-node/recipe/emailpassword/emaildelivery/index.js";
import { SMTPService as EmailVerificationSMTPService } from "supertokens-node/recipe/emailverification/emaildelivery/index.js";

import {
  plugin,
  errorHandler,
} from "supertokens-node/framework/fastify/index.js";

async function auth(server, options) {
  supertokens.init({
    debug: true,
    framework: "fastify",
    supertokens: {
      // These are the connection details of the app you created on supertokens.com
      connectionURI: server.config.SUPERTOKENS_CONNECTION_URI,
      apiKey: server.config.SUPERTOKENS_API_KEY,
    },
    appInfo: {
      // learn more about this on https://supertokens.com/docs/session/appinfo
      appName: server.config.SUPERTOKENS_APPNAME,
      apiDomain: server.config.SUPERTOKENS_API_DOMAIN,
      websiteDomain: server.config.SUPERTOKENS_WEBSITE_DOMAIN,
      apiBasePath: server.config.SUPERTOKENS_API_BASE_PATH,
      websiteBasePath: server.config.SUPERTOKENS_WEBSITE_BASE_PATH,
    },
    recipeList: [
      Passwordless.init({
        // flowType: "USER_INPUT_CODE_AND_MAGIC_LINK",
        flowType: "USER_INPUT_CODE",
        contactMethod: "EMAIL_OR_PHONE",
        override: {
          apis: (originalImplementation) => {
            return {
              ...originalImplementation,

              // here we only override the sign up API logic
              consumeCodePOST: async (input) => {
                const result = await originalImplementation.consumeCodePOST(
                  input
                );

                const client = await server.pg.connect();

                console.log(result);

                let accounts = [];

                try {
                  const { rows } = await client.query(
                    `
                    SELECT * FROM entity.member_signin_accounts(
                      $1,
                      $2,
                      $3,
                      $4
                    )
                    `,
                    [result.user.id, result.user.email, result.user.timeJoined, server.config.REALM]
                  );
                  console.log(rows);
                  accounts = rows;
                } catch (e) {
                  console.log(e);
                } finally {
                  // Release the client immediately after query resolves, or upon error
                  client.release();
                }

                result.accounts = accounts;

                return result;
              },
              // ...
              // TODO: override more apis
            };
          },
          // functions: (originalImplementation) => {
          //   return {
          //     ...originalImplementation,
          //     consumeCode: async function (input) {
          //       const originalResult = await originalImplementation.consumeCode(
          //         input
          //       );

          //       console.log(
          //         "ORIGINAL ###################################################################",
          //         originalResult
          //       );

          //       const client = await server.pg.connect();

          //       let accounts = [];

          //       try {
          //         const { rows } = await client.query(
          //           `
          //           SELECT
          //             username,
          //             account_domain AS "accountDomain",
          //             host_domain AS "hostDomain",
          //             created_at AS "createdAt",
          //             status
          //           FROM public.sync_member(
          //             $1, $2, $3, '127.0.0.1'
          //           )
          //           `,
          //           [originalResult.user.id, originalResult.user.email, originalResult.user.timeJoined]
          //         );
          //         console.log(rows)
          //         accounts = rows;
          //       } catch (e) {
          //         console.log(e);
          //       } finally {
          //         // Release the client immediately after query resolves, or upon error
          //         client.release();
          //       }

          //       originalResult.accounts = accounts;

          //       return originalResult;
          //     },
          //   };
          // },
        },
        emailDelivery: {
          service: new PasswordlessSMTPService({
            smtpSettings: {
              host: server.config.SMTP_HOST,
              authUsername: server.config.SMTP_USER, // this is optional. In case not given, from.email will be used
              password: server.config.SMTP_PASSWORD,
              port: server.config.SMTP_PORT,
              from: {
                name: server.config.SMTP_FROM,
                email: server.config.SMTP_EMAIL,
              },
              secure: server.config.SMTP_SECURE,
            },
          }),
        },
      }),
      // EmailPassword.init({
      //   signUpFeature: {
      //     formFields: [
      //       {
      //         id: "username",
      //         validate: async (value, tenantId) => {

      //           // Minimim 5 characters, maximum 30
      //           const len = value.length;

      //           if(len < 5 || len > 30) {
      //             return "The username must be between 5 and 30 characters long"
      //           }

      //           // Basic regex
      //           const regex = /^[a-zA-Z0-9_]*$/
      //           if(!regex.test(value)) {
      //             return "Only letters, numbers and underscore are allowed in usernames"
      //           }

      //           // Split username into parts in underscore
      //           const parts = value.split('_');

      //           let err = null;

      //           // Loop through all and perform multiple checks on each in one iteration
      //           for (const blocked of blockedUsernames) {
      //             if(blocked === value || parts.includes(blocked)) {
      //               console.log("BLOCKED BY!! \n", blocked)
      //               console.log("BLOCKED!!!!! \n", value)
      //               err = "The username is not available";
      //               break;
      //             }
      //           }

      //           if(err) {
      //             return err
      //           }

      //           // Check the database for the uername.
      //           // We don't want to create the SuperTokens account if the GoToSocial account will fail.
      //           const client = await server.pg.connect();

      //           try {
      //             const { rows }= await client.query("SELECT COUNT(*) FROM nugget.members WHERE username = $1", [value]);
      //             if(rows[0].count > 0) {
      //               return "The username is not available";
      //             }
      //             } finally {
      //             // Release the client immediately after query resolves, or upon error
      //             client.release();
      //           }

      //           return undefined; // Signals "Passed Validation" to SuperTokens
      //         },
      //       },
      //       {
      //         id: "password",
      //         validate: async (value, tenantId) => {
      //           // Length
      //           if (value.length < 10) {
      //             return "The password must have 10 or more characters";
      //           }

      //           // Entropy
      //           const scoring = zxcvbn(value);
      //           if (scoring.score < 3) {
      //             return scoring.feedback.warning;
      //           }

      //           return undefined; // Signals "Passed Validation" to SuperTokens
      //         },
      //       },
      //     ],
      //   },
      //   override: {
      //     apis: (originalImplementation) => {
      //       return {
      //         ...originalImplementation,

      //         signUpPOST: async function (input) {
      //           if (originalImplementation.signUpPOST === undefined) {
      //             throw Error("Should never come here");
      //           }

      //           // These are the input form fields values that the user used while signing up.
      //           // Already validated by SuperTokens or the signUpFeature formFields validators.
      //           let formFields = input.formFields;

      //           const email = formFields.find(
      //             (element) => element.id === "email"
      //           );
      //           const password = formFields.find(
      //             (element) => element.id === "password"
      //           );
      //           const username = formFields.find(
      //             (element) => element.id === "username"
      //           );

      //           // First we call the original implementation of signUpPOST.
      //           let response = await originalImplementation.signUpPOST(input);

      //           // Post sign up response, we check if it was successful
      //           if (response.status === "OK") {
      //             // Second, we try the API insert using the SuperTokens uuid
      //             const client = await server.pg.connect();
      //             try {
      //               const result = await client.query(
      //                 "INSERT INTO nugget.members(uid, email, username) VALUES ($1,$2,$3)",
      //                 [response.user.id, email.value, username.value]
      //               );
      //               // Note: avoid doing expensive computation here, this will block releasing the client
      //             } catch (e) {
      //               console.log("ERROR! \n", e);
      //             } finally {
      //               // Release the client immediately after query resolves, or upon error
      //               client.release();
      //             }
      //             return response;
      //           }
      //         },
      //       };
      //     },
      //   },
      //   emailDelivery: {
      //     service: new SMTPService({
      //       smtpSettings: {
      //         host: server.config.SMTP_HOST,
      //         authUsername: server.config.SMTP_USER, // this is optional. In case not given, from.email will be used
      //         password: server.config.SMTP_PASSWORD,
      //         port: server.config.SMTP_PORT,
      //         from: {
      //           name: server.config.SMTP_FROM,
      //           email: server.config.SMTP_EMAIL,
      //         },
      //         secure: server.config.SMTP_SECURE,
      //       },
      //     }),
      //   },
      // }),
      // EmailVerification.init({
      //   mode: "REQUIRED", // or "OPTIONAL"
      //   emailDelivery: {
      //     service: new EmailVerificationSMTPService({
      //       smtpSettings: {
      //         host: server.config.SMTP_HOST,
      //         authUsername: server.config.SMTP_USER, // this is optional. In case not given, from.email will be used
      //         password: server.config.SMTP_PASSWORD,
      //         port: server.config.SMTP_PORT,
      //         from: {
      //           name: server.config.SMTP_FROM,
      //           email: server.config.SMTP_EMAIL,
      //         },
      //         secure: server.config.SMTP_SECURE,
      //       },
      //     }),
      //   },
      // }),
      Session.init({
        getTokenTransferMethod: () => "cookie", // "header",
        exposeAccessTokenToFrontendInCookieBasedAuth: true,
      }), // initializes session features
    ],
  });

  // we register a CORS route to allow requests from the frontend
  server.register(cors, {
    origin: server.config.CORS_ORIGIN_URL,
    allowedHeaders: [
      "Content-Type",
      "anti-csrf",
      "rid",
      "fdi-version",
      "authorization",
      "st-auth-mode",
    ],
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH"],
    credentials: true,
  });

  server.register(formDataPlugin);
  server.register(plugin);

  server.setErrorHandler(errorHandler());
}

export default fastifyPlugin(auth);

// const goToSocialCommand = [
//   "./gotosocial/gotosocial --config-path ./gotosocial/config.yaml admin account create",
// ];
// goToSocialCommand.push(...["--username", username.value]);
// goToSocialCommand.push(...["--email", email.value]);
// goToSocialCommand.push(...["--password", password.value]);

// const commandStr = goToSocialCommand.join(" ");

// console.log("GOTOSOCIAL COMMAND \n", commandStr);

// // Run GoToSocial command to add the user
// exec(commandStr, (err, output) => {
//   // once the command has completed, the callback function is called
//   if (err) {
//     // log and return if we encounter an error
//     console.error("could not execute command: ", err);
//     return;
//   }
//   // log the output received from the command
//   console.log("GOTOSOCIAL RESULT: \n", output);
// });

import { defineAuth, secret } from "@aws-amplify/backend";
import { postConfirmation } from "./post-confirmation/resource";
import { preSignUp } from "./pre-sign-up/resource";
import { defineAuthChallenge } from "./define-auth-challenge/resource";
import { createAuthChallenge } from "./create-auth-challenge/resource";
import { verifyAuthChallenge } from "./verify-auth-challenge/resource";

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      oidc: [
        {
          name: "Feide",
          clientId: secret("FEIDE_CLIENT_ID"),
          clientSecret: secret("FEIDE_CLIENT_SECRET"),
          issuerUrl: "https://auth.dataporten.no",
          scopes: ["openid", "profile", "userid", "email"], // Update secrets
        },
      ],
      callbackUrls: [
        "http://localhost:3000/",
        "http://localhost:3000/profile",
        "https://main.deodkfzpv9kfw.amplifyapp.com/",
        "https://main.deodkfzpv9kfw.amplifyapp.com/profile"
      ],
      logoutUrls: [
        "http://localhost:3000/",
        "http://localhost:3000/logout",
        "https://main.deodkfzpv9kfw.amplifyapp.com/",
        "https://main.deodkfzpv9kfw.amplifyapp.com/logout"
      ],
    },
  },
  // Define the admin group
  groups: ["admin"],
  // Add all triggers for passwordless flow
  triggers: {
    preSignUp,
    postConfirmation,
    defineAuthChallenge,
    createAuthChallenge,
    verifyAuthChallengeResponse: verifyAuthChallenge,
  },
  // Grant permissions to triggers
  access: (allow) => [
    allow.resource(postConfirmation).to(["addUserToGroup"]),
  ],
  // Enable custom auth flow for passwordless
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
  },
});
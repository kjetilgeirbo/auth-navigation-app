import { defineAuth } from "@aws-amplify/backend";
import { postConfirmation } from "./post-confirmation/resource";
import { preSignUp } from "./pre-sign-up/resource";
import { defineAuthChallenge } from "./define-auth-challenge/resource";
import { createAuthChallenge } from "./create-auth-challenge/resource";
import { verifyAuthChallenge } from "./verify-auth-challenge/resource";

export const auth = defineAuth({
  loginWith: {
    email: true,
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
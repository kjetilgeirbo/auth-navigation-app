import { defineFunction } from "@aws-amplify/backend";

export const createAuthChallenge = defineFunction({
  name: "create-auth-challenge",
  environment: {
    SES_FROM_EMAIL: "noreply@fagfilm.no",
    AWS_REGION_SES: "eu-north-1"
  }
});
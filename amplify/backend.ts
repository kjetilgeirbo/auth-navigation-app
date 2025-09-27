import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource.js";
import { data } from "./data/resource.js";

export const backend = defineBackend({
  auth,
  data
});

// Extract L1 CfnUserPool resources
const { cfnUserPool } = backend.auth.resources.cfnResources;

// Configure password policy
cfnUserPool.policies = {
  passwordPolicy: {
    minimumLength: 8,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    requireUppercase: true,
    temporaryPasswordValidityDays: 3,
  },
};
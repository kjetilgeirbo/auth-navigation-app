import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource.js";
import { data } from "./data/resource.js";
import { storage } from "./storage/resource.js";

export const backend = defineBackend({
  auth,
  data,
  storage
});

// Extract L1 CfnUserPool and CfnIdentityPool resources
const { cfnUserPool, cfnIdentityPool } = backend.auth.resources.cfnResources;

// Configure password policy (even though we won't use password login)
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

// Enable unauthenticated identities in Identity Pool
// This allows anonymous access via Identity Pool
cfnIdentityPool.allowUnauthenticatedIdentities = true;
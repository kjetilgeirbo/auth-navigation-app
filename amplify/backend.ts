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
const { cfnUserPool, cfnIdentityPool, cfnUserPoolClient } = backend.auth.resources.cfnResources;

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

// Enable custom auth flow for passwordless authentication
cfnUserPoolClient.explicitAuthFlows = [
  'ALLOW_CUSTOM_AUTH',            // Enable custom auth flow for Lambda triggers
  'ALLOW_REFRESH_TOKEN_AUTH',     // Allow token refresh
  'ALLOW_USER_SRP_AUTH',          // Keep SRP for compatibility
  'ALLOW_USER_PASSWORD_AUTH'      // Allow password auth for user creation
];

// Configure auth session validity
cfnUserPoolClient.authSessionValidity = 15; // 15 minutes for auth challenges

// Enable email configuration for sending auth codes
cfnUserPool.emailConfiguration = {
  emailSendingAccount: 'COGNITO_DEFAULT'
};

// Enable account recovery with email
cfnUserPool.accountRecoverySetting = {
  recoveryMechanisms: [
    {
      name: 'verified_email',
      priority: 1
    }
  ]
};

// Note: SES permissions for Lambda functions
// The createAuthChallenge Lambda function will need SES permissions to send emails
// These permissions are configured through the Lambda execution role
// For production, you may need to manually add SES permissions to the Lambda role in AWS Console
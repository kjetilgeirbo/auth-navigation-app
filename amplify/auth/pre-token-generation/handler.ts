import type { PreTokenGenerationTriggerHandler } from "aws-lambda";
import { randomBytes } from 'crypto';

export const handler: PreTokenGenerationTriggerHandler = async (event) => {
  console.log('Pre Token Generation trigger invoked', {
    triggerSource: event.triggerSource,
    userPoolId: event.userPoolId
  });

  // Generate anonymous session ID for tracking
  const sessionId = randomBytes(16).toString('hex');

  // Override token claims to remove all identifiable information
  event.response = {
    claimsOverrideDetails: {
      // Suppress all personal information claims
      claimsToSuppress: [
        'name',
        'family_name',
        'given_name',
        'preferred_username',
        'nickname',
        'profile',
        'picture',
        'website',
        'gender',
        'birthdate',
        'zoneinfo',
        'locale',
        'updated_at',
        'identities',
        'phone_number',
        'phone_number_verified',
        'address'
      ],
      // Add minimal claims for session tracking
      claimsToAddOrOverride: {
        // Anonymous session identifier
        'session_id': sessionId,
        // Mark as anonymous user
        'anonymous': 'true',
        // Keep the anonymous email
        'email': event.request.userAttributes.email,
      }
    }
  };

  console.log('Token claims anonymized');

  return event;
};
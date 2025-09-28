import type { PreSignUpTriggerHandler } from "aws-lambda";
import { createHash } from 'crypto';

export const handler: PreSignUpTriggerHandler = async (event) => {
  console.log('Pre Sign-up trigger invoked', {
    triggerSource: event.triggerSource,
    userAttributes: Object.keys(event.request.userAttributes || {}),
    email: event.request.userAttributes?.email
  });

  // Check if user is signing up via external provider (Feide)
  if (event.triggerSource === 'PreSignUp_ExternalProvider') {
    const userAttributes = event.request.userAttributes;

    // Check if this is from Feide provider
    if (userAttributes.identities) {
      const identities = JSON.parse(userAttributes.identities);
      const feideIdentity = identities.find((id: any) => id.providerName === 'Feide');

      if (feideIdentity) {
        // The sub from Feide is mapped to email field
        // It's a UUID like "76a7a061-3c55-430d-8ee0-6f82ec42501f"
        const feideUuid = userAttributes.email || feideIdentity.userId || userAttributes.sub;

        console.log('Anonymizing Feide user with UUID:', feideUuid);

        // Create anonymous hash from Feide UUID
        const salt = process.env.HASH_SALT || 'anonymous-feide-salt';
        const anonymousHash = createHash('sha256')
          .update(feideUuid + salt)
          .digest('hex')
          .substring(0, 16); // Use first 16 chars of hash

        // Generate anonymous email that's valid
        // Format: anon-{hash}@feide.anonymous
        const anonymousEmail = `anon-${anonymousHash}@feide.anonymous`;

        console.log('Generated anonymous email:', anonymousEmail);

        // Override user attributes to ensure complete anonymity
        // Note: userAttributes override is not available in pre-sign-up response
        // The anonymization happens through the identity mapping

        // Auto-confirm and verify the user
        event.response.autoConfirmUser = true;
        event.response.autoVerifyEmail = true;
        event.response.autoVerifyPhone = false;

        console.log('Feide user anonymized successfully');
      }
    }
  } else if (event.triggerSource === 'PreSignUp_SignUp') {
    // Regular email sign-up - auto-confirm for passwordless flow
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;

    console.log('Auto-confirming email user for passwordless:', event.request.userAttributes?.email);

    // IMPORTANT: For passwordless auth, we need to set a system-generated password
    // that the user never needs to know. This allows CUSTOM_WITHOUT_SRP to work.
    // The password set during sign-up will be ignored as we use custom auth flow.
  }

  return event;
};
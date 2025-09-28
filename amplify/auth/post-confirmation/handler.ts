import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand
} from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient();

// Hardcoded admin email addresses
const ADMIN_EMAILS = [
  'geirbo@icloud.com',
  'frode@fagfilm.no',
  'admin@fagfilm.no'
];

export const handler: PostConfirmationTriggerHandler = async (event) => {
  console.log('Post-confirmation trigger called for user:', event.userName);
  console.log('User email:', event.request.userAttributes.email);

  // Check if the user's email is in the admin list
  const userEmail = event.request.userAttributes.email?.toLowerCase();

  if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
    console.log(`Adding user ${event.userName} to admin group`);

    const command = new AdminAddUserToGroupCommand({
      GroupName: 'admin',
      Username: event.userName,
      UserPoolId: event.userPoolId
    });

    try {
      const response = await client.send(command);
      console.log('Successfully added to admin group:', response.$metadata.requestId);
    } catch (error) {
      console.error('Error adding user to admin group:', error);
      // Don't fail the trigger - let the user sign up even if group assignment fails
    }
  } else {
    console.log('User is not an admin - no group assignment');
  }

  return event;
};
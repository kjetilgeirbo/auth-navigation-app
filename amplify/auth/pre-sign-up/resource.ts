import { defineFunction } from '@aws-amplify/backend';

export const preSignUp = defineFunction({
  name: 'pre-sign-up',
  resourceGroupName: 'auth',
  environment: {
    // Salt for hashing - this should be kept secret
    HASH_SALT: 'feide-anonymous-salt-2024'
  }
});
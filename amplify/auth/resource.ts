import { defineAuth, secret } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      oidc: [
        {
          name: 'Feide',
          clientId: secret('FEIDE_CLIENT_ID'),
          clientSecret: secret('FEIDE_CLIENT_SECRET'),
          issuerUrl: 'https://auth.dataporten.no',
          scopes: ['openid', 'profile', 'email'],
          attributeMapping: {
            email: 'email',
          },
        }
      ],
      callbackUrls: [
        'http://localhost:3000/',
        'http://localhost:3000/profile',
      ],
      logoutUrls: [
        'http://localhost:3000/',
        'http://localhost:3000/logout',
      ],
    }
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
  },
});
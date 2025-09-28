import { defineAuth } from "@aws-amplify/backend";
// import { secret } from "@aws-amplify/backend"; // Uncomment when secrets are configured

export const auth = defineAuth({
  loginWith: {
    email: true,
    // Feide OIDC configuration - uncomment after setting secrets in Amplify Console
    // To enable Feide login:
    // 1. Go to AWS Amplify Console > App settings > Environment variables
    // 2. Add these secrets:
    //    - FEIDE_CLIENT_ID: b6a97318-be39-4c55-9599-e5aa7d2f991f
    //    - FEIDE_CLIENT_SECRET: 04daac2b-f8cd-4057-8220-7431e40933c2
    // 3. Uncomment the configuration below and push changes
    /*
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
    */
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
  },
});
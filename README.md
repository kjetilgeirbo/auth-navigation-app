# auth-navigation-app

This is an [AWS Amplify](https://aws.amazon.com/amplify/) + [Next.js](https://nextjs.org) project created with Amplify Gen 2.

## Features

- Authentication with Amazon Cognito
- GraphQL API with AWS AppSync
- Server-side rendering with Next.js
- TypeScript support
- CSS modules support

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, start the Amplify development environment:

```bash
npx ampx sandbox
```

In a new terminal, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Deploy on AWS

To deploy your application to AWS:

```bash
npx ampx sandbox --identifier production
```

## Learn More

To learn more about AWS Amplify and Next.js, take a look at the following resources:

- [AWS Amplify Documentation](https://docs.amplify.aws) - learn about Amplify features and API.
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Amplify Gen 2 Documentation](https://docs.amplify.aws/gen2) - learn about the latest Amplify experience.

## Support

For support, please visit the [AWS Amplify Discord community](https://discord.gg/amplify).
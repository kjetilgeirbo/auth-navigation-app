import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({
  // Example model - replace with your own
  Item: a.model({
    name: a.string().required(),
    description: a.string(),
    completed: a.boolean().default(false),
  })
  .authorization(allow => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
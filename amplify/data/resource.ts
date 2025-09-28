import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({
  // Public data model - accessible by all guests
  Item: a.model({
    name: a.string().required(),
    description: a.string(),
    completed: a.boolean().default(false),
    // Track if created via Feide (stored in frontend)
    createdViaFeide: a.boolean().default(false),
    // Anonymous session identifier
    sessionId: a.string(),
  })
  .authorization(allow => [
    // Allow all operations for guests via Identity Pool
    allow.guest().to(['create', 'read', 'update', 'delete']),
    // Also allow authenticated users
    allow.authenticated().to(['create', 'read', 'update', 'delete']),
  ]),

  // Admin-only content
  AdminContent: a.model({
    title: a.string().required(),
    content: a.string(),
    priority: a.integer(),
  })
  .authorization(allow => [
    // Only admins can access this model
    allow.groups(['admin']).to(['create', 'read', 'update', 'delete']),
  ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    // Use identityPool as default for guest access
    defaultAuthorizationMode: "identityPool",
    // Add userPool for authenticated users
    apiKeyAuthorizationMode: {
      expiresInDays: 30
    }
  },
});
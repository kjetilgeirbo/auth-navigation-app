import { defineAuth } from "@aws-amplify/backend";
import { postConfirmation } from "./post-confirmation/resource";

export const auth = defineAuth({
  loginWith: {
    email: true, // Email authentication for admins
  },
  // Define the admin group
  groups: ["admin"],
  // Add the post-confirmation trigger
  triggers: {
    postConfirmation,
  },
  // Grant the trigger permission to add users to groups
  access: (allow) => [
    allow.resource(postConfirmation).to(["addUserToGroup"]),
  ],
});
import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "galleryImages",
  access: (allow) => ({
    "gallery/*": [
      allow.guest.to(["read"]), // Everyone can view gallery images
      allow.authenticated.to(["read"]), // Authenticated users can view
      allow.groups(["admin"]).to(["read", "write", "delete"]), // Admins can manage
    ],
  }),
});
import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "amplifyNotesDrive",
  access: (allow) => ({
    "media/{entity_id}/*": [
      allow.entity("identity").to(["read", "write", "delete"]),
      // allow.groups(["Everyone"]).to(["read"]), // Allow all users to read the images
    ],
  }),
});

import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "amplifyNotesDrive",
  access: (allow) => ({
    "media/{entity_id}/*": [
      allow.entity("identity").to(["read", "write", "delete"]),
      // allow.groups(["authenticated"]).to(["read"]), // Allow all authenticated users to read the images
    ],
  }),
});

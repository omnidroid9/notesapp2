import { useState, useEffect } from "react";
import {
  Authenticator,
  Button,
  Text,
  TextField,
  Heading,
  Flex,
  View,
  Image,
  Grid,
  Divider,
} from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { getUrl } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);
const client = generateClient({
  authMode: "apiKey", // Use public API access for now
});

export default function App() {
  const [notes, setNotes] = useState([]); // User-specific gear
  const [publicGear, setPublicGear] = useState([]); // Public gear for visitors

  // Fetch user-specific gear after login
  useEffect(() => {
    fetchNotes();
  }, []);

  // Fetch public gear for visitors
  useEffect(() => {
    fetchPublicGear();
  }, []);

  async function fetchNotes() {
    const { data: notes } = await client.models.Note.list();
    await Promise.all(
      notes.map(async (note) => {
        if (note.image) {
          const linkToStorageFile = await getUrl({
            path: ({ identityId }) => `media/${identityId}/${note.image}`,
          });
          note.image = linkToStorageFile.url;
        }
        return note;
      })
    );
    setNotes(notes);
  }

  async function fetchPublicGear() {
    try {
      const { data: notes } = await client.models.Note.list(); // Assuming `Note` is accessible publicly
      await Promise.all(
        notes.map(async (note) => {
          if (note.image) {
            const linkToStorageFile = await getUrl({
              path: ({ identityId }) => `media/${identityId}/${note.image}`,
            });
            note.image = linkToStorageFile.url;
          }
          return note;
        })
      );
      setPublicGear(notes);
    } catch (error) {
      console.error("Error fetching public gear:", error);
    }
  }

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);

    const { data: newNote } = await client.models.Note.create({
      name: form.get("name"),
      description: form.get("description"),
      image: form.get("image").name,
    });

    if (newNote.image)
      await uploadData({
        path: ({ identityId }) => `media/${identityId}/${newNote.image}`,
        data: form.get("image"),
      }).result;

    fetchNotes();
    event.target.reset();
  }

  async function deleteNote({ id }) {
    const toBeDeletedNote = {
      id: id,
    };

    const { data: deletedNote } = await client.models.Note.delete(
      toBeDeletedNote
    );

    fetchNotes();
  }

  return (
    <Flex
      className="App"
      justifyContent="center"
      alignItems="center"
      direction="column"
      width="70%"
      margin="0 auto"
    >
      <Heading level={1}>Ride Ready</Heading>

      {/* Public Gear Section */}
      <Heading level={2}>Explore Gear</Heading>
      <Grid margin="3rem 0" autoFlow="row" gap="2rem">
        {publicGear.map((note) => (
          <Flex
            key={note.id || note.name}
            direction="column"
            justifyContent="center"
            alignItems="center"
            gap="1rem"
            border="1px solid #ccc"
            padding="1rem"
            borderRadius="8px"
          >
            <Heading level={3}>{note.name}</Heading>
            <Image
              src={note.image}
              alt={`Gear: ${note.name}`}
              style={{ width: "200px" }}
            />
            <Text>{note.description}</Text>
          </Flex>
        ))}
      </Grid>

      {/* Authenticated User Section */}
      <Authenticator>
        {({ signOut }) => (
          <>
            <View as="form" margin="3rem 0" onSubmit={createNote}>
              <Flex
                direction="column"
                justifyContent="center"
                gap="2rem"
                padding="2rem"
              >
                <TextField
                  name="name"
                  placeholder="Gear Name"
                  label="Gear Name"
                  labelHidden
                  variation="quiet"
                  required
                />
                <TextField
                  name="description"
                  placeholder="Gear Description"
                  label="Gear Description"
                  labelHidden
                  variation="quiet"
                  required
                />
                <View
                  name="image"
                  as="input"
                  type="file"
                  alignSelf={"end"}
                  accept="image/png, image/jpeg"
                />
                <Button type="submit" variation="primary">
                  Upload Gear
                </Button>
              </Flex>
            </View>
            <Divider />
            <Heading level={2}>Your Gear</Heading>
            <Grid margin="3rem 0" autoFlow="column" gap="2rem">
              {notes.map((note) => (
                <Flex
                  key={note.id || note.name}
                  direction="column"
                  justifyContent="center"
                  alignItems="center"
                  gap="2rem"
                  border="1px solid #ccc"
                  padding="2rem"
                  borderRadius="8px"
                >
                  <Heading level={3}>{note.name}</Heading>
                  {note.image && (
                    <Image
                      src={note.image}
                      alt={`Your gear: ${note.name}`}
                      style={{ width: "200px" }}
                    />
                  )}
                  <Text>{note.description}</Text>
                  <Button
                    variation="destructive"
                    onClick={() => deleteNote(note)}
                  >
                    Delete Gear
                  </Button>
                </Flex>
              ))}
            </Grid>
            <Button onClick={signOut}>Sign Out</Button>
          </>
        )}
      </Authenticator>
    </Flex>
  );
}

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
  SelectField,
} from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { getUrl } from "aws-amplify/storage";
import { uploadData } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);
const client = generateClient({
  authMode: "userPool",
});

export default function App() {
  const [notes, setNotes] = useState([]);
  const [allRiders, setAllRiders] = useState([]); // For other riders
  const [selectedRiderNotes, setSelectedRiderNotes] = useState([]); // Selected rider's gear
  const [selectedRider, setSelectedRider] = useState("");

  useEffect(() => {
    fetchNotes();
    fetchRiders(); // Fetch the list of riders
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

  async function fetchRiders() {
    // Fetch all riders (users in your app)
    const { data: riders } = await client.models.User.list(); // Assuming you have a `User` model
    setAllRiders(riders);
  }

  async function fetchRiderGear(riderId) {
    const { data: riderNotes } = await client.models.Note.list({
      filters: { userId: { eq: riderId } }, // Assuming `Note` has a `userId` field
    });
    await Promise.all(
      riderNotes.map(async (note) => {
        if (note.image) {
          const linkToStorageFile = await getUrl({
            path: ({ identityId }) => `media/${identityId}/${note.image}`,
          });
          note.image = linkToStorageFile.url;
        }
        return note;
      })
    );
    setSelectedRiderNotes(riderNotes);
  }

  function handleRiderChange(event) {
    const riderId = event.target.value;
    setSelectedRider(riderId);
    fetchRiderGear(riderId);
  }

  return (
    <Authenticator>
      {({ signOut }) => (
        <Flex className="App" justifyContent="center" alignItems="center" direction="column" width="70%" margin="0 auto">
          <Heading level={1}>Ride Ready</Heading>
          <View as="form" margin="3rem 0" onSubmit={createNote}>
            <Flex direction="column" justifyContent="center" gap="2rem" padding="2rem">
              <TextField name="name" placeholder="Gear Name" label="Gear Name" labelHidden variation="quiet" required />
              <TextField name="description" placeholder="Gear Description" label="Gear Description" labelHidden variation="quiet" required />
              <View name="image" as="input" type="file" alignSelf={"end"} accept="image/png, image/jpeg" />
              <Button type="submit" variation="primary">Upload Gear</Button>
            </Flex>
          </View>
          <Divider />
          <Heading level={2}>Current Gear</Heading>
          <Grid margin="3rem 0" autoFlow="column" justifyContent="center" gap="2rem" alignContent="center">
            {notes.map((note) => (
              <Flex key={note.id || note.name} direction="column" justifyContent="center" alignItems="center" gap="2rem" border="1px solid #ccc" padding="2rem" borderRadius="5%" className="box">
                <View>
                  <Heading level="3">{note.name}</Heading>
                </View>
                <Text fontStyle="italic">{note.description}</Text>
                {note.image && <Image src={note.image} alt={`visual aid for ${notes.name}`} style={{ width: 400 }} />}
                <Button variation="destructive" onClick={() => deleteNote(note)}>Delete note</Button>
              </Flex>
            ))}
          </Grid>
          <Divider />
          <Heading level={2}>View Other Riders' Gear</Heading>
          <SelectField
            label="Select Rider"
            placeholder="Choose a rider"
            options={allRiders.map((rider) => ({ label: rider.name, value: rider.id }))}
            value={selectedRider}
            onChange={handleRiderChange}
          />
          <Grid margin="3rem 0" autoFlow="column" justifyContent="center" gap="2rem" alignContent="center">
            {selectedRiderNotes.map((note) => (
              <Flex key={note.id || note.name} direction="column" justifyContent="center" alignItems="center" gap="2rem" border="1px solid #ccc" padding="2rem" borderRadius="5%" className="box">
                <View>
                  <Heading level="3">{note.name}</Heading>
                </View>
                <Text fontStyle="italic">{note.description}</Text>
                {note.image && <Image src={note.image} alt={`visual aid for ${notes.name}`} style={{ width: 400 }} />}
              </Flex>
            ))}
          </Grid>
          <Button onClick={signOut}>Sign Out</Button>
        </Flex>
      )}
    </Authenticator>
  );
}

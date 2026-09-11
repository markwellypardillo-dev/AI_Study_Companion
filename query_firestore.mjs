import fs from 'fs';
import https from 'https';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

const projectId = config.projectId;
const databaseId = config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)" ? config.firestoreDatabaseId : "(default)";

const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/users?key=${config.apiKey}`;

console.log("Fetching users from:", url);

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (!response.documents) {
        console.log("No documents found or error:", response);
        return;
      }
      console.log(`Found ${response.documents.length} users`);
      response.documents.forEach(doc => {
        const id = doc.name.split('/').pop();
        const email = doc.fields && doc.fields.email ? doc.fields.email.stringValue : "UNKNOWN";
        console.log(`User ID: ${id}, Email: ${email}`);
      });
    } catch(e) {
      console.error(e);
    }
  });
});

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, initializeFirestore } = require('firebase/firestore');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)" 
  ? initializeFirestore(app, {}, config.firestoreDatabaseId) 
  : initializeFirestore(app, {});

async function test() {
  try {
    const snap = await getDocs(collection(db, "users"));
    console.log("Success! Docs:", snap.docs.length);
  } catch (e) {
    console.log("FAILED:", e.message);
  }
}
test();

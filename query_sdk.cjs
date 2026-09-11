const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, initializeFirestore } = require('firebase/firestore');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)" 
  ? initializeFirestore(app, {}, config.firestoreDatabaseId) 
  : initializeFirestore(app, {});

async function run() {
  console.log("Querying users...");
  try {
    const snap = await getDocs(collection(db, "users"));
    console.log(`Found ${snap.docs.length} users in 'users' collection`);
    snap.forEach(doc => {
      console.log(`- ${doc.id}:`, doc.data());
    });
    
    console.log("\nQuerying app_accounts...");
    const snap2 = await getDocs(collection(db, "app_accounts"));
    console.log(`Found ${snap2.docs.length} users in 'app_accounts' collection`);
    snap2.forEach(doc => {
      console.log(`- ${doc.id}:`, doc.data());
    });
  } catch (e) {
    console.error("Error:", e);
  }
}
run();

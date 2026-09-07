const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./serviceAccountKey.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function testRead() {
  console.log("Checking cloud database...");
  const snapshot = await db.collection('nodes').get();
  
  if (snapshot.empty) {
    console.log("❌ The database is indeed empty. The write didn't commit.");
  } else {
    console.log(`✅ Success! Found ${snapshot.size} seeded documents in the cloud!`);
    snapshot.forEach(doc => {
      console.log(`- Document ID: ${doc.id} => Last Comms: ${doc.data().last_communication}`);
    });
  }
}

testRead().catch(console.error);
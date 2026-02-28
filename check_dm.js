const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://pronab:nCGvGtr06Yvr719h@cluster0.ihezzbq.mongodb.net/';

async function check() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('tradelog_main');

  console.log('--- LATEST CONVERSATIONS ---');
  const convs = await db.collection('conversations').find({}).sort({ createdAt: -1 }).limit(5).toArray();
  convs.forEach(c => {
    console.log(`ID: ${c._id}, Participants: ${JSON.stringify(c.participants)}, isGroup: ${c.isGroup}`);
  });

  console.log('\n--- LATEST REQUESTS ---');
  const reqs = await db.collection('message_requests').find({}).sort({ updatedAt: -1 }).limit(5).toArray();
  reqs.forEach(r => {
    console.log(`Req ID: ${r._id}, from: ${r.senderId}, to: ${r.receiverId}, status: ${r.status}`);
  });

  await client.close();
}

check().catch(console.error);

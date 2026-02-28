const { MongoClient, ObjectId } = require('mongodb');
const MONGODB_URI = 'mongodb+srv://pronab:nCGvGtr06Yvr719h@cluster0.ihezzbq.mongodb.net/';

async function check() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('tradelog_main');

  const user = await db.collection('users').findOne({ email: 'pronabhalder53@gmail.com' });
  console.log('User Pronab ID:', user._id.toString());

  const convs = await db.collection('conversations').find({}).toArray();
  console.log('Total conversations:', convs.length);
  convs.forEach(c => {
    console.log(`Conv ${c._id}: participants=${JSON.stringify(c.participants.map(p => p.toString()))}`);
    const isMatch = c.participants.some(p => p.toString() === user._id.toString());
    console.log(`Match with Pronab? ${isMatch}`);
  });

  await client.close();
}
check();

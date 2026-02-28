const { MongoClient, ObjectId } = require('mongodb');
const MONGODB_URI = 'mongodb+srv://pronab:nCGvGtr06Yvr719h@cluster0.ihezzbq.mongodb.net/';

async function fix() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('tradelog_main');

  const pronabId = new ObjectId('699d5e4dff335494f6937da1');
  const res = await db.collection('conversations').updateMany(
    { participants: pronabId },
    { $pull: { deletedBy: pronabId } }
  );
  console.log('Update result:', res);

  await client.close();
}
fix();

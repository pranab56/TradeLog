const { MongoClient, ObjectId } = require('mongodb');
const MONGODB_URI = 'mongodb+srv://pronab:nCGvGtr06Yvr719h@cluster0.ihezzbq.mongodb.net/';

async function check() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('tradelog_main');

  const convs = await db.collection('conversations').find({}).toArray();
  convs.forEach(c => {
    console.log(`Conv ${c._id}: deletedBy=${JSON.stringify(c.deletedBy)}`);
  });

  await client.close();
}
check();

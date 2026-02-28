const { MongoClient, ObjectId } = require('mongodb');
const MONGODB_URI = 'mongodb+srv://pronab:nCGvGtr06Yvr719h@cluster0.ihezzbq.mongodb.net/';

async function check() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('tradelog_main');

  const allConvs = await db.collection('conversations').find({}).toArray();

  allConvs.forEach(c => {
    console.log(`Conv ID: ${c._id}`);
    c.participants.forEach((p, i) => {
      console.log(`P${i}: type=${typeof p}, constructor=${p.constructor.name}, value=${p}`);
    });
  });

  await client.close();
}
check();

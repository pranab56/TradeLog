import { getDb } from './lib/mongodb-client';

async function check() {
  const db = await getDb('tradelog_main');

  console.log('--- USERS ---');
  const users = await db.collection('users').find({}).toArray();
  users.forEach(u => {
    console.log(`User: ${u.name}, ID type: ${typeof u._id}, ID string: ${u._id.toString()}`);
  });

  console.log('\n--- CONVERSATIONS ---');
  const convs = await db.collection('conversations').find({}).toArray();
  convs.forEach(c => {
    console.log(`Conv: ${c.name || 'DM'}, Participants: ${JSON.stringify(c.participants.map((p: any) => typeof p + ' ' + p.toString()))}`);
  });

  console.log('\n--- REQUESTS ---');
  const reqs = await db.collection('message_requests').find({}).toArray();
  reqs.forEach(r => {
    console.log(`Req from ${r.senderId.toString()} to ${r.receiverId.toString()}, Status: ${r.status}`);
  });

  process.exit(0);
}

check();

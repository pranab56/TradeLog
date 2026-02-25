import { verifyToken } from '@/lib/auth-utils';
import { getDb } from '@/lib/mongodb-client';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded: any = verifyToken(token);
    const db = await getDb('tradelog_main');
    const user = await db.collection('users').findOne({ email: decoded.email });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const requests = await db.collection('message_requests').aggregate([
      { $match: { receiverId: user._id, status: 'pending' } },
      {
        $lookup: {
          from: 'users',
          localField: 'senderId',
          foreignField: '_id',
          as: 'sender'
        }
      },
      { $unwind: '$sender' },
      {
        $project: {
          _id: 1,
          status: 1,
          createdAt: 1,
          'sender.name': 1,
          'sender.email': 1,
          'sender.profileImage': 1
        }
      }
    ]).toArray();

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Fetch requests error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded: any = verifyToken(token);
    const { receiverId } = await req.json();

    const db = await getDb('tradelog_main');
    const sender = await db.collection('users').findOne({ email: decoded.email });

    if (!sender) return NextResponse.json({ error: 'Sender not found' }, { status: 404 });

    const request = await db.collection('message_requests').insertOne({
      senderId: sender._id,
      receiverId: new ObjectId(receiverId),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({ message: 'Request sent', requestId: request.insertedId }, { status: 201 });
  } catch (error) {
    console.error('Send request error:', error);
    return NextResponse.json({ error: 'Error sending request' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { requestId, status } = await req.json();

    if (!['accepted', 'rejected', 'blocked'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const db = await getDb('tradelog_main');
    await db.collection('message_requests').updateOne(
      { _id: new ObjectId(requestId) },
      { $set: { status, updatedAt: new Date() } }
    );

    return NextResponse.json({ message: `Request ${status}` });
  } catch (error) {
    console.error('Update request error:', error);
    return NextResponse.json({ error: 'Error updating request' }, { status: 500 });
  }
}

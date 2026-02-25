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
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const db = await getDb('tradelog_main');
    const user = await db.collection('users').findOne({ email: decoded.email });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const conversations = await db.collection('conversations').aggregate([
      { $match: { participants: user._id } },
      {
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: '_id',
          as: 'participantDetails'
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'lastMessageId',
          foreignField: '_id',
          as: 'lastMessage'
        }
      },
      { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },
      { $sort: { updatedAt: -1 } }
    ]).toArray();

    // Map participantDetails to match expected format
    const formattedConversations = conversations.map(c => ({
      ...c,
      participants: c.participantDetails.map((p: any) => ({
        _id: p._id.toString(),
        name: p.name,
        email: p.email,
        profileImage: p.profileImage,
        onlineStatus: p.onlineStatus
      }))
    }));

    return NextResponse.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Fetch conversations error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded: any = verifyToken(token);
    const { participants, isGroup, name, description } = await req.json();

    const db = await getDb('tradelog_main');
    const user = await db.collection('users').findOne({ email: decoded.email });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const participantObjectIds = [...new Set([...participants.map((id: string) => new ObjectId(id)), user._id])];

    if (!isGroup && participantObjectIds.length === 2) {
      const existing = await db.collection('conversations').findOne({
        isGroup: false,
        participants: { $all: participantObjectIds, $size: 2 }
      });
      if (existing) return NextResponse.json({ conversation: existing });
    }

    const newConversation = {
      participants: participantObjectIds,
      isGroup: !!isGroup,
      name,
      description,
      admins: isGroup ? [user._id] : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('conversations').insertOne(newConversation);
    return NextResponse.json({ conversation: { ...newConversation, _id: result.insertedId } }, { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

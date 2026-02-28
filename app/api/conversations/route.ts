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

    console.log('Fetching conversations for user ID:', user._id);

    const conversations = await db.collection('conversations').aggregate([
      {
        $match: {
          participants: { $in: [user._id, user._id.toString()] },
          deletedBy: { $nin: [user._id, user._id.toString()] }
        }
      },
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

    console.log(`Found ${conversations.length} conversations for user ${user.email}`);
    if (conversations.length > 0) {
      console.log('Sample conversation participants:', conversations[0].participants);
    }

    // Map participantDetails and add user-specific flags
    const formattedConversations = conversations.map(c => ({
      ...c,
      _id: c._id.toString(), // Always a plain string so socket room IDs match
      isPinned: c.pinnedBy?.some((id: ObjectId) => id.toString() === user._id.toString()) || false,
      isMuted: c.mutedBy?.some((id: ObjectId) => id.toString() === user._id.toString()) || false,
      isBlocked: c.blockedBy?.some((id: ObjectId) => id.toString() === user._id.toString()) || false,
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
      pinnedBy: [],
      mutedBy: [],
      blockedBy: [],
      deletedBy: [],
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

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded: any = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { conversationId, isPinned, isMuted, isBlocked } = await req.json();
    const db = await getDb('tradelog_main');
    const user = await db.collection('users').findOne({ email: decoded.email });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const updateQuery: any = { $set: { updatedAt: new Date() } };

    if (typeof isPinned !== 'undefined') {
      updateQuery[isPinned ? '$addToSet' : '$pull'] = { pinnedBy: user._id };
    }
    if (typeof isMuted !== 'undefined') {
      updateQuery[isMuted ? '$addToSet' : '$pull'] = { mutedBy: user._id };
    }
    if (typeof isBlocked !== 'undefined') {
      updateQuery[isBlocked ? '$addToSet' : '$pull'] = { blockedBy: user._id };
    }

    // Since MongoDB doesn't allow multiple top-level operators easily in one update if they target same fields,
    // we handle $set separate from $addToSet/$pull if needed, but here they target different fields.
    // However, $addToSet and $pull can't be in the same object if we have multiple updates. 
    // Let's do it sequentially or construct a proper multi-operator query.

    const finalUpdate: any = { $set: { updatedAt: new Date() } };
    if (updateQuery.$addToSet) finalUpdate.$addToSet = updateQuery.$addToSet;
    if (updateQuery.$pull) finalUpdate.$pull = updateQuery.$pull;

    await db.collection('conversations').updateOne(
      { _id: new ObjectId(conversationId) },
      finalUpdate
    );

    return NextResponse.json({ message: 'Conversation updated' });
  } catch (error) {
    console.error('Update conversation error:', error);
    return NextResponse.json({ error: 'Error updating conversation' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded: any = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });

    const db = await getDb('tradelog_main');
    const user = await db.collection('users').findOne({ email: decoded.email });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // "Delete" for this user only by adding them to deletedBy array
    await db.collection('conversations').updateOne(
      { _id: new ObjectId(conversationId) },
      { $addToSet: { deletedBy: user._id }, $set: { updatedAt: new Date() } }
    );

    return NextResponse.json({ message: 'Conversation deleted for you' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json({ error: 'Error deleting conversation' }, { status: 500 });
  }
}

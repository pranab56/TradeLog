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
      {
        $lookup: {
          from: 'messages',
          let: { convId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$conversationId', '$$convId'] },
                senderId: { $ne: user._id },
                'readBy.userId': { $ne: user._id }
              }
            },
            { $count: 'unread' }
          ],
          as: 'unreadData'
        }
      },
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
      isBlocked: c.blockedBy?.length > 0 ? true : false,
      isBlockedByMe: c.blockedBy?.some((id: ObjectId) => id.toString() === user._id.toString()) || false,
      unreadCount: c.unreadData?.[0]?.unread || 0,
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

    const finalUpdate: any = { $set: { updatedAt: new Date() }, $addToSet: {}, $pull: {} };

    if (typeof isPinned !== 'undefined') {
      if (isPinned) finalUpdate.$addToSet.pinnedBy = user._id; else finalUpdate.$pull.pinnedBy = user._id;
    }
    if (typeof isMuted !== 'undefined') {
      if (isMuted) finalUpdate.$addToSet.mutedBy = user._id; else finalUpdate.$pull.mutedBy = user._id;
    }
    if (typeof isBlocked !== 'undefined') {
      if (isBlocked) finalUpdate.$addToSet.blockedBy = user._id; else finalUpdate.$pull.blockedBy = user._id;
    }

    if (Object.keys(finalUpdate.$addToSet).length === 0) delete finalUpdate.$addToSet;
    if (Object.keys(finalUpdate.$pull).length === 0) delete finalUpdate.$pull;

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

import { verifyToken } from '@/lib/auth-utils';
import { getDb } from '@/lib/mongodb-client';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!conversationId) return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const db = await getDb('tradelog_main');

    const messages = await db.collection('messages').aggregate([
      { $match: { conversationId: new ObjectId(conversationId) } },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
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
          content: 1,
          messageType: 1,
          mediaUrl: 1,
          createdAt: 1,
          senderId: {
            _id: '$sender._id',
            name: '$sender.name',
            profileImage: '$sender.profileImage'
          }
        }
      }
    ]).toArray();

    return NextResponse.json({
      messages: messages.reverse(),
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded: any = verifyToken(token);
    const { conversationId, content, messageType, mediaUrl, replyTo } = await req.json();

    const db = await getDb('tradelog_main');
    const user = await db.collection('users').findOne({ email: decoded.email });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const newMessage = {
      conversationId: new ObjectId(conversationId),
      senderId: user._id,
      content,
      messageType: messageType || 'text',
      mediaUrl,
      replyTo: replyTo ? new ObjectId(replyTo) : null,
      status: 'sent',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('messages').insertOne(newMessage);

    await db.collection('conversations').updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $set: {
          lastMessageId: result.insertedId,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      message: {
        ...newMessage,
        _id: result.insertedId,
        senderId: {
          _id: user._id,
          name: user.name,
          profileImage: user.profileImage
        }
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
        $lookup: {
          from: 'messages',
          localField: 'replyTo',
          foreignField: '_id',
          as: 'replyToMessage'
        }
      },
      {
        $unwind: {
          path: '$replyToMessage',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'replyToMessage.senderId',
          foreignField: '_id',
          as: 'replyToUser'
        }
      },
      {
        $unwind: {
          path: '$replyToUser',
          preserveNullAndEmptyArrays: true
        }
      },
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
          },
          replyTo: {
            _id: '$replyToMessage._id',
            content: '$replyToMessage.content',
            messageType: '$replyToMessage.messageType',
            senderName: '$replyToUser.name'
          },
          reactions: 1,
          isEdited: 1,
          isDeleted: 1
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

    const conversation = await db.collection('conversations').findOne({ _id: new ObjectId(conversationId) });
    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    if (conversation.blockedBy && conversation.blockedBy.length > 0) {
      return NextResponse.json({ error: 'Cannot send messages to a blocked conversation' }, { status: 403 });
    }

    const newMessage = {
      conversationId: new ObjectId(conversationId),
      senderId: user._id,
      content,
      messageType: messageType || 'text',
      mediaUrl,
      replyTo: replyTo ? new ObjectId(replyTo) : null,
      status: 'sent',
      reactions: [],
      isEdited: false,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('messages').insertOne(newMessage);

    await db.collection('conversations').updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $set: {
          lastMessageId: result.insertedId,
          updatedAt: new Date(),
          deletedBy: []
        }
      }
    );

    return NextResponse.json({
      message: {
        _id: result.insertedId.toString(),
        conversationId: conversationId, // keep as the original string that was passed in
        senderId: {
          _id: user._id.toString(),
          name: user.name,
          profileImage: user.profileImage || ''
        },
        content,
        messageType: messageType || 'text',
        mediaUrl: mediaUrl || null,
        replyTo: replyTo || null,
        status: 'sent',
        reactions: [],
        isEdited: false,
        isDeleted: false,
        createdAt: newMessage.createdAt,
        updatedAt: newMessage.updatedAt,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded: any = verifyToken(token);
    const { messageId, type, content, emoji } = await req.json();

    const db = await getDb('tradelog_main');
    const user = await db.collection('users').findOne({ email: decoded.email });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (type === 'edit') {
      const result = await db.collection('messages').updateOne(
        { _id: new ObjectId(messageId), senderId: user._id },
        { $set: { content, isEdited: true, updatedAt: new Date() } }
      );
      if (result.matchedCount === 0) return NextResponse.json({ error: 'Message not found or unauthorized' }, { status: 404 });
    } else if (type === 'react') {
      const message = await db.collection('messages').findOne({ _id: new ObjectId(messageId) });
      if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

      let reactions = message.reactions || [];
      const userReactionIndex = reactions.findIndex((r: any) => r.userId.toString() === user._id.toString());

      if (userReactionIndex > -1) {
        if (reactions[userReactionIndex].emoji === emoji) {
          // Remove if same emoji
          reactions.splice(userReactionIndex, 1);
        } else {
          // Update if different emoji
          reactions[userReactionIndex].emoji = emoji;
        }
      } else {
        // Add new reaction
        reactions.push({ userId: user._id, emoji, userName: user.name });
      }

      await db.collection('messages').updateOne(
        { _id: new ObjectId(messageId) },
        { $set: { reactions, updatedAt: new Date() } }
      );
    }

    const updatedMessage = await db.collection('messages').findOne({ _id: new ObjectId(messageId) });
    return NextResponse.json({ message: updatedMessage });
  } catch (error) {
    console.error('Update message error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('messageId');

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded: any = verifyToken(token);
    const db = await getDb('tradelog_main');
    const user = await db.collection('users').findOne({ email: decoded.email });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const result = await db.collection('messages').updateOne(
      { _id: new ObjectId(messageId as string), senderId: user._id },
      { $set: { content: 'This message was deleted', isDeleted: true, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) return NextResponse.json({ error: 'Message not found or unauthorized' }, { status: 404 });

    return NextResponse.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { verifyToken } from '@/lib/auth-utils';
import { getUserDb } from '@/lib/mongodb-client';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded: any = verifyToken(token);
    if (!decoded || !decoded.dbName) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const db = await getUserDb(decoded.dbName);
    const todos = await db.collection('todos').find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json(todos);
  } catch (error: any) {
    console.error('Fetch todos error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded: any = verifyToken(token);
    if (!decoded || !decoded.dbName) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { task } = body;

    if (!task) {
      return NextResponse.json({ error: 'Task is required' }, { status: 400 });
    }

    const db = await getUserDb(decoded.dbName);
    const todosCollection = db.collection('todos');

    const newTodo = {
      task,
      completed: false,
      createdAt: new Date(),
    };

    const result = await todosCollection.insertOne(newTodo);

    return NextResponse.json({ ...newTodo, _id: result.insertedId }, { status: 201 });
  } catch (error: any) {
    console.error('Create todo error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { TokenPayload, verifyToken } from '@/lib/auth-utils';
import { getUserDb } from '@/lib/mongodb-client';
import { unlink } from 'fs/promises';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import path from 'path';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token) as TokenPayload | null;
    if (!decoded || !decoded.dbName) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const db = await getUserDb(decoded.dbName);
    const galleryCollection = db.collection('gallery');

    // Find the item first to get the URL
    const item = await galleryCollection.findOne({ _id: new ObjectId(id) });
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Delete the file from filesystem
    try {
      const filePath = path.join(process.cwd(), 'public', item.url);
      await unlink(filePath);
    } catch (e) {
      console.warn('File already deleted or not found on disk:', e);
    }

    // Delete from DB
    await galleryCollection.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Delete gallery error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

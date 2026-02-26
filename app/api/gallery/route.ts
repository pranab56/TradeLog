import { verifyToken } from '@/lib/auth-utils';
import { getUserDb } from '@/lib/mongodb-client';
import { mkdir } from 'fs/promises';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export const config = {
  api: {
    bodyParser: false, // Disable built-in parser to handle large files
  },
};

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
    const gallery = await db.collection('gallery').find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json(gallery);
  } catch (error: any) {
    console.error('Fetch gallery error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    // For large files (1GB), we use formData but we are careful.
    // In App Router, we usually use formData(). 
    // However, if we want to stream directly, we'd use request.body.
    // For simplicity with filename/type, formData is better but buffers more.
    // Let's use a hybrid or just standard formData for now with a note.

    // NOTE: For 1GB files, ideally we should use a custom reader to avoid buffering.
    // Since App Router's formData() might buffer in some environments, 
    // a more robust way is to use a multipart parser that streams.

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Create unique filename
    const extension = path.extname(file.name);
    const fileName = `${crypto.randomUUID()}${extension}`;
    const uploadDir = path.join(process.cwd(), 'public', 'gallery');

    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);

    // Convert File to Buffer/Stream and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fs = require('fs');
    await fs.promises.writeFile(filePath, buffer);

    const fileUrl = `/gallery/${fileName}`;
    const mimeType = file.type;
    const type = mimeType.startsWith('video/') ? 'video' : 'image';

    const db = await getUserDb(decoded.dbName);
    const galleryItem = {
      url: fileUrl,
      type: type,
      fileName: file.name,
      mimeType: mimeType,
      size: file.size,
      createdAt: new Date()
    };

    const result = await db.collection('gallery').insertOne(galleryItem);

    return NextResponse.json({ ...galleryItem, _id: result.insertedId }, { status: 201 });
  } catch (error: any) {
    console.error('Upload gallery error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { TokenPayload, verifyToken } from '@/lib/auth-utils';
import { getUserDb } from '@/lib/mongodb-client';
import { v2 as cloudinary } from 'cloudinary';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    const decoded = verifyToken(token) as TokenPayload | null;
    if (!decoded || !decoded.dbName) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const db = await getUserDb(decoded.dbName);
    const gallery = await db.collection('gallery').find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json(gallery);
  } catch (err: unknown) {
    console.error('Fetch gallery error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token) as TokenPayload | null;
    if (!decoded || !decoded.dbName) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const mimeType = file.type;
    const isVideo = mimeType.startsWith('video/');

    // Upload to Cloudinary (auto detects image/video based on base64 data)
    const uploadResult = await cloudinary.uploader.upload(base64, {
      folder: 'tradelog_gallery',
      resource_type: isVideo ? 'video' : 'image',
    });

    const fileUrl = uploadResult.secure_url;

    const db = await getUserDb(decoded.dbName);
    const galleryItem = {
      url: fileUrl,
      type: isVideo ? 'video' : 'image',
      fileName: file.name,
      mimeType: mimeType,
      size: file.size,
      createdAt: new Date()
    };

    const result = await db.collection('gallery').insertOne(galleryItem);

    return NextResponse.json({ ...galleryItem, _id: result.insertedId }, { status: 201 });
  } catch (err: unknown) {
    console.error('Upload gallery error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

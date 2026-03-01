import { TokenPayload, verifyToken } from '@/lib/auth-utils';
import { getUserDb } from '@/lib/mongodb-client';
import { v2 as cloudinary } from 'cloudinary';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    // Delete from Cloudinary if it's a Cloudinary URL
    if (item.url && item.url.includes('cloudinary.com')) {
      try {
        // Extract public ID from Cloudinary URL
        // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.ext
        const urlParts = item.url.split('/');
        const filenameWithExt = urlParts[urlParts.length - 1]; // filename.ext
        const folder = urlParts[urlParts.length - 2]; // folder (e.g. tradelog_gallery)
        const filename = filenameWithExt.split('.')[0]; // filename
        const publicId = `${folder}/${filename}`;

        await cloudinary.uploader.destroy(publicId);
      } catch (e) {
        console.warn('Failed to delete file from Cloudinary:', e);
      }
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

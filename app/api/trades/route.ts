import connectDB from '@/lib/db';
import DailyRecord from '@/models/DailyRecord';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    const records = await DailyRecord.find({}).sort({ date: -1 });
    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    // Check if record for this date already exists
    const existing = await DailyRecord.findOne({ date: new Date(body.date) });
    if (existing) {
      return NextResponse.json({ error: 'Record for this date already exists' }, { status: 400 });
    }

    const newRecord = await DailyRecord.create(body);
    return NextResponse.json(newRecord, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

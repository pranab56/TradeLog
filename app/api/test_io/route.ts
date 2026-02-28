import { NextResponse } from 'next/server';

export async function GET() {
  const ioExists = !!(global as any).io;
  const numClients = ioExists ? (global as any).io.engine.clientsCount : 0;

  const connectedRooms = ioExists ? Array.from((global as any).io.sockets.adapter.rooms.keys()) : [];

  return NextResponse.json({ ioExists, numClients, connectedRooms });
}

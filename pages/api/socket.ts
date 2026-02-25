import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import { NextApiResponseServerIO } from '../../types/socket';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const path = '/api/socket';
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: path,
      addTrailingSlash: false,
    });
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);

      socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
      });

      socket.on('send-message', (data) => {
        // Broadcat to room
        socket.to(data.conversationId).emit('receive-message', data);
      });

      socket.on('typing', (data) => {
        socket.to(data.conversationId).emit('user-typing', data);
      });

      socket.on('mark-read', (data) => {
        socket.to(data.conversationId).emit('message-read', data);
      });

      socket.on('edit-message', (data) => {
        socket.to(data.conversationId).emit('message-edited', data);
      });

      socket.on('delete-message', (data) => {
        socket.to(data.conversationId).emit('message-deleted', data);
      });

      socket.on('stop-typing', (data) => {
        socket.to(data.conversationId).emit('user-stop-typing', data);
      });

      socket.on('disconnect', async () => {
        console.log('Socket disconnected:', socket.id);
        const userId = (socket as any).userId;
        if (userId) {
          // Broadcat offline status to rooms
          socket.broadcast.emit('presence-update', { userId, status: 'offline' });
        }
      });

      socket.on('update-presence', (data) => {
        (socket as any).userId = data.userId;
        socket.broadcast.emit('presence-update', { userId: data.userId, status: data.status });
      });
    });
  }

  res.end();
};

export default ioHandler;

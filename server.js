const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: ServerIO } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Normalize any ID (ObjectId object, {$oid:...}, or plain string) to a string
const getId = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  if (typeof id === 'object' && typeof id.toString === 'function') {
    const s = id.toString();
    // MongoDB ObjectId.toString() returns hex string - but plain "[object Object]" means it failed
    if (s !== '[object Object]') return s;
  }
  return String(id);
};

const { MongoClient, ObjectId } = require('mongodb');

// Connect standalone mongo client for user presence tracking
const mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb+srv://pronab:nCGvGtr06Yvr719h@cluster0.ihezzbq.mongodb.net/');
mongoClient.connect().then(() => console.log('[SOCKET] MongoDB connected for presence tracking')).catch(console.error);

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      if (parsedUrl.pathname && parsedUrl.pathname.startsWith('/socket.io/')) {
        return;
      }
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new ServerIO(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 60000,
  });

  global.io = io;

  io.on('connection', (socket) => {
    console.log(`[SOCKET] ✅ Client connected: ${socket.id}`);

    socket.on('join-room', (roomId) => {
      const rId = getId(roomId);
      if (!rId) { console.warn('[SOCKET] join-room called with empty roomId'); return; }
      socket.join(rId);
      console.log(`[SOCKET] ${socket.id} joined CONVERSATION room: "${rId}"`);
    });

    socket.on('join-user', (userId) => {
      const uId = getId(userId);
      if (!uId) { console.warn('[SOCKET] join-user called with empty userId'); return; }
      socket.join(uId);
      socket.userId = uId;
      console.log(`[SOCKET] ${socket.id} joined PERSONAL room: "${uId}"`);

      // Update DB to online instantly
      mongoClient.db('tradelog_main').collection('users').updateOne(
        { _id: new ObjectId(uId) },
        { $set: { onlineStatus: 'online' } }
      ).catch(err => console.error('[SOCKET] Failed to set user online config:', err));

      socket.broadcast.emit('presence-update', { userId: uId, status: 'online' });
    });

    socket.on('send-message', (data) => {
      const convId = getId(data.conversationId);
      console.log(`[SOCKET] send-message → room:"${convId}" | from:${socket.id}`);

      // Log which sockets are in that room for debugging
      const room = io.sockets.adapter.rooms.get(convId);
      console.log(`[SOCKET] room "${convId}" has ${room ? room.size : 0} socket(s):`, room ? [...room] : []);

      // Send to everyone in the conversation room EXCEPT the sender
      socket.to(convId).emit('receive-message', data);

      // Also notify each participant's personal room (sidebar update)
      if (data.participants && Array.isArray(data.participants)) {
        data.participants.forEach((pId) => {
          const pRoom = getId(pId);
          if (pRoom) socket.to(pRoom).emit('new-message-notification', data);
        });
      }
    });

    socket.on('new-invite', (data) => {
      const rId = getId(data.receiverId);
      console.log(`[SOCKET] new-invite → receiver room:"${rId}"`);
      const room = io.sockets.adapter.rooms.get(rId);
      console.log(`[SOCKET] receiver room "${rId}" has ${room ? room.size : 0} socket(s)`);
      socket.to(rId).emit('receive-invite', data);
    });

    socket.on('invite-accepted', (data) => {
      const sId = getId(data.senderId);
      console.log(`[SOCKET] invite-accepted → sender room:"${sId}"`);
      socket.to(sId).emit('receive-invite-accepted', data);
    });

    socket.on('new-conversation', (data) => {
      if (data.participants && Array.isArray(data.participants)) {
        data.participants.forEach((pId) => {
          const pRoom = getId(pId);
          if (pRoom) socket.to(pRoom).emit('conversation-created', data);
        });
      }
    });

    socket.on('delete-conversation', (data) => {
      if (data.participants && Array.isArray(data.participants)) {
        data.participants.forEach((pId) => {
          const pRoom = getId(pId);
          if (pRoom) socket.to(pRoom).emit('conversation-deleted', data);
        });
      }
    });

    socket.on('typing', (data) => {
      socket.to(getId(data.conversationId)).emit('user-typing', data);
    });

    socket.on('stop-typing', (data) => {
      socket.to(getId(data.conversationId)).emit('user-stop-typing', data);
    });

    socket.on('mark-read', (data) => {
      socket.to(getId(data.conversationId)).emit('message-read', data);
    });

    socket.on('edit-message', (data) => {
      socket.to(getId(data.conversationId)).emit('message-edited', data);
    });

    socket.on('delete-message', (data) => {
      socket.to(getId(data.conversationId)).emit('message-deleted', data);
    });

    socket.on('react-message', (data) => {
      socket.to(getId(data.conversationId)).emit('message-reacted', data);
    });

    socket.on('update-presence', (data) => {
      const uId = getId(data.userId);
      socket.userId = uId;
      socket.broadcast.emit('presence-update', { userId: uId, status: data.status });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[SOCKET] ❌ Client disconnected: ${socket.id} | reason: ${reason}`);
      const userId = socket.userId;
      if (userId) {
        socket.broadcast.emit('presence-update', { userId, status: 'offline' });

        // Update DB to offline instantly
        mongoClient.db('tradelog_main').collection('users').updateOne(
          { _id: new ObjectId(userId) },
          { $set: { onlineStatus: 'offline' } }
        ).catch(err => console.error('[SOCKET] Failed to set user offline config:', err));
      }
    });

    socket.on('error', (err) => {
      console.error(`[SOCKET] Error on ${socket.id}:`, err);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log('> Socket.IO server running on default path /socket.io/');
    });
});

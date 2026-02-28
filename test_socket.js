/**
 * Real-time Socket.IO test
 * Run: node test_socket.js
 */

const { io } = require('socket.io-client');

const socket1 = io('http://localhost:3000', {
  transports: ['polling', 'websocket'],
});

const socket2 = io('http://localhost:3000', {
  transports: ['polling', 'websocket'],
});

const TEST_ROOM = 'test-room-123';
const TEST_USER1 = 'user-aaa';
const TEST_USER2 = 'user-bbb';

socket1.on('connect', () => {
  console.log('✅ Socket1 connected:', socket1.id);
  socket1.emit('join-user', TEST_USER1);
  socket1.emit('join-room', TEST_ROOM);
});

socket2.on('connect', () => {
  console.log('✅ Socket2 connected:', socket2.id);
  socket2.emit('join-user', TEST_USER2);
  socket2.emit('join-room', TEST_ROOM);

  setTimeout(() => {
    console.log('\n--- TEST: Socket2 sends a message ---');
    socket2.emit('send-message', {
      conversationId: TEST_ROOM,
      content: 'Hello from socket2!',
      senderId: TEST_USER2,
      participants: [TEST_USER1, TEST_USER2],
    });
  }, 500);
});

socket1.on('receive-message', (data) => {
  console.log('✅ Socket1 received message (real-time WORKS!):', data.content);
  process.exit(0);
});

socket1.on('new-message-notification', (data) => {
  console.log('✅ Socket1 received notification (real-time WORKS!):', data.content);
});

socket1.on('connect_error', (err) => {
  console.error('❌ Socket1 connect error:', err.message);
});

socket2.on('connect_error', (err) => {
  console.error('❌ Socket2 connect error:', err.message);
});

setTimeout(() => {
  console.log('\n❌ TEST TIMED OUT - real-time is NOT working');
  console.log('Socket1 connected:', socket1.connected);
  console.log('Socket2 connected:', socket2.connected);
  socket1.disconnect();
  socket2.disconnect();
  process.exit(1);
}, 5000);

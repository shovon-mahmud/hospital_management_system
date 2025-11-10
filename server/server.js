import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './src/app.js';
import env from './src/config/env.js';
import { connectDB } from './src/config/db.js';

const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: env.corsOrigins, credentials: true } });
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);
  socket.on('user:join', (userId) => {
    if (userId) {
      socket.join(String(userId));
      console.log(`Socket ${socket.id} joined room user:${userId}`);
    }
  });
  socket.on('appointment:created', (payload) => {
    socket.broadcast.emit('appointment:created', payload);
  });
});

const start = async () => {
  await connectDB();
  server.listen(env.port, () => console.log(`Server listening on :${env.port}`));
};

start();

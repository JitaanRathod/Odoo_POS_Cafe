// src/server.js
// Entry point — boots HTTP server + Socket.io

require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const socketUtil = require('./utils/socket');
const { port, nodeEnv } = require('./config/env');
const prisma = require('./config/prisma');

// ── HTTP + Socket.io Setup ────────────────────────────────────
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

// Register socket instance globally
socketUtil.init(io);

// ── Socket.io Connection Handlers ────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Allow clients to join named rooms (e.g. kitchen display, branch room)
  socket.on('join:room', (room) => {
    socket.join(room);
    console.log(`[Socket] ${socket.id} joined room: ${room}`);
  });

  socket.on('leave:room', (room) => {
    socket.leave(room);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ── Graceful Shutdown ─────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n[Server] ${signal} received — shutting down gracefully...`);
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ── Boot ─────────────────────────────────────────────────────
const start = async () => {
  try {
    // Verify DB connection
    await prisma.$connect();
    console.log('[DB] MySQL connected via Prisma');

    httpServer.listen(port, () => {
      console.log(`\n🚀  Server running in ${nodeEnv} mode on port ${port}`);
      console.log(`    API base: http://localhost:${port}/api`);
      console.log(`    Health:   http://localhost:${port}/api/health\n`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
};

start();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/api.js';
import { initMultiplayerSocket } from './socket/multiplayer.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api', apiRoutes);

// Health Check
app.get('/', (req, res) => {
  res.json({ success: true, message: '🧠 Mind Match Game API is running!' });
});

// Initialize Multiplayer WebSocket Logic
initMultiplayerSocket(io);

// Connect DB then start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚀 Mind Match Backend running on http://localhost:${PORT}`);
    console.log(`⚡ WebSocket server active for real-time multiplayer`);
    console.log(`📡 API available at http://localhost:${PORT}/api\n`);
  });
});

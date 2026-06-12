```javascript
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

// Allowed Origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
];

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api', apiRoutes);

// Health Check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🧠 Mind Match Game API is running!'
  });
});

// Initialize Multiplayer Socket
initMultiplayerSocket(io);

// Start Server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`⚡ Socket.IO server active`);
  });
});
```

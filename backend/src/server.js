// backend/src/server.js
import 'dotenv/config';
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';


import sequelize from './sequelize.js';       // <- uses the SSL-forced config
import buildRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// HTTP + WS
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET','POST'] } });

io.on('connection', (socket) => {
  socket.on('join-auction', (id)=> socket.join(`auction:${id}`));
  socket.on('leave-auction', (id)=> socket.leave(`auction:${id}`));

  socket.on('join-user', (id)=> socket.join(`user:${id}`));
  socket.on('leave-user', (id)=> socket.leave(`user:${id}`));
});

// API
app.use('/api', buildRoutes(io));

// Static (prod)
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get('*', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  res.sendFile(indexPath, (err) => err && res.status(404).json({ error: 'Not Found' }));
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ DB connected and synced');
  } catch (e) {
    console.error('❌ DB init failed:', e.message);
  }
  console.log('API + WS listening on', PORT);
});

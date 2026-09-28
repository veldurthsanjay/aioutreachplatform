import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { wsManager } from './services/wsService';

import { campaignsRouter } from './routes/campaignsRouter';
import { leadsRouter } from './routes/leadsRouter';
import { messagesRouter } from './routes/messagesRouter';
import { outreachRouter } from './routes/outreachRouter';
import { conversationsRouter } from './routes/conversationsRouter';
import { followupsRouter } from './routes/followupsRouter';
import { integrationsRouter } from './routes/integrationsRouter';
import { statsRouter } from './routes/statsRouter';
import { settingsRouter } from './routes/settingsRouter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/campaigns', campaignsRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/outreach', outreachRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/followups', followupsRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/settings', settingsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ server });
wsManager.initialize(wss);

server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 AI Outreach Platform Server Running!`);
  console.log(`📡 HTTP API: http://localhost:${PORT}`);
  console.log(`⚡ WebSocket: ws://localhost:${PORT}`);
  console.log(`=========================================`);
});

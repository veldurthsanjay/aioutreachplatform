import { WebSocketServer, WebSocket } from 'ws';

export interface WSEvent {
  type: string;
  payload: any;
  timestamp: string;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  public initialize(wss: WebSocketServer) {
    this.wss = wss;

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      console.log(`[WS] Client connected. Total active clients: ${this.clients.size}`);

      // Send initial heartbeat / welcome
      ws.send(JSON.stringify({
        type: 'SYSTEM_CONNECTED',
        payload: { message: 'WebSocket connected successfully' },
        timestamp: new Date().toISOString()
      }));

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[WS] Client disconnected. Active clients: ${this.clients.size}`);
      });

      ws.on('error', (err) => {
        console.error('[WS] Socket error:', err);
        this.clients.delete(ws);
      });
    });
  }

  public broadcast(type: string, payload: any) {
    const event: WSEvent = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };
    const message = JSON.stringify(event);

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
}

export const wsManager = new WebSocketManager();

import { WebSocketServer } from 'ws';
import { scrapeAll } from './controllers/scraper.controller.js';

export const createWebSocketServer = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', async (message) => {
      try {
        const { query } = JSON.parse(message);
        if (query) {
          console.log(`Received query: ${query}`);
          scrapeAll({ body: { query } }, {
            json: (data) => {
              ws.send(JSON.stringify(data));
            }
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
        ws.send(JSON.stringify({ success: false, message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
};

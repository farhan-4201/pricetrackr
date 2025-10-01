import { ScrapedProduct } from './api';

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8000';

export let socket: WebSocket | null = null;

type WebSocketMessage =
  | { type: 'RESULT'; payload: { marketplace: string; products: ScrapedProduct[] } }
  | { type: 'NO_RESULTS'; payload: { marketplace: string } }
  | { type: 'ERROR'; payload: { marketplace: string; message: string } }
  | { type: 'DONE' };

export const connectWebSocket = (
  onOpen: () => void,
  onMessage: (data: WebSocketMessage) => void,
  onError: (error: Event) => void,
  onClose: () => void
) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return;
  }

  socket = new WebSocket(WEBSOCKET_URL);

  socket.onopen = onOpen;
  socket.onmessage = (event) => {
    try {
      const data: WebSocketMessage = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  socket.onerror = onError;
  socket.onclose = onClose;
};

export const sendWebSocketMessage = (query: string) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ query }));
  }
};

export const closeWebSocket = () => {
  if (socket) {
    socket.close();
  }
};

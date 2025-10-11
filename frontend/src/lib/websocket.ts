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
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Close existing connection if any
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log('Closing existing WebSocket connection');
      socket.close();
      socket = null;
    }

    console.log('Creating new WebSocket connection to:', WEBSOCKET_URL);
    socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => {
      console.log('WebSocket connection opened');
      onOpen();
      resolve();
    };

    socket.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError(error);
      reject(error);
    };

    socket.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      onClose();
    };

    // Add timeout for connection
    setTimeout(() => {
      if (socket && socket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket connection timeout');
        reject(new Error('WebSocket connection timeout'));
      }
    }, 5000);
  });
};

export const sendWebSocketMessage = (query: string): boolean => {
  console.log('Attempting to send WebSocket message:', query);
  
  if (!socket) {
    console.error('WebSocket is null');
    return false;
  }

  if (socket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket is not open. ReadyState:', socket.readyState);
    return false;
  }

  try {
    socket.send(JSON.stringify({ query }));
    console.log('WebSocket message sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending WebSocket message:', error);
    return false;
  }
};

export const closeWebSocket = () => {
  if (socket) {
    console.log('Closing WebSocket connection');
    socket.close();
    socket = null;
  }
};
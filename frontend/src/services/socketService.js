import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

class SocketService {
  socket = null;

  connect(token) {
    if (this.socket) {
      // If already connected with the same token, return it
      if (this.socket.auth?.token === token && this.socket.connected) {
        return this.socket;
      }
      // If token changed or socket disconnected, close old one first
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000
    });

    this.socket.connect();
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();

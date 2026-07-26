const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

let io = null;

const initSocket = (server) => {
io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = [
        "https://calculuscorner.com",
        "https://www.calculuscorner.com",
        "http://localhost:5173"
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});
  // JWT Authentication Connection Middleware
  io.use(async (socket, next) => {
    try {
      // Get token from auth object or query params
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token) {
        // Allow anonymous guest connections for public real-time features (e.g. Landing Page)
        socket.user = { id: 'guest', role: 'guest', email: 'guest' };
        return next();
      }

      // Verify token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET
      );

      // Enforce status check for database students
      if (decoded.role === 'student') {
        const dbUser = await UserModel.findById(decoded.id);
        if (!dbUser || dbUser.status === 'banned') {
          return next(new Error('Authentication error: Account is banned'));
        }
      }

      // Attach user details to socket
      socket.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        username: decoded.email ? decoded.email.split('@')[0] : 'user'
      };

      next();
    } catch (err) {
      console.error('Socket JWT Auth Error:', err.message);
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  // Connection Handler
  io.on('connection', (socket) => {

    // Join rooms based on role
    if (socket.user.role === 'admin') {
      socket.join('admins');
    } else if (socket.user.role === 'student') {
      socket.join('students');
      socket.join(`student-${socket.user.id}`);
    }

    // Register event listeners
    const { registerSocketEvents } = require('./events');
    registerSocketEvents(io, socket);

    // Track online user
    const { handleUserConnect, handleUserDisconnect } = require('./handlers/users');
    handleUserConnect(io, socket);

    socket.on('disconnect', () => {
      handleUserDisconnect(io, socket);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};

// Broadcasters for REST controllers
const broadcastToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

const broadcastToAdmins = (event, data) => {
  if (io) {
    io.to('admins').emit(event, data);
  }
};

const broadcastToStudents = (event, data) => {
  if (io) {
    io.to('students').emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  broadcastToAll,
  broadcastToAdmins,
  broadcastToStudents
};

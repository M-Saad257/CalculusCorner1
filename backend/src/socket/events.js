const usersHandler = require('./handlers/users');

const registerSocketEvents = (io, socket) => {
  // Page/Tab activity tracking
  socket.on('user:activity', (data) => {
    usersHandler.handleUserActivity(io, socket, data);
  });

  // AI Tutor interactions
  socket.on('ai:new-session', (data, callback) => {
    usersHandler.handleNewAiSession(io, socket, data, callback);
  });

  socket.on('ai:new-message', (data, callback) => {
    usersHandler.handleNewAiMessage(io, socket, data, callback);
  });

  // Notifications
  socket.on('notification:read', (data, callback) => {
    usersHandler.handleNotificationRead(io, socket, data, callback);
  });
};

module.exports = {
  registerSocketEvents
};

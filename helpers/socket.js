let io;
const { getSessionsFile, createSession } = require('../models/WaSessionsModel');

const init = function (socket) {
  const savedSessions = getSessionsFile();
  if (savedSessions.length > 0) {
    if (socket) {
      socket.emit('init', savedSessions);
    } else {
      savedSessions.forEach(sess => {
        createSession(sess.id, sess.description, io);
      });
    }
  }
}

module.exports = {
  init: (server) => {
    io = require('socket.io')(server, {
      cors: {
        origin: '*:*',
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
      },
      allowEIO3: true
    });
    init();
    // Socket IO
    io.on('connection', function (socket) {
      init(socket);
      socket.on('create-session', function (data) {
        console.log('Create session: ' + data.id);
        createSession(data.id, data.description, io);
      });
      socket.on('get-data-api-key', function () {
        io.emit('data-api-key', getSessionsFile());
      });
    });
    return io;
  },
  get: () => {
    if (!io) throw new Error("socket is not initialized");
    return io;
  }
};
const express = require('express');
var expressLayouts = require('express-ejs-layouts');
const socketIO = require('socket.io');
const http = require('http');
const path = require("path");
const routes = require('./routes/routes');
// Load Models
const { createSessionsFileIfNotExists, getSessionsFile, createSession, initialize } = require('./models/WaSessionsModel');
// setup app
const port = process.env.PORT || 8000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
// view engine setup 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout extractScripts', true)
app.set('layout extractStyles', true)
app.use(expressLayouts);
// setup public folder
app.use(express.static(path.join(__dirname, "public")));
const server = http.createServer(app);
const io = socketIO(server,
  {
    cors: {
      origin: "http://localhost:" + port,
      methods: ["GET", "POST"],
      transports: ['websocket', 'polling'],
      credentials: true
    },
    allowEIO3: true
  }
);
createSessionsFileIfNotExists();

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

init();
// Socket IO
io.on('connection', function (socket) {
  init(socket);
  socket.on('create-session', function (data) {
    console.log('Create session: ' + data.id);
    createSession(data.id, data.description, io);
  });
});


// Use Router
app.use(routes);
server.listen(port, function () {
  console.log('App running on http://localhost:' + port);
});
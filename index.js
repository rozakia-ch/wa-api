const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const socketIO = require('socket.io');
const http = require('http');
const path = require("path");
const routes = require('./routes/routes');
// Load Models
const { createSessionsFileIfNotExists, getSessionsFile, createSession } = require('./models/WaSessionsModel');
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

createSessionsFileIfNotExists();
const io = require('./helpers/socket').init(server);

// Use Router
app.use(routes);
server.listen(port, function () {
  console.log('App running on http://localhost:' + port);
});
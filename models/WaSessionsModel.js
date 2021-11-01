const { Client, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const qrcode = require('qrcode');
const path = require("path");
const SESSIONS_FILE = './whatsapp-sessions.json';
const sessions = [];
const initialize = function (socket, io) {
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
const createSessionsFileIfNotExists = function () {
  if (!fs.existsSync(SESSIONS_FILE)) {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
      console.log('Sessions file created successfully.');
    } catch (err) {
      console.log('Failed to create sessions file: ', err);
    }
  }
}
const setSessionsFile = function (sessions) {
  fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions), function (err) {
    if (err) {
      console.log(err);
    }
  });
}

const getSessionsFile = function () {
  return JSON.parse(fs.readFileSync(SESSIONS_FILE));
}

const createSession = function (id, description, io) {
  console.log('Creating session: ' + id);
  // const SESSION_FILE_PATH = path.join(__dirname, `../whatsapp-session-${id}.json`);
  // let sessionCfg;
  // if (fs.existsSync(SESSION_FILE_PATH)) {
  //   sessionCfg = require(SESSION_FILE_PATH);
  // }
  let sessionCfg;
  const savedSessions = getSessionsFile();
  const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
  if (savedSessions[sessionIndex]) {
    sessionCfg = savedSessions[sessionIndex].session;
  }
  const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- this one doesn't works in Windows
        '--disable-gpu'
      ],
    },
    session: sessionCfg
  });

  client.initialize();
  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      io.emit('qr', { id: id, src: url });
      io.emit('message', { id: id, text: 'QR Code received, scan please!' });
    });
  });

  client.on('ready', () => {
    io.emit('ready', { id: id });
    io.emit('message', { id: id, text: 'Whatsapp is ready!' });
    savedSessions[sessionIndex].ready = true;
    setSessionsFile(savedSessions);
  });

  client.on('authenticated', (session) => {
    io.emit('authenticated', { id: id });
    io.emit('message', { id: id, text: 'Whatsapp is authenticated!' });
    sessionCfg = session;
    savedSessions[sessionIndex].session = session;
    setSessionsFile(savedSessions);
  });

  client.on('auth_failure', function (session) {
    io.emit('message', { id: id, text: 'Auth failure, restarting...' });
  });

  client.on('disconnected', (reason) => {
    io.emit('message', { id: id, text: 'Whatsapp is disconnected!' });
    // Menghapus pada file sessions
    savedSessions[sessionIndex].ready = false;
    savedSessions[sessionIndex].session = null;
    setSessionsFile(savedSessions);
    client.destroy();
    client.initialize();
    io.emit('remove-session', id);
  });

  // Tambahkan client ke sessions
  sessions.push({
    id: id,
    description: description,
    client: client
  });

  // Menambahkan session ke file
  if (sessionIndex == -1) {
    savedSessions.push({
      id: id,
      description: description,
      ready: false,
      session: null
    });
    setSessionsFile(savedSessions);
  }
}


module.exports = {
  sessions,
  initialize,
  createSessionsFileIfNotExists,
  setSessionsFile,
  getSessionsFile,
  createSession
}
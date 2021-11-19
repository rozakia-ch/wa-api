const { Client, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const SESSIONS_FILE = path.resolve(__dirname, '../whatsapp-sessions.json');
const sessions = [];

const createSessionsFileIfNotExists = function () {
  if (!fs.existsSync(SESSIONS_FILE)) {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
      console.log('Sessions file created successfully.');
    } catch (err) {
      console.error('Failed to create sessions file: ', err);
    }
  }
}
const setSessionsFile = function (sessions) {
  fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions), function (err) {
    if (err) {
      console.log(err);
    }
    const io = require('../helpers/socket').get();
    io.emit("data-api-key", getSessionsFile());
    return true;
  });

}

const getSessionsFile = function () {
  return JSON.parse(fs.readFileSync(SESSIONS_FILE));
}

const removeSession = function (id) {
  // Menghapus pada file sessions
  const savedSessions = getSessionsFile();
  const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
  savedSessions.splice(sessionIndex, 1);
  setSessionsFile(savedSessions);
}
const createSession = function (id, description, io) {
  console.log('Creating session: ' + id);
  const SESSION_FILE_PATH = path.resolve(__dirname, `../whatsapp-session-${id}.json`);
  let sessionCfg;
  if (fs.existsSync(SESSION_FILE_PATH)) {
    try {
      sessionCfg = require(SESSION_FILE_PATH);
    } catch (error) {
      console.error("file not found");
    }

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
    // console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      io.emit('qr', { id: id, src: url });
      io.emit('message', { id: id, text: 'QR Code received, scan please!' });
    });
  });

  client.on('ready', () => {
    io.emit('ready', { id: id });
    io.emit('message', { id: id, text: 'Whatsapp is ready!' });
    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
    savedSessions[sessionIndex].ready = true;
    setSessionsFile(savedSessions);
  });

  client.on('authenticated', (session) => {
    io.emit('authenticated', { id: id });
    io.emit('message', { id: id, text: 'Whatsapp is authenticated!' });
    sessionCfg = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
      if (err) {
        console.error(err);
      }
    });
  });

  client.on('auth_failure', function (session) {
    io.emit('message', { id: id, text: 'Auth failure, restarting...' });
  });

  client.on('disconnected', (reason) => {
    io.emit('message', { id: id, text: 'Whatsapp is disconnected!' });
    fs.unlinkSync(SESSION_FILE_PATH, function (err) {
      if (err) return console.log(err);
      console.log('Session file deleted!');
    });

    client.destroy();
    client.initialize();
    // Menghapus pada file sessions
    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
    savedSessions[sessionIndex].ready = false;
    // savedSessions.splice(sessionIndex, 1);
    setSessionsFile(savedSessions);
    io.emit('remove-session', id);
  });

  // Tambahkan client ke sessions
  sessions.push({
    id: id,
    description: description,
    client: client
  });

  // Menambahkan session ke file
  const savedSessions = getSessionsFile();
  const sessionIndex = savedSessions.findIndex(sess => sess.id == id);

  if (sessionIndex == -1) {
    savedSessions.push({
      id: id,
      description: description,
      ready: false,
    });
    setSessionsFile(savedSessions);
  }
}

module.exports = {
  sessions,
  createSessionsFileIfNotExists,
  setSessionsFile,
  getSessionsFile,
  removeSession,
  createSession
}
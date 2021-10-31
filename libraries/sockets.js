const fs = require('fs');

module.exports = {
  wa: function (data) {
    const id = data.id;
    const io = data.io;
    const client = data.client;
    const SESSION_FILE_PATH = data.sessionFile;
    const getSessionsFile = data.getSessionsFile;

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

      const savedSessions = getSessionsFile;
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
      savedSessions.splice(sessionIndex, 1);
      setSessionsFile(savedSessions);

      io.emit('remove-session', id);
    });

  }
}
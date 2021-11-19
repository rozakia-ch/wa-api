const { getSessionsFile, setSessionsFile } = require("../models/WaSessionsModel");
const randomstring = require('randomstring');
module.exports = {
  index: (req, res) => {
    var locals = {
      title: 'Page Title',
      description: 'Page Description',
      header: 'Page Header',
      layout: false
    };
    res.render('index', locals);
  },
  list: (req, res) => {
    var locals = {
      title: 'Page Title',
      description: 'Page Description',
      header: 'Page Header',
      layout: false,
    };
    res.render('list', locals);
  },
  create: (req, res) => {
    const locals = {
      title: 'Create Session',
      description: 'Page Description',
      header: 'Page Header',
      layout: false,
      session: {
        apiKey: randomstring.generate({ length: 4, charset: 'alphabetic' })
          + randomstring.generate({ length: 28, charset: 'alphanumeric' }),
        name: "api_key",
      }
    };
    res.render('create-session', locals);
  },
  update: (req, res) => {
    const id = req.query.id;
    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
    var locals = {
      title: 'Update Session',
      description: 'Page Description',
      header: 'Page Header',
      layout: false,
      session: savedSessions[sessionIndex],
    };
    res.render('update-session', locals);
  },
  updateData: (req, res) => {
    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex(sess => sess.id == req.body.apiKey);
    savedSessions[sessionIndex].description = req.body.name;
    setSessionsFile(savedSessions);
    res.send(true);
  },
  delete: (req, res) => {
    
  }
}
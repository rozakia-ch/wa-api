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
  sendMessage: (req, res) => {
    const sender = req.body.sender;
    const number = phoneNumberFormatter(req.body.number);
    const message = req.body.message;

    const client = sessions.find(sess => sess.id == sender).client;

    client.sendMessage(number, message).then(response => {
      res.status(200).json({
        status: true,
        response: response
      });
    }).catch(err => {
      res.status(500).json({
        status: false,
        response: err
      });
    });
  }
}
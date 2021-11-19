const { sessions } = require("../models/WaSessionsModel");
const { phoneNumberFormatter } = require('../helpers/formatter');

module.exports = {
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
// import express
const express = require("express");
const controller = require("../controllers/WaController");
const { phoneNumberFormatter } = require("../helpers/formatter");
// init express router
const router = express.Router();
router.get('/', controller.index);
// Send message
router.post('/send-message-route', controller.sendMessage);
// export default router
module.exports = router;
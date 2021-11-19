// import express
const express = require("express");
const homeController = require("../controllers/HomeController");
const waApiController = require("../controllers/WaApiController");
// init express router
const router = express.Router();
router.get('/', homeController.index);
router.get('/list', homeController.list);
router.get('/create', homeController.create);
router.get('/update', homeController.update);
router.post('/update', homeController.updateData);
router.post('/send-message', waApiController.sendMessage);
// export default router
module.exports = router;
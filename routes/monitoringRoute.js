const express = require("express");


const isAuth = require("../middleware/isAuth");
const monitoringController = require('../controllers/monitoringController')


const router = express.Router();


router.get("/start/:checkId", isAuth, monitoringController.startMonitor);

router.get("/stop/:checkId", isAuth, monitoringController.stopMonitor);


module.exports = router;
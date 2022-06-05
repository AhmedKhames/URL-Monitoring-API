const express = require("express");


const isAuth = require("../middleware/isAuth");
const monitoringController = require('../controllers/monitoringController')


const router = express.Router();


router.get("/start/:checkId", isAuth, monitoringController.startMonitor);

router.post("/stop", isAuth, monitoringController.stopMonitor);

router.get('/report',isAuth,monitoringController.getAllReports)


module.exports = router;
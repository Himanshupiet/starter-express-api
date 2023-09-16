const express = require("express");
const router = express.Router();
const cronjobs = require("../api/controller/cronJobs");



router.get("/sendDailyBackupEmail", cronjobs.sendDailyBackupEmail);

module.exports = router;

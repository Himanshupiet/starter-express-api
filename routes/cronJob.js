const express = require("express");
const router = express.Router();
const cronjobs = require("../api/controller/cronJobs");



router.get("/sendDailyBackupEmail", cronjobs.sendDailyBackupEmail);
router.get("/todayBirthdayWish", cronjobs.fetchBirthdays);

module.exports = router;

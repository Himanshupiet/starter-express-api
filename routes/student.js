const express = require("express");
const { isAunthaticatedStudent } = require("../middleware/auth");
const student = require('../api/controller/student')

const router = express.Router()

router.use(isAunthaticatedStudent)

router.get("/studentDashboardData", student.getStudentDashboard);
router.get("/feeReport", student.getFeeReport);

module.exports = router
const express = require("express");
const router = express.Router();
const securitylog = require("../api/controller/securitylog");
const { isAunthaticatedAdmin } = require("../middleware/auth");

router.post("/sendsecuritylogs", securitylog.securitylog);
router.get("/getAllSecuritylogs", securitylog.getAllSecuritylogs);

module.exports = router;

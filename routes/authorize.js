const express = require("express");
const router = express.Router();
const authorize = require("../api/controller/authorize");

router.post("/logout", authorize.logout);

module.exports = router;

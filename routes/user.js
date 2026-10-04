const express = require("express");
const router = express.Router();
const user = require("../api/controller/user");
const { isAunthaticatedAdmin } = require("../middleware/auth");
module.exports = router;

const express = require("express");
const router = express.Router();
const user = require("../api/controller/user");
const { isAunthaticatedAdmin } = require("../middleware/auth");

router.get("/getRoilLevelUsers/:userId/:level", user.getRoilLevelUsers);
router.get("/getDashBoardData/:userId", user.getDashBoardData);
router.post("/updateBankInfoByUserId/:id", user.updateBankInfoByUserId);
router.get("/roiIncomeReport/:id", user.roiIncomeReport);
router.get("/roilevel1IncomeReport/:id", user.roilevel1IncomeReport);
router.get("/roilevel2IncomeReport/:id", user.roilevel2IncomeReport);
router.get("/roiLevelsIncomeReport/:id", user.roiLevelsIncomeReport);
router.get("/withdrawalHistory/:id", user.withdrawalHistory);
module.exports = router;

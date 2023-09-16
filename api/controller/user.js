const { userModel } = require("../../models/user");
const { Role } = require("../../models/role");
const { FundingSource } = require("../../models/fundingSource");
const { AuthToken } = require("../../models/authtoken");

module.exports = {
  getRoilLevelUsers: async (req, res) => {
    try {
      const userData = await userModel.findOne({
        $and: [{ _id: req.params.userId }, { deleted: false }],
      });
      if (userData) {
        let roids;
        let level;
        for (let i = 1; i < 11; i++) {
          if (req.params.level == i) {
            level = `level${i}`;
            roids = userData.roiLevel[level];
          }
        }
        const roilLevelData = await userModel.find({
          $and: [{ "userInfo.roiId": { $in: roids } }, { deleted: false }],
        });

        let roilLevelUsers = [];
        if (roilLevelData.length) {
          roilLevelData.forEach((it) => {
            const data = {
              id: it._id,
              isActive: it.isActive,
              userInfo: {
                roiId: it.userInfo.roiId,
                email: it.userInfo.email,
                name: it.userInfo.name,
                roleName: it.userInfo.roleName,
                roleId: it.userInfo.roleId,
                parentRoiId: it.userInfo.parentRoiId,
              },
              activationDate: it.activationDate,
              roiLevel: it.roiLevel,
              created: it.created,
              modified: it.modified,
              deleted: it.deleted,
            };
            roilLevelUsers.push(data);
          });
        }
        return res.status(200).json({
          success: true,
          message: "Level Team get Successfully.",
          roilLevelUsers,
        });
      } else {
        return res
          .status(200)
          .json({ success: false, message: "User not found." });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },
  getDashBoardData: async (req, res) => {
    let wallet = 0;
    let levelIncome = 0;
    let directRoi = 0;
    let toatlLevelRoi = 0;
    let reffaralRoi = 0;
    let paidAmount = 0;
    try {
      const userData = await userModel.findOne({
        $and: [{ _id: req.params.userId }, { deleted: false }],
      });
      if (userData) {
        if (
          userData.roiLevel &&
          userData.roiLevel.level1 &&
          userData.roiLevel.level1.length
        ) {
          directRoi = userData.roiLevel.level1.length;
        }
        let level;
        for (let i = 1; i < 11; i++) {
          level = `level${i}`;
          if (
            userData.roiLevel &&
            userData.roiLevel[level] &&
            userData.roiLevel[level].length
          ) {
            toatlLevelRoi += userData.roiLevel[level].length;
          }
        }
        let incomeData = await FundingSource.findOne(
          {
            userId: userData._id.toString(),
          },
          { balance: 1, withDrawalHistory: 1 }
        );
        if (
          incomeData &&
          incomeData.withDrawalHistory &&
          incomeData.withDrawalHistory.length
        ) {
          let paidData = incomeData.withDrawalHistory.filter(
            (data) => data.status === true
          );
          paidAmount = paidData
            .map((d) => d.actualAmount)
            .reduce((prev, curr) => prev + curr, 0);
        }
        const dashBoardData = {
          wallet: incomeData ? incomeData.balance.wallet : 0,
          investPlan: userData.activePlan,
          levelIncome: levelIncome,
          directRoi: directRoi,
          toatlLevelRoi: toatlLevelRoi,
          reffaralRoi: reffaralRoi,
          paidAmount: paidAmount,
        };
        return res.status(200).json({
          success: true,
          message: "Dashboard data get Successfully.",
          dashBoardData,
        });
      } else {
        return res
          .status(200)
          .json({ success: false, message: "User not found." });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },
  updateBankInfoByUserId: async (req, res) => {
    try {
      const bankData = {
        accountHolderName: req.body.accountHolderName,
        bankName: req.body.bankName,
        ifscCode: req.body.ifscCode,
        accountNumber: req.body.accountNumber,
      };
      let bankInfo = await FundingSource.findOneAndUpdate(
        { userId: req.params.id },
        {
          bankingInformation: bankData,
        },
        (err, data) => {
          if (err) {
            next(err);
          } else {
            return res.status(200).json({
              success: true,
              message: "Bank info successfully update.",
            });
          }
        }
      );
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },
  roiIncomeReport: async (req, res) => {
    try {
      let incomeData = await FundingSource.findOne(
        {
          userId: req.params.id.toString(),
        },
        { roiIncome: 1 }
      );
      // FundingSource.findOne(
      //   { userId: req.params.id.toString() },
      //   function (err, data) {
      //     if (err) {
      //       next(err);
      //     } else {
      //       console.log(data);
      //     }
      //   }
      // );
      if (incomeData) {
        return res.status(200).json({
          success: true,
          message: "Income report get successfully",
          data: incomeData,
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Income report not found.",
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },
  roilevel1IncomeReport: async (req, res) => {
    try {
      let incomeData = await FundingSource.findOne(
        {
          userId: req.params.id.toString(),
        },
        { roilevel1Income: 1 }
      );
      if (incomeData) {
        return res.status(200).json({
          success: true,
          message: "Income report get successfully",
          data: incomeData,
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Income report not found.",
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },
  roilevel2IncomeReport: async (req, res) => {
    try {
      let incomeData = await FundingSource.findOne(
        {
          userId: req.params.id.toString(),
        },
        { roilevel2Income: 1 }
      );
      if (incomeData) {
        return res.status(200).json({
          success: true,
          message: "Income report get successfully",
          data: incomeData,
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Income report not found.",
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },
  roiLevelsIncomeReport: async (req, res) => {
    try {
      let incomeData = await FundingSource.findOne(
        {
          userId: req.params.id.toString(),
        },
        { roilevel3to10Income: 1 }
      );
      if (incomeData) {
        return res.status(200).json({
          success: true,
          message: "Income report get successfully",
          data: incomeData,
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Income report not found.",
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },
  withdrawalHistory: async (req, res) => {
    try {
      let withdrawalHistoryData = await FundingSource.findOne(
        {
          userId: req.params.id.toString(),
        },
        { withDrawalHistory: 1 }
      );
      if (withdrawalHistoryData) {
        return res.status(200).json({
          success: true,
          message: "Withdrawal History get successfully",
          data: withdrawalHistoryData,
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Withdrawal History not found.",
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },
};

const moment = require("moment-timezone");
const todayIndiaDate = moment.tz(Date.now(), "Asia/Kolkata");
const { User } = require("../models/user");
const { FundingSource } = require("../models/fundingSource");
const { cronjobModel } = require("../models/cronjob");
todayIndiaDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
// console.log("Today India date", todayIndiaDate);

module.exports = {
  investIncome: async (roiId) => {
    try {
      const cronjobsave = new cronjobModel({
        jobPerform: "roi invest Income generate",
        cronJobTime: "roi invest ",
        indiaCronjontime: todayIndiaDate,
      });
      await cronjobsave.save();
      const user = await User.findOne({
        $and: [
          { "userInfo.roiId": roiId },
          { isActive: true },
          { deleted: false },
        ],
      });
      // console.log("user id", user._id);

      let activationDate = new Date(user.activationDate.valueOf());
      let activationDate1 = moment.tz(activationDate, "Asia/Kolkata");
      activationDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

      // activationDate.setHours(0);
      // activationDate.setMinutes(0);
      // activationDate.setMilliseconds(0);
      // console.log("activationDate", activationDate1);

      let minDate = new Date(user.activationDate.valueOf());
      // minDate = new Date(minDate.setDate(minDate.getDate()));
      let minDate1 = moment.tz(minDate, "Asia/Kolkata");
      minDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      minDate1.date() + 1;

      let maxDate = new Date(user.activationDate.valueOf());
      // maxDate = new Date(maxDate.setDate(maxDate.getDate() + -111));
      // console.log("acc", maxDate);
      let maxDate1 = moment.tz(maxDate, "Asia/Kolkata");
      maxDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      maxDate1.add(112, "days");
      // maxDate.setHours(0);
      // maxDate.setMinutes(0);
      // maxDate.setMilliseconds(0);

      // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));

      // minDate = new Date(minDate.setDate(minDate.getDate()));

      // console.log("maxTime", maxDate1);
      // console.log("minTime", minDate1);

      // if (todayIndiaDate > minDate1) {
      //   console.log("true");
      // } else {
      //   console.log("false");
      // }
      if (todayIndiaDate > minDate1 && todayIndiaDate < maxDate1) {
        // console.log("ok");
        let amount = (Number(user.activePlan) * 1) / 100;
        console.log("amount", amount);
        let income = { date: Date.now(), amount: amount };
        const fundingSourceData = await FundingSource.findOne({
          userId: user._id.toString(),
        });
        if (fundingSourceData) {
          let walletBalance = Number(fundingSourceData.balance.wallet);
          // console.log("before after", walletBalance);

          walletBalance += amount;

          // console.log("after after", walletBalance);
          const fsourceUpdate = await FundingSource.findOneAndUpdate(
            {
              userId: user._id.toString(),
            },
            {
              $push: {
                roiIncome: income,
              },
              "balance.wallet": walletBalance,
            },
            {
              new: true,
            }
          );
        }

        // console.log("fundingSourceData", fundingSourceData);
      } else {
        // console.log("not ok");
      }
    } catch (err) {
      console.log(err);
    }
  },
  level1Income: async (roiId) => {
    try {
      const cronjobsave = new cronjobModel({
        jobPerform: "Level 1 Income generate",
        cronJobTime: "level 1",
        indiaCronjontime: todayIndiaDate,
      });
      await cronjobsave.save();
      const user = await User.findOne({
        $and: [
          { "userInfo.roiId": roiId },
          { isActive: true },
          { deleted: false },
        ],
      });
      if (user.roiLevel.level1 && user.roiLevel.level1.length > 0) {
        const level1users = await User.find({
          "userInfo.roiId": { $in: user.roiLevel.level1 },
        });
        let amount = 0;
        level1users.forEach((it) => {
          if (it.isActive) {
            let activationDate = new Date(it.activationDate.valueOf());
            let activationDate1 = moment.tz(activationDate, "Asia/Kolkata");
            activationDate1.set({
              hour: 0,
              minute: 0,
              second: 0,
              millisecond: 0,
            });
            // activationDate.setHours(0);
            // activationDate.setMinutes(0);
            // activationDate.setMilliseconds(0);

            // console.log("activationDate", activationDate1);

            let minDate = new Date(it.activationDate.valueOf());
            // minDate = new Date(minDate.setDate(minDate.getDate()));
            let minDate1 = moment.tz(minDate, "Asia/Kolkata");
            minDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

            // minDate.setHours(0);
            // minDate.setMinutes(0);
            // minDate.setMilliseconds(0);

            let maxDate = new Date(it.activationDate.valueOf());
            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));
            let maxDate1 = moment.tz(maxDate, "Asia/Kolkata");
            maxDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            maxDate1.add(112, "days");
            // maxDate.setHours(0);
            // maxDate.setMinutes(0);
            // maxDate.setMilliseconds(0);

            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));

            // minDate = new Date(minDate.setDate(minDate.getDate()));
            if (todayIndiaDate > minDate1 && todayIndiaDate < maxDate1) {
              console.log("ok");
              amount += (Number(it.activePlan) * 1) / 100;
              console.log("amount", amount);
            }
          }
        });
        if (amount > 0) {
          let level1Income = { date: Date.now(), amount: amount };
          const fundingSourceData = await FundingSource.findOne({
            userId: user._id.toString(),
          });
          if (fundingSourceData) {
            let walletBalance = Number(fundingSourceData.balance.wallet);
            walletBalance += amount;
            // walletBalance = Number(walletBalance);
            const fsourceUpdate = await FundingSource.findOneAndUpdate(
              {
                userId: user._id.toString(),
              },
              {
                $push: {
                  roilevel1Income: level1Income,
                },
                "balance.wallet": walletBalance,
              }
              // {
              //   new: true,
              // }
            );
          }
        }
        // console.log("fundingSourceData", fsourceUpdate);
      } else {
        // console.log("No levels");
      }
    } catch (err) {
      console.log(err);
    }
  },
  level2Income: async (roiId) => {
    try {
      const cronjobsave = new cronjobModel({
        jobPerform: "Level 2 Income generate",
        cronJobTime: "level 2",
        indiaCronjontime: todayIndiaDate,
      });
      await cronjobsave.save();
      const user = await User.findOne({
        $and: [
          { "userInfo.roiId": roiId },
          { isActive: true },
          { deleted: false },
        ],
      });
      if (user.roiLevel.level2 && user.roiLevel.level2.length > 0) {
        const level2users = await User.find({
          "userInfo.roiId": { $in: user.roiLevel.level2 },
        });
        let amount = 0;
        level2users.forEach((it) => {
          if (it.isActive) {
            let activationDate = new Date(it.activationDate.valueOf());
            let activationDate1 = moment.tz(activationDate, "Asia/Kolkata");
            activationDate1.set({
              hour: 0,
              minute: 0,
              second: 0,
              millisecond: 0,
            });
            // activationDate.setHours(0);
            // activationDate.setMinutes(0);
            // activationDate.setMilliseconds(0);

            // console.log("activationDate", activationDate1);

            let minDate = new Date(it.activationDate.valueOf());
            // minDate = new Date(minDate.setDate(minDate.getDate()));
            let minDate1 = moment.tz(minDate, "Asia/Kolkata");
            minDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            // minDate.setHours(0);
            // minDate.setMinutes(0);
            // minDate.setMilliseconds(0);

            let maxDate = new Date(it.activationDate.valueOf());
            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));
            let maxDate1 = moment.tz(maxDate, "Asia/Kolkata");
            maxDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            maxDate1.add(112, "days");
            // maxDate.setHours(0);
            // maxDate.setMinutes(0);
            // maxDate.setMilliseconds(0);

            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));

            // minDate = new Date(minDate.setDate(minDate.getDate()));
            if (todayIndiaDate > minDate1 && todayIndiaDate < maxDate1) {
              console.log("ok");
              amount += (Number(it.activePlan) * 0.5) / 100;
              console.log("amount", amount);
            }
          }
        });
        if (amount > 0) {
          let level2Income = { date: Date.now(), amount: amount };
          const fundingSourceData = await FundingSource.findOne({
            userId: user._id.toString(),
          });
          if (fundingSourceData) {
            let walletBalance = Number(fundingSourceData.balance.wallet);
            walletBalance += amount;
            const fsourceUpdate = await FundingSource.findOneAndUpdate(
              {
                userId: user._id.toString(),
              },
              {
                $push: {
                  roilevel2Income: level2Income,
                },
                "balance.wallet": walletBalance,
              }
              // {
              //   new: true,
              // }
            );
          }
        }
        // console.log("fundingSourceData", fundingSourceData);
      } else {
        // console.log("No levels");
      }
    } catch (err) {
      console.log(err);
    }
  },

  level3Income: async (roiId) => {
    try {
      const cronjobsave = new cronjobModel({
        jobPerform: "Level 3 Income generate",
        cronJobTime: "level 3",
        indiaCronjontime: todayIndiaDate,
      });
      await cronjobsave.save();
      const user = await User.findOne({
        $and: [
          { "userInfo.roiId": roiId },
          { isActive: true },
          { deleted: false },
        ],
      });
      if (user.roiLevel.level3 && user.roiLevel.level3.length > 0) {
        const level3users = await User.find({
          "userInfo.roiId": { $in: user.roiLevel.level3 },
        });
        // level3users.forEach(async (it) => {
        for (it of level3users) {
          if (it.isActive) {
            let activationDate = new Date(it.activationDate.valueOf());
            let activationDate1 = moment.tz(activationDate, "Asia/Kolkata");
            activationDate1.set({
              hour: 0,
              minute: 0,
              second: 0,
              millisecond: 0,
            });
            // activationDate.setHours(0);
            // activationDate.setMinutes(0);
            // activationDate.setMilliseconds(0);

            // console.log("activationDate", activationDate1);

            let minDate = new Date(it.activationDate.valueOf());
            // minDate = new Date(minDate.setDate(minDate.getDate()));
            let minDate1 = moment.tz(minDate, "Asia/Kolkata");
            minDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            // minDate.setHours(0);
            // minDate.setMinutes(0);
            // minDate.setMilliseconds(0);

            let maxDate = new Date(it.activationDate.valueOf());
            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));
            let maxDate1 = moment.tz(maxDate, "Asia/Kolkata");
            maxDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            maxDate1.add(2, "days");
            // maxDate.setHours(0);
            // maxDate.setMinutes(0);
            // maxDate.setMilliseconds(0);

            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));

            // minDate = new Date(minDate.setDate(minDate.getDate()));
            if (todayIndiaDate > minDate1 && todayIndiaDate < maxDate1) {
              console.log("ok");
              let amount = (Number(it.activePlan) * 1) / 100;
              console.log("amount", amount);
              // let level2Income = { date: Date.now(), amount: amount };
              let level3Income = {
                date: Date.now(),
                amount: amount,
                level: "level3",
                roiId: it.userInfo.roiId,
              };
              const fundingSourceData = await FundingSource.findOne({
                userId: user._id.toString(),
              });
              if (fundingSourceData) {
                // console.log(" before wallet", fundingSourceData.balance.wallet);
                // const walletBalance =
                //   Number(fundingSourceData.balance.wallet) + amount;
                // walletBalance += amount;
                // console.log(" after wallet", walletBalance);
                const fsourceUpdate = await FundingSource.findOneAndUpdate(
                  {
                    userId: user._id.toString(),
                  },
                  {
                    $push: {
                      roilevel3to10Income: level3Income,
                    },
                    "balance.wallet":
                      Number(fundingSourceData.balance.wallet) + amount,
                  }
                );
              }
            }
          }
        }

        // console.log("fundingSourceData", fundingSourceData);
      } else {
        // console.log("No levels");
      }
    } catch (err) {
      console.log(err);
    }
  },
  level4Income: async (roiId) => {
    try {
      const cronjobsave = new cronjobModel({
        jobPerform: "Level 4 Income generate",
        cronJobTime: "level 4",
        indiaCronjontime: todayIndiaDate,
      });
      await cronjobsave.save();
      const user = await User.findOne({
        $and: [
          { "userInfo.roiId": roiId },
          { isActive: true },
          { deleted: false },
        ],
      });
      if (user.roiLevel.level4 && user.roiLevel.level4.length > 0) {
        const level4users = await User.find({
          "userInfo.roiId": { $in: user.roiLevel.level4 },
        });

        for (it of level4users) {
          if (it.isActive) {
            let activationDate = new Date(it.activationDate.valueOf());
            let activationDate1 = moment.tz(activationDate, "Asia/Kolkata");
            activationDate1.set({
              hour: 0,
              minute: 0,
              second: 0,
              millisecond: 0,
            });
            // activationDate.setHours(0);
            // activationDate.setMinutes(0);
            // activationDate.setMilliseconds(0);

            // console.log("activationDate", activationDate1);

            let minDate = new Date(it.activationDate.valueOf());
            // minDate = new Date(minDate.setDate(minDate.getDate()));
            let minDate1 = moment.tz(minDate, "Asia/Kolkata");
            minDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            // minDate.setHours(0);
            // minDate.setMinutes(0);
            // minDate.setMilliseconds(0);

            let maxDate = new Date(it.activationDate.valueOf());
            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));
            let maxDate1 = moment.tz(maxDate, "Asia/Kolkata");
            maxDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            maxDate1.add(2, "days");
            // maxDate.setHours(0);
            // maxDate.setMinutes(0);
            // maxDate.setMilliseconds(0);

            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));

            // minDate = new Date(minDate.setDate(minDate.getDate()));
            if (todayIndiaDate > minDate1 && todayIndiaDate < maxDate1) {
              console.log("ok");
              let amount = (Number(it.activePlan) * 1) / 100;
              console.log("amount", amount);
              // let level2Income = { date: Date.now(), amount: amount };
              let level4Income = {
                date: Date.now(),
                amount: amount,
                level: "level4",
                roiId: it.userInfo.roiId,
              };
              const fundingSourceData = await FundingSource.findOne({
                userId: user._id.toString(),
              });
              if (fundingSourceData) {
                // let walletBalance = Number(fundingSourceData.balance.wallet);
                // walletBalance += amount;
                const fsourceUpdate = await FundingSource.findOneAndUpdate(
                  {
                    userId: user._id.toString(),
                  },
                  {
                    $push: {
                      roilevel3to10Income: level4Income,
                    },
                    "balance.wallet":
                      Number(fundingSourceData.balance.wallet) + amount,
                  }
                  // {
                  //   new: true,
                  // }
                );
              }
            }
          }
        }

        // console.log("fundingSourceData", fundingSourceData);
      } else {
        // console.log("No levels");
      }
    } catch (err) {
      console.log(err);
    }
  },
  level5Income: async (roiId) => {
    try {
      const cronjobsave = new cronjobModel({
        jobPerform: "Level 5 Income generate",
        cronJobTime: "level 5",
        indiaCronjontime: todayIndiaDate,
      });
      await cronjobsave.save();
      const user = await User.findOne({
        $and: [
          { "userInfo.roiId": roiId },
          { isActive: true },
          { deleted: false },
        ],
      });
      if (user.roiLevel.level5 && user.roiLevel.level5.length > 0) {
        const level5users = await User.find({
          "userInfo.roiId": { $in: user.roiLevel.level5 },
        });
        for (it of level5users) {
          if (it.isActive) {
            let activationDate = new Date(it.activationDate.valueOf());
            let activationDate1 = moment.tz(activationDate, "Asia/Kolkata");
            activationDate1.set({
              hour: 0,
              minute: 0,
              second: 0,
              millisecond: 0,
            });
            // activationDate.setHours(0);
            // activationDate.setMinutes(0);
            // activationDate.setMilliseconds(0);

            // console.log("activationDate", activationDate1);

            let minDate = new Date(it.activationDate.valueOf());
            // minDate = new Date(minDate.setDate(minDate.getDate()));
            let minDate1 = moment.tz(minDate, "Asia/Kolkata");
            minDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            // minDate.setHours(0);
            // minDate.setMinutes(0);
            // minDate.setMilliseconds(0);

            let maxDate = new Date(it.activationDate.valueOf());
            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));
            let maxDate1 = moment.tz(maxDate, "Asia/Kolkata");
            maxDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            maxDate1.add(2, "days");
            // maxDate.setHours(0);
            // maxDate.setMinutes(0);
            // maxDate.setMilliseconds(0);

            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));

            // minDate = new Date(minDate.setDate(minDate.getDate()));
            if (todayIndiaDate > minDate1 && todayIndiaDate < maxDate1) {
              console.log("ok");
              let amount = (Number(it.activePlan) * 1) / 100;
              console.log("amount", amount);
              // let level2Income = { date: Date.now(), amount: amount };
              let level5Income = {
                date: Date.now(),
                amount: amount,
                level: "level5",
                roiId: it.userInfo.roiId,
              };
              const fundingSourceData = await FundingSource.findOne({
                userId: user._id.toString(),
              });
              if (fundingSourceData) {
                // let walletBalance = Number(fundingSourceData.balance.wallet);
                // walletBalance += amount;
                const fsourceUpdate = await FundingSource.findOneAndUpdate(
                  {
                    userId: user._id.toString(),
                  },
                  {
                    $push: {
                      roilevel3to10Income: level5Income,
                    },
                    "balance.wallet":
                      Number(fundingSourceData.balance.wallet) + amount,
                  }
                  // {
                  //   new: true,
                  // }
                );
              }
            }
          }
        }

        // console.log("fundingSourceData", fundingSourceData);
      } else {
        // console.log("No levels");
      }
    } catch (err) {
      console.log(err);
    }
  },
  level6Income: async (roiId) => {
    try {
      const cronjobsave = new cronjobModel({
        jobPerform: "Level 6 Income generate",
        cronJobTime: "level 6",
        indiaCronjontime: todayIndiaDate,
      });
      await cronjobsave.save();
      const user = await User.findOne({
        $and: [
          { "userInfo.roiId": roiId },
          { isActive: true },
          { deleted: false },
        ],
      });
      if (user.roiLevel.level6 && user.roiLevel.level6.length > 0) {
        const level6users = await User.find({
          "userInfo.roiId": { $in: user.roiLevel.level6 },
        });
        for (it of level6users) {
          if (it.isActive) {
            let activationDate = new Date(it.activationDate.valueOf());
            let activationDate1 = moment.tz(activationDate, "Asia/Kolkata");
            activationDate1.set({
              hour: 0,
              minute: 0,
              second: 0,
              millisecond: 0,
            });
            // activationDate.setHours(0);
            // activationDate.setMinutes(0);
            // activationDate.setMilliseconds(0);

            // console.log("activationDate", activationDate1);

            let minDate = new Date(it.activationDate.valueOf());
            // minDate = new Date(minDate.setDate(minDate.getDate()));
            let minDate1 = moment.tz(minDate, "Asia/Kolkata");
            minDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            // minDate.setHours(0);
            // minDate.setMinutes(0);
            // minDate.setMilliseconds(0);

            let maxDate = new Date(it.activationDate.valueOf());
            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));
            let maxDate1 = moment.tz(maxDate, "Asia/Kolkata");
            maxDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            maxDate1.add(2, "days");
            // maxDate.setHours(0);
            // maxDate.setMinutes(0);
            // maxDate.setMilliseconds(0);

            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));

            // minDate = new Date(minDate.setDate(minDate.getDate()));
            if (todayIndiaDate > minDate1 && todayIndiaDate < maxDate1) {
              console.log("ok");
              let amount = (Number(it.activePlan) * 1) / 100;
              console.log("amount", amount);
              // let level2Income = { date: Date.now(), amount: amount };
              let level6Income = {
                date: Date.now(),
                amount: amount,
                level: "level6",
                roiId: it.userInfo.roiId,
              };
              const fundingSourceData = await FundingSource.findOne({
                userId: user._id.toString(),
              });
              if (fundingSourceData) {
                // let walletBalance = Number(fundingSourceData.balance.wallet);
                // walletBalance += amount;
                const fsourceUpdate = await FundingSource.findOneAndUpdate(
                  {
                    userId: user._id.toString(),
                  },
                  {
                    $push: {
                      roilevel3to10Income: level6Income,
                    },
                    "balance.wallet":
                      Number(fundingSourceData.balance.wallet) + amount,
                  }
                  // {
                  //   new: true,
                  // }
                );
              }
            }
          }
        }

        // console.log("fundingSourceData", fundingSourceData);
      } else {
        // console.log("No levels");
      }
    } catch (err) {
      console.log(err);
    }
  },
  level7Income: async (roiId) => {
    try {
      const cronjobsave = new cronjobModel({
        jobPerform: "Level 7 Income generate",
        cronJobTime: "level 7",
        indiaCronjontime: todayIndiaDate,
      });
      await cronjobsave.save();
      const user = await User.findOne({
        $and: [
          { "userInfo.roiId": roiId },
          { isActive: true },
          { deleted: false },
        ],
      });
      if (user.roiLevel.level7 && user.roiLevel.level7.length > 0) {
        const level7users = await User.find({
          "userInfo.roiId": { $in: user.roiLevel.level7 },
        });

        for (it of level7users) {
          if (it.isActive) {
            let activationDate = new Date(it.activationDate.valueOf());
            let activationDate1 = moment.tz(activationDate, "Asia/Kolkata");
            activationDate1.set({
              hour: 0,
              minute: 0,
              second: 0,
              millisecond: 0,
            });
            // activationDate.setHours(0);
            // activationDate.setMinutes(0);
            // activationDate.setMilliseconds(0);

            // console.log("activationDate", activationDate1);

            let minDate = new Date(it.activationDate.valueOf());
            // minDate = new Date(minDate.setDate(minDate.getDate()));
            let minDate1 = moment.tz(minDate, "Asia/Kolkata");
            minDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            // minDate.setHours(0);
            // minDate.setMinutes(0);
            // minDate.setMilliseconds(0);

            let maxDate = new Date(it.activationDate.valueOf());
            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));
            let maxDate1 = moment.tz(maxDate, "Asia/Kolkata");
            maxDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            maxDate1.add(2, "days");
            // maxDate.setHours(0);
            // maxDate.setMinutes(0);
            // maxDate.setMilliseconds(0);

            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));

            // minDate = new Date(minDate.setDate(minDate.getDate()));
            if (todayIndiaDate > minDate1 && todayIndiaDate < maxDate1) {
              console.log("ok");
              let amount = (Number(it.activePlan) * 1) / 100;
              console.log("amount", amount);
              // let level2Income = { date: Date.now(), amount: amount };
              let level7Income = {
                date: Date.now(),
                amount: amount,
                level: "level7",
                roiId: it.userInfo.roiId,
              };
              const fundingSourceData = await FundingSource.findOne({
                userId: user._id.toString(),
              });
              if (fundingSourceData) {
                // let walletBalance = Number(fundingSourceData.balance.wallet);
                // walletBalance += amount;
                const fsourceUpdate = await FundingSource.findOneAndUpdate(
                  {
                    userId: user._id.toString(),
                  },
                  {
                    $push: {
                      roilevel3to10Income: level7Income,
                    },
                    "balance.wallet":
                      Number(fundingSourceData.balance.wallet) + amount,
                  }
                  // {
                  //   new: true,
                  // }
                );
              }
            }
          }
        }

        // console.log("fundingSourceData", fundingSourceData);
      } else {
        // console.log("No levels");
      }
    } catch (err) {
      console.log(err);
    }
  },
  level8Income: async (roiId) => {
    try {
      const cronjobsave = new cronjobModel({
        jobPerform: "Level 8 Income generate",
        cronJobTime: "level 8",
        indiaCronjontime: todayIndiaDate,
      });
      await cronjobsave.save();
      const user = await User.findOne({
        $and: [
          { "userInfo.roiId": roiId },
          { isActive: true },
          { deleted: false },
        ],
      });
      if (user.roiLevel.level8 && user.roiLevel.level8.length > 0) {
        const level8users = await User.find({
          "userInfo.roiId": { $in: user.roiLevel.level8 },
        });
        for (it of level8users) {
          if (it.isActive) {
            let activationDate = new Date(it.activationDate.valueOf());
            let activationDate1 = moment.tz(activationDate, "Asia/Kolkata");
            activationDate1.set({
              hour: 0,
              minute: 0,
              second: 0,
              millisecond: 0,
            });
            // activationDate.setHours(0);
            // activationDate.setMinutes(0);
            // activationDate.setMilliseconds(0);

            // console.log("activationDate", activationDate1);

            let minDate = new Date(it.activationDate.valueOf());
            // minDate = new Date(minDate.setDate(minDate.getDate()));
            let minDate1 = moment.tz(minDate, "Asia/Kolkata");
            minDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            // minDate.setHours(0);
            // minDate.setMinutes(0);
            // minDate.setMilliseconds(0);

            let maxDate = new Date(it.activationDate.valueOf());
            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));
            let maxDate1 = moment.tz(maxDate, "Asia/Kolkata");
            maxDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            maxDate1.add(2, "days");
            // maxDate.setHours(0);
            // maxDate.setMinutes(0);
            // maxDate.setMilliseconds(0);

            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));

            // minDate = new Date(minDate.setDate(minDate.getDate()));
            if (todayIndiaDate > minDate1 && todayIndiaDate < maxDate1) {
              console.log("ok");
              let amount = (Number(it.activePlan) * 1) / 100;
              console.log("amount", amount);
              // let level2Income = { date: Date.now(), amount: amount };
              let level8Income = {
                date: Date.now(),
                amount: amount,
                level: "level8",
                roiId: it.userInfo.roiId,
              };
              const fundingSourceData = await FundingSource.findOne({
                userId: user._id.toString(),
              });
              if (fundingSourceData) {
                // let walletBalance = Number(fundingSourceData.balance.wallet);
                // walletBalance += amount;
                const fsourceUpdate = await FundingSource.findOneAndUpdate(
                  {
                    userId: user._id.toString(),
                  },
                  {
                    $push: {
                      roilevel3to10Income: level8Income,
                    },
                    "balance.wallet":
                      Number(fundingSourceData.balance.wallet) + amount,
                  }
                  // {
                  //   new: true,
                  // }
                );
              }
            }
          }
        }

        // console.log("fundingSourceData", fundingSourceData);
      } else {
        // console.log("No levels");
      }
    } catch (err) {
      console.log(err);
    }
  },
  level9Income: async (roiId) => {
    try {
      const cronjobsave = new cronjobModel({
        jobPerform: "Level 9 Income generate",
        cronJobTime: "level 9",
        indiaCronjontime: todayIndiaDate,
      });
      await cronjobsave.save();
      const user = await User.findOne({
        $and: [
          { "userInfo.roiId": roiId },
          { isActive: true },
          { deleted: false },
        ],
      });
      if (user.roiLevel.level9 && user.roiLevel.level9.length > 0) {
        const level9users = await User.find({
          "userInfo.roiId": { $in: user.roiLevel.level9 },
        });

        for (it of level9users) {
          if (it.isActive) {
            let activationDate = new Date(it.activationDate.valueOf());
            let activationDate1 = moment.tz(activationDate, "Asia/Kolkata");
            activationDate1.set({
              hour: 0,
              minute: 0,
              second: 0,
              millisecond: 0,
            });
            // activationDate.setHours(0);
            // activationDate.setMinutes(0);
            // activationDate.setMilliseconds(0);

            // console.log("activationDate", activationDate1);

            let minDate = new Date(it.activationDate.valueOf());
            // minDate = new Date(minDate.setDate(minDate.getDate()));
            let minDate1 = moment.tz(minDate, "Asia/Kolkata");
            minDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            // minDate.setHours(0);
            // minDate.setMinutes(0);
            // minDate.setMilliseconds(0);

            let maxDate = new Date(it.activationDate.valueOf());
            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));
            let maxDate1 = moment.tz(maxDate, "Asia/Kolkata");
            maxDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            maxDate1.add(2, "days");
            // maxDate.setHours(0);
            // maxDate.setMinutes(0);
            // maxDate.setMilliseconds(0);

            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));

            // minDate = new Date(minDate.setDate(minDate.getDate()));
            if (todayIndiaDate > minDate1 && todayIndiaDate < maxDate1) {
              console.log("ok");
              let amount = (Number(it.activePlan) * 1) / 100;
              console.log("amount", amount);
              // let level2Income = { date: Date.now(), amount: amount };
              let level9Income = {
                date: Date.now(),
                amount: amount,
                level: "level9",
                roiId: it.userInfo.roiId,
              };
              const fundingSourceData = await FundingSource.findOne({
                userId: user._id.toString(),
              });
              if (fundingSourceData) {
                // let walletBalance = Number(fundingSourceData.balance.wallet);
                // walletBalance += amount;
                const fsourceUpdate = await FundingSource.findOneAndUpdate(
                  {
                    userId: user._id.toString(),
                  },
                  {
                    $push: {
                      roilevel3to10Income: level9Income,
                    },
                    "balance.wallet":
                      Number(fundingSourceData.balance.wallet) + amount,
                  }
                  // {
                  //   new: true,
                  // }
                );
              }
            }
          }
        }

        // console.log("fundingSourceData", fundingSourceData);
      } else {
        // console.log("No levels");
      }
    } catch (err) {
      console.log(err);
    }
  },
  level10Income: async (roiId) => {
    try {
      const cronjobsave = new cronjobModel({
        jobPerform: "Level 10 Income generate",
        cronJobTime: "level 10",
        indiaCronjontime: todayIndiaDate,
      });
      await cronjobsave.save();
      const user = await User.findOne({
        $and: [
          { "userInfo.roiId": roiId },
          { isActive: true },
          { deleted: false },
        ],
      });
      if (user.roiLevel.level10 && user.roiLevel.level10.length > 0) {
        const level10users = await User.find({
          "userInfo.roiId": { $in: user.roiLevel.level10 },
        });

        for (it of level10users) {
          if (it.isActive) {
            let activationDate = new Date(it.activationDate.valueOf());
            let activationDate1 = moment.tz(activationDate, "Asia/Kolkata");
            activationDate1.set({
              hour: 0,
              minute: 0,
              second: 0,
              millisecond: 0,
            });
            // activationDate.setHours(0);
            // activationDate.setMinutes(0);
            // activationDate.setMilliseconds(0);

            // console.log("activationDate", activationDate1);

            let minDate = new Date(it.activationDate.valueOf());
            // minDate = new Date(minDate.setDate(minDate.getDate()));
            let minDate1 = moment.tz(minDate, "Asia/Kolkata");
            minDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            // minDate.setHours(0);
            // minDate.setMinutes(0);
            // minDate.setMilliseconds(0);

            let maxDate = new Date(it.activationDate.valueOf());
            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));
            let maxDate1 = moment.tz(maxDate, "Asia/Kolkata");
            maxDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            maxDate1.add(2, "days");
            // maxDate.setHours(0);
            // maxDate.setMinutes(0);
            // maxDate.setMilliseconds(0);

            // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));

            // minDate = new Date(minDate.setDate(minDate.getDate()));
            if (todayIndiaDate > minDate1 && todayIndiaDate < maxDate1) {
              console.log("ok");
              let amount = (Number(it.activePlan) * 1) / 100;
              console.log("amount", amount);
              // let level2Income = { date: Date.now(), amount: amount };
              let level10Income = {
                date: Date.now(),
                amount: amount,
                level: "level10",
                roiId: it.userInfo.roiId,
              };
              const fundingSourceData = await FundingSource.findOne({
                userId: user._id.toString(),
              });
              if (fundingSourceData) {
                // let walletBalance = Number(fundingSourceData.balance.wallet);
                // walletBalance += amount;
                const fsourceUpdate = await FundingSource.findOneAndUpdate(
                  {
                    userId: user._id.toString(),
                  },
                  {
                    $push: {
                      roilevel3to10Income: level10Income,
                    },
                    "balance.wallet":
                      Number(fundingSourceData.balance.wallet) + amount,
                  }
                  // {
                  //   new: true,
                  // }
                );
              }
            }
          }
        }

        // console.log("fundingSourceData", fundingSourceData);
      } else {
        // console.log("No levels");
      }
    } catch (err) {
      console.log(err);
    }
  },

  //level3to10Income: async (roiId) => {
  // try {
  //   const user = await User.findOne({
  //     $and: [
  //       { "userInfo.roiId": roiId },
  //       { isActive: true },
  //       { deleted: false },
  //     ],
  //   });
  //   let level;
  //   for (let i = 3; i <= 10; i++) {
  //     console.log(i);
  //     level = `level${i}`;
  //     console.log("level", level);
  //     if (user.roiLevel[level] && user.roiLevel[level].length > 0) {
  //       console.log("level", level);
  //       // const levelUsers = await User.find({
  //       //   "userInfo.roiId": { $in: user.roiLevel[level] },
  //       // });
  //       // console.log("levelUsers", levelUsers);
  //       user.roiLevel[level].forEach(async (it) => {
  //         const leveluser = await User.findOne({
  //           $and: [
  //             { "userInfo.roiId": it },
  //             { isActive: true },
  //             { deleted: false },
  //           ],
  //         });

  //         if (leveluser.isActive) {
  //           let activationDate = new Date(leveluser.activationDate.valueOf());
  //           let activationDate1 = moment.tz(activationDate, "Asia/Kolkata");
  //           activationDate1.set({
  //             hour: 0,
  //             minute: 0,
  //             second: 0,
  //             millisecond: 0,
  //           });
  //           // activationDate.setHours(0);
  //           // activationDate.setMinutes(0);
  //           // activationDate.setMilliseconds(0);

  //           // console.log("activationDate", activationDate1);

  //           let minDate = new Date(leveluser.activationDate.valueOf());
  //           // minDate = new Date(minDate.setDate(minDate.getDate()));
  //           let minDate1 = moment.tz(minDate, "Asia/Kolkata");
  //           minDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
  //           // minDate.setHours(0);
  //           // minDate.setMinutes(0);
  //           // minDate.setMilliseconds(0);

  //           let maxDate = new Date(leveluser.activationDate.valueOf());
  //           // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 110));
  //           let maxDate1 = moment.tz(maxDate, "Asia/Kolkata");
  //           maxDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
  //           maxDate1.add(2, "days");
  //           // maxDate.setHours(0);
  //           // maxDate.setMinutes(0);
  //           // maxDate.setMilliseconds(0);

  //           // maxDate = new Date(maxDate.setDate(maxDate.getDate() + 1));

  //           // minDate = new Date(minDate.setDate(minDate.getDate()));

  //           if (todayIndiaDate > minDate1 && todayIndiaDate < maxDate1) {
  //             console.log("ok+++++++++");
  //             let roiid = it;
  //             let amount = 0;
  //             if (i == 3) {
  //               amount = (Number(leveluser.activePlan) * 2) / 100;
  //             } else {
  //               amount = (Number(leveluser.activePlan) * 1) / 100;
  //             }
  //             console.log("amount+++++++", amount);
  //             let levelsIncome = {
  //               date: Date.now(),
  //               amount: amount,
  //               level: level,
  //               roiId: roiid,
  //             };
  //             const fundingSourceData = await FundingSource.findOne({
  //               userId: user._id.toString(),
  //             });
  //             // console.log("fundingSourceData", fundingSourceData);
  //             if (fundingSourceData) {
  //               let walletBalance = Number(fundingSourceData.balance.wallet);
  //               walletBalance += amount;
  //               const fsourceUpdate = await FundingSource.findOneAndUpdate(
  //                 {
  //                   userId: user._id.toString(),
  //                 },
  //                 {
  //                   $push: {
  //                     roilevel3to10Income: levelsIncome,
  //                   },
  //                   "balance.wallet": walletBalance,
  //                 },
  //                 {
  //                   new: true,
  //                 }
  //               );
  //               // console.log("fsourceUpdate", fsourceUpdate);
  //             }
  //           }
  //         }
  //       });
  //     } else {
  //       // console.log("No levels");
  //     }
  //   }
  // level 3 income
  // if (user.roiLevel.level3 && user.roiLevel.level3.length > 0) {
  //   const leve31users = await User.find({
  //     "userInfo.roiId": { $in: user.roiLevel.level3 },
  //   });
  //   level3users.forEach((it) => {
  //     if (it.isActive) {
  //       let activationDate = new Date(it.activationDate.valueOf());
  //       activationDate.setHours(0);
  //       activationDate.setMinutes(0);
  //       activationDate.setMilliseconds(0);

  //       console.log("activationDate", activationDate);

  //       let minDate = new Date(it.activationDate.valueOf());
  //       minDate.setHours(0);
  //       minDate.setMinutes(0);
  //       minDate.setMilliseconds(0);

  //       let maxDate = new Date(it.activationDate.valueOf());
  //       maxDate.setHours(0);
  //       maxDate.setMinutes(0);
  //       maxDate.setMilliseconds(0);

  //       maxDate = new Date(maxDate.setDate(maxDate.getDate() + 1));

  //       minDate = new Date(minDate.setDate(minDate.getDate()));
  //       if (toadayDate > minDate && toadayDate < maxDate) {
  //         console.log("ok");
  //         let roiid = it.userInfo.roiId
  //         let  amount = (Number(it.activePlan) * 2) / 100;
  //         console.log("amount", amount);
  //         let income3to10 = { date: toadayDate, amount: amount, level:"level3", roiId:roiid };
  //         const fundingSourceData = await FundingSource.findOneAndUpdate(
  //           {
  //             userId: user._id.toString(),
  //           },
  //           {
  //             $push: {
  //               roilevel3to10Income: income3to10,
  //             },
  //           },
  //           {
  //             new: true,
  //           }
  //         );
  //         console.log("fundingSourceData", fundingSourceData);
  //       }
  //       }
  //     })
  // }
  // } catch (err) {
  //   console.log(err);
  // }
  //},
  withDrawalBalance: async (roiId) => {
    const cronjobsave = new cronjobModel({
      jobPerform: "withdrwal generated",
      cronJobTime: "withdrwal",
      indiaCronjontime: todayIndiaDate,
    });
    await cronjobsave.save();
    const user = await User.findOne({
      $and: [
        { "userInfo.roiId": roiId },
        { isActive: true },
        { deleted: false },
      ],
    });
    const fundingSourceData = await FundingSource.findOne({
      userId: user._id.toString(),
    });
    if (fundingSourceData) {
      let walletBalance = Number(fundingSourceData.balance.wallet);
      if (walletBalance > 0) {
        let serviceAmount = Number((walletBalance * 10) / 100);
        let actualAmount = walletBalance - serviceAmount;
        if (actualAmount >= 150) {
          let withDrawalAmount = {
            date: Date.now(),
            actualAmount: actualAmount,
            amount: walletBalance,
          };
          const fsourceUpdate = await FundingSource.findOneAndUpdate(
            {
              userId: user._id.toString(),
            },
            {
              $push: {
                withDrawalHistory: withDrawalAmount,
              },
              "balance.wallet": 0,
            },
            {
              new: true,
            }
          );
        }
      }
    }
  },
  getAllActiveRoi: async () => {
    let users = await User.find({
      $and: [
        { deleted: false },
        {
          "userInfo.email": {
            $nin: ["topadmin@yopmail.com", "fundlakshmi@gmail.com"],
          },
        },
        { isActive: true },
      ],
    });
    let allRoiIds = [];
    users.forEach((it) => {
      allRoiIds.push(it.userInfo.roiId);
    });
    //console.log("allRoiIds", allRoiIds);
    return allRoiIds;
  },
};

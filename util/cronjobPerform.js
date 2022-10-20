const { FundingSource } = require("../models/fundingSource");
const moment = require("moment-timezone");
const cron = require("node-cron");
const {
  investIncome,
  level1Income,
  level2Income,
  level3Income,
  level4Income,
  level5Income,
  level6Income,
  level7Income,
  level8Income,
  level9Income,
  level10Income,
  getAllActiveRoi,
  withDrawalBalance,
} = require("./income");

const herokuAwakeJobTime = "0 32 0 * * *"; // every day 6:02:00 AM important
const backupCraeteJobTime = "30 32 0 * * *"; // every day 6:02:30 AM important
const roi_incomJobTime = "0 33 0 * * *"; // every day 6:03:00 AM important
const level1_incomJobTime = "30 33 0 * * *"; // every day 6:03:30 AM important
const level2_incomJobTime = "0 34 0 * * *"; // every day 6:04:00 AM important
const level3_incomJobTime = "30 34 0 * * *"; // every day 6:04:30 AM important
const level4_incomJobTime = "0 35 0 * * *"; // every day 6:05:00 AM important
const level5_incomJobTime = "30 35 0 * * *"; // every day 6:05:30 AM important
const level6_incomJobTime = "0 36 0 * * *"; // every day 6:06:00 AM important
const level7_incomJobTime = "30 36 0 * * *"; // every day 6:06:30 AM important
const level8_incomJobTime = "0 37 0 * * *"; // every day 6:07:00 AM important
const level9_incomJobTime = "30 37 0 * * *"; // every day 6:07:30 AM important
const level10_incomJobTime = "0 38 0 * * *"; // every day 6:08:00 AM important

module.exports = {
  autoCronJob: () => {
    let allRoids = [];
    cron.schedule(
      herokuAwakeJobTime,
      async function () {
        allRoids = await getAllActiveRoi();
        for (it of allRoids) {
          console.log("active roi" + it);
        }
      },
      { timezone: "Asia/Kolkata" }
    );

    cron.schedule(
      backupCraeteJobTime,
      async function () {
        let curr_date1 = moment.tz(Date.now(), "Asia/Kolkata");
        let dd = curr_date1.date() - 1;
        let mm = curr_date1.month() + 1;
        let yyyy = curr_date1.year();
        let collectionName = `FundingSource_${dd}_${mm}_${yyyy}`;
        FundingSource.aggregate([{ $out: collectionName }], (err, response) => {
          if (err) {
            console.log("err", err);
          } else {
            console.log("Backup created.");
          }
        });
      },
      { timezone: "Asia/Kolkata" }
    );

    cron.schedule(
      roi_incomJobTime,
      async function () {
        console.log("roi income");
        for (it of allRoids) {
          investIncome(it);
        }
      },
      { timezone: "Asia/Kolkata" }
    );
    cron.schedule(
      level1_incomJobTime,
      async function () {
        console.log("level 1 income");
        for (it of allRoids) {
          level1Income(it);
        }
      },
      { timezone: "Asia/Kolkata" }
    );
    cron.schedule(
      level2_incomJobTime,
      async function () {
        console.log("level 2 income");
        for (it of allRoids) {
          level2Income(it);
        }
      },
      { timezone: "Asia/Kolkata" }
    );
    cron.schedule(
      level3_incomJobTime,
      async function () {
        console.log("level 3 income");
        for (it of allRoids) {
          level3Income(it);
        }
      },
      { timezone: "Asia/Kolkata" }
    );
    cron.schedule(
      level4_incomJobTime,
      async function () {
        console.log("level 4 income");
        for (it of allRoids) {
          level4Income(it);
        }
      },
      { timezone: "Asia/Kolkata" }
    );
    cron.schedule(
      level5_incomJobTime,
      async function () {
        console.log("level 5 income");
        for (it of allRoids) {
          level5Income(it);
        }
      },
      { timezone: "Asia/Kolkata" }
    );
    cron.schedule(
      level6_incomJobTime,
      async function () {
        console.log("level 6 income");
        for (it of allRoids) {
          level6Income(it);
        }
      },
      { timezone: "Asia/Kolkata" }
    );
    cron.schedule(
      level7_incomJobTime,
      async function () {
        console.log("level 7 income");
        for (it of allRoids) {
          level7Income(it);
        }
      },
      { timezone: "Asia/Kolkata" }
    );
    cron.schedule(
      level8_incomJobTime,
      async function () {
        console.log("level 8 income");
        for (it of allRoids) {
          level8Income(it);
        }
      },
      { timezone: "Asia/Kolkata" }
    );
    cron.schedule(
      level9_incomJobTime,
      async function () {
        console.log("level 9 income");
        for (it of allRoids) {
          level9Income(it);
        }
      },
      { timezone: "Asia/Kolkata" }
    );
    cron.schedule(
      level10_incomJobTime,
      async function () {
        console.log("level 10 income");
        for (it of allRoids) {
          level10Income(it);
        }
      },
      { timezone: "Asia/Kolkata" }
    );
    // cron.schedule(
    //   withDrawalJobTime,
    //   async function () {
    //     console.log("withdrawal");
    //     for (it of allRoids) {
    //       withDrawalBalance(it);
    //     }
    //   },
    //   { timezone: "Asia/Kolkata" }
    // );
  },
};

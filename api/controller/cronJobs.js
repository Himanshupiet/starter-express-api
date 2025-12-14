const axios = require('axios')
const { cronjobModel } = require("../../models/cronjob");
const { roleModel } = require("../../models/role");
const { userModel } = require("../../models/user");
const { examModel } = require("../../models/exam");
const { resultModel } = require("../../models/result");
const { resultEntryPerModel } = require("../../models/resutlEntryPer");
const { examDateAndSubModel } = require("../../models/examDateAndSub");
const { vehicleModel } = require("../../models/vehicle");
const { vehicleRouteFareModel } = require("../../models/vehicleRouteFare");
const { monthlyFeeListModel } = require("../../models/monthlyFeeList");
const { paymentModel } = require("../../models/payment");
const { invoiceModel } = require("../../models/invoice ");
const { payOptionModel } = require("../../models/payOption");
const { messageModel } = require("../../models/message")
const nodemailer = require("nodemailer");
const moment = require("moment-timezone");
// const todayIndiaDate = moment.tz(Date.now(), "Asia/Kolkata");
// todayIndiaDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
// // console.log("Today India date", todayIndiaDate);
//console.log("CURRENT TIME: " + moment().format('hh:mm:ss A'));
const JSZip = require('jszip');
const { whatsAppMessage } = require('../../util/helper');
const zip = new JSZip();
const whatsappApiUrl = process.env.WHATSAPP_API_URL
const whatsappApiToken = process.env.WHATSAPP_API_TOKEN
function generateUniqueId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function momentTodayDate() {
  return moment.tz(new Date(), 'DD/MM/YYYY', 'Asia/Kolkata').format('DD/MM/YYYY');;
}
// const transporter = nodemailer.createTransport({
//   host: "smtp-relay.brevo.com",
//   port: 587,
//   secure: false,
//   auth: {
//     // TODO: replace `user` and `pass` values from <https://forwardemail.net>
//     user: '626492001@smtp-brevo.com',
//     pass: 'KCbSGvUfmEw9pkYI'
//   },
//   // tls: {
//   //   // do not fail on invalid certs
//   //   rejectUnauthorized: false,
//   // }
// });

const transporter = nodemailer.createTransport({
  service: "Gmail",
  //host: "",
  //port: 587,
  //secure: false,
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  // tls: {
  //   // do not fail on invalid certs
  //   rejectUnauthorized: false,
  // }
});


const mailTo = `bmmsbkg@gmail.com`

let requestBody = {
  jobPerform: `Daily Backup Mail Send.`,
  detail: `${mailTo} Daily Backup Mail send successfully.`,
  scheduleTime: (moment().format('hh:mm:ss A')).toString(),
  status: 'Success'
}

function createFormattedString(user) {
  const roleName = user.userInfo.roleName;
  const fullName = user.userInfo.fullName;
  const userClass = user.userInfo.class;

  let formattedRoleName;
  if (roleName === "TEACHER") {
    formattedRoleName = roleName.toUpperCase();
  } else if (roleName === "STUDENT") {
    formattedRoleName = "Student";
  } else {
    formattedRoleName = roleName; // Default case if role is neither TEACHER nor STUDENT
  }

  return `${formattedRoleName}: ${fullName} (Class: ${userClass})`;
}


module.exports = {
  sendDailyBackupEmail: async (req, res, next) => {
    console.log("Creating backup")
    try {
      const today = momentTodayDate();
      const userData = await userModel.find()

      const roleData = await roleModel.find()
      const examData = await examModel.find()
      const resultData = await resultModel.find()
      const resultEntryPerData = await resultEntryPerModel.find()
      const examDateAndSubData = await examDateAndSubModel.find()
      const vehicleData = await vehicleModel.find()
      const vehicleRouteFareData = await vehicleRouteFareModel.find()
      const monthlyFeeListData = await monthlyFeeListModel.find()
      const paymentData = await paymentModel.find()
      const invoiceData = await invoiceModel.find()
      const payOptionData = await payOptionModel.find()

      //zip.file("users.json", JSON.stringify(userData));
      //zip.file("roles.json", JSON.stringify(roleData));
      //zip.file("exams.json", JSON.stringify(examData));
      //zip.file("results.json", JSON.stringify(resultData));
      //zip.file("resultentrypers.json", JSON.stringify(resultEntryPerData));
      //zip.file("examdateandsubs.json", JSON.stringify(examDateAndSubData));
      //zip.file("vehicles.json", JSON.stringify(vehicleData));
      //zip.file("vehicleroutefares.json", JSON.stringify(vehicleRouteFareData));
      //zip.file("monthlyfeelists.json", JSON.stringify(monthlyFeeListData));
      zip.file("payments.json", JSON.stringify(paymentData));
      //zip.file("invoices.json", JSON.stringify(invoiceData));
      //zip.file("payoptions.json", JSON.stringify(payOptionData));

      const buffer = await zip.generateAsync({ type: `nodebuffer` })
      // console.log("buffer", buffer)

      if (buffer) {
        const mailOptions = {
          from: `"BMMS Daily Backup ${today}"   <info@bmmschool.in>`, // sender address
          to: mailTo, // list of receivers
          subject: `BMMS Daily Backup ${today}`, // Subject line
          text: "Find atachment", // plain text body
          html: "<b>BM Memorial School</b>", // html body
          attachments: [
            {
              filename: `BMMS_Daily_Backup_${today}.zip`,
              content: buffer
            },
          ],

        }
        try {
          transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
              requestBody.status = `Fail`
              requestBody.detail = error.message ? error.message : `Error while sending mail`
              const response = await cronjobModel.create(requestBody);
              console.log("Backup mail error", error)
              // res.status(200).json({
              //   status: 'success',
              //   message: 'Daily Backup run',
              // })

            } else {
              const response = await cronjobModel.create(requestBody);
              console.log("Backup mail success", info)
              // res.status(200).json({
              //   status: 'success',
              //   message: 'Daily Backup run',
              // })
            }
          });
        } catch (error) {
          console.log("Error while send backup email")
          requestBody.status = `Fail`
          requestBody.detail = error.message ? error.message : `Error while sending mail`
          const response = await cronjobModel.create(requestBody);
          //  res.status(200).json({
          //    status: 'success',
          //    message: 'Daily Backup run',
          //  })
        }

      } else {
        requestBody.status = `Fail`
        requestBody.detail = err.message ? err.message : `Error while creating backup.`
        const response = await cronjobModel.create(requestBody);
        // res.status(200).json({
        //   status: 'success',
        //   message: 'Daily Backup run',
        // })
      }

    } catch (err) {
      requestBody.status = `Fail`
      requestBody.detail = err.message ? err.message : `Something went wrong when creating backup/sending mail`
      const response = await cronjobModel.create(requestBody);
      // res.status(200).json({
      //   status: 'success',
      //   message: 'Daily Backup run',
      // })
      console.log(err);
      // return res.status(400).json({
      //   success: false,
      //   error: err.message,
      // });
    }
  },
  fetchBirthdays: async (req, res, next) => {
    const today = momentTodayDate();
    const birthDayUser2 = await userModel.aggregate([
      {
        $addFields: {
          istDate: {
            $dateToString: {
              format: "%m-%d",
              date: {
                $add: [
                  "$userInfo.dob",
                  19800000 // Offset for IST in milliseconds (5 hours 30 minutes)
                ]
              }
            }
          }
        }
      },
      {
        $match: {
          $and: [
            {
              istDate: {
                $eq: new Date(new Date().getTime() + 19800000).toISOString().substr(5, 5)
              }
            },
            { deleted: false },
            { isApproved: true },
            { isActive: true }
          ]
        }

      },
      // {
      //   $project: {
      //     _id: 0,           // Exclude the _id field
      //     fullName: 1,      // Include the fullName field
      //     dob: 1            // Include the dob field
      //   }
      // }
    ])
    // console.log("birthdayUser", birthDayUser2)
    if (birthDayUser2 && birthDayUser2.length > 0) {
      let list = []
      const title = 'जन्मदिन की हार्दिक शुभकामनाएँ'
      const tempType = 'birthday_wish_student' //'general'
      const msg = null
      let data = {

        //title,
        //sendMessageFor:'BIRTHDAY'
      }
      for (const it of birthDayUser2) {
        const birthdayUser = createFormattedString(it)
        list.push(birthdayUser)
        //const message= `${it.userInfo.fullName}, Class ${it.userInfo.class}, आपके जन्मदिन के इस शुभ अवसर पर B.M. Memorial School परिवार की ओर से आपको ढेर सारी शुभकामनाएँ। हम आपके उज्ज्वल भविष्य और सफलता की कामना करते हैं। आपकी मेहनत और समर्पण से आप हमेशा आगे बढ़ते रहें। आपका दिन खुशियों से भरा हो!`
        // data={...data, message, userId: it.userInfo.userId}
        data = { ...data, userId: it.userInfo.userId, stName: it.userInfo.fullName, class: it.userInfo.class }
        if (it.userInfo.phoneNumber1) {
          const response = await whatsAppMessage(it.userInfo.phoneNumber1, msg, tempType, data)
        }
        if (it.userInfo.phoneNumber2) {
          const response = await whatsAppMessage(it.userInfo.phoneNumber2, msg, tempType, data)
        }
      }
      // await whatsAppMessage('7870421111', null, 'notification', {title:"BIRTHDAY", sendMessageFor:'BIRTHDAY_CRON_JOB', details:`Today Birthday, ${list}`, date:today})// Dinker
      // await whatsAppMessage('7250175700', null, 'notification', {title:"BIRTHDAY", sendMessageFor:'BIRTHDAY_CRON_JOB', details:`Today Birthday, ${list}`, date:today})// kailash
      // await whatsAppMessage('8233443106', null, 'notification', {title:"BIRTHDAY", sendMessageFor:'BIRTHDAY_CRON_JOB', details:`Today Birthday, ${list}`, date:today})

      await whatsAppMessage('7870421111', null, 'bitrthday_wish', { list, date: today })// Dinker
      //await whatsAppMessage('7250175700', null, 'bitrthday_wish', {list, date:today})// kailash
      await whatsAppMessage('8233443106', null, 'bitrthday_wish', { list, date: today })

      if (res || req) {
        return res.status(200).json({
          success: true,
          message: "Birthday wishes send.",
        })
      }
    } else {
      if (res || req) {
        return res.status(200).json({
          success: false,
          message: "No birthrday found.",
        })
      }
    }

  },
  serverWakeupApi: async () => {
    try {
      const response = await axios.get("https://bmmsbackendapp.onrender.com/");
      if (response) {
        console.log("server wake up success....")
      } else {
        console.log("server not reach out")
      }
    } catch (error) {
      console.log("Error while while wake up server", error)
    }

  }
};

// hhhhhhhhhhhhhhhhhh {
//   "accepted": [
//     "bmmsbkg@gmail.com"
//   ],
//   "rejected": [],
//   "ehlo": [
//     "PIPELINING",
//     "8BITMIME",
//     "AUTH LOGIN PLAIN CRAM-MD5"
//   ],
//   "envelopeTime": 131,
//   "messageTime": 75,
//   "messageSize": 3799,
//   "response": "250 Message queued as <b317022a-32f2-e8cb-8740-f203bac5caf6@bmmschool.in>",
//   "envelope": {
//     "from": "info@bmmschool.in",
//     "to": [
//       "bmmsbkg@gmail.com"
//     ]
//   },
//   "messageId": "<b317022a-32f2-e8cb-8740-f203bac5caf6@bmmschool.in>"
// }
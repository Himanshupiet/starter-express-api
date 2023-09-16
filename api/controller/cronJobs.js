const {cronjobModel}=require("../../models/cronjob");
const {roleModel}=require("../../models/role");
const {userModel}=require("../../models/user");
const {examModel } = require("../../models/exam");
const {resultModel } = require("../../models/result");
const {resultEntryPerModel } = require("../../models/resutlEntryPer");
const {examDateAndSubModel}=require("../../models/examDateAndSub");
const {vehicleModel}=require("../../models/vehicle");
const {vehicleRouteFareModel}=require("../../models/vehicleRouteFare");
const {monthlyFeeListModel}=require("../../models/monthlyFeeList");
const {paymentModel}=require("../../models/payment");
const {invoiceModel}=require("../../models/invoice ");
const {payOptionModel}=require("../../models/payOption");
const nodemailer = require("nodemailer");
const moment = require("moment-timezone");
const todayIndiaDate = moment.tz(Date.now(), "Asia/Kolkata");
todayIndiaDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
// console.log("Today India date", todayIndiaDate);
//console.log("CURRENT TIME: " + moment().format('hh:mm:ss A'));
const JSZip = require('jszip');
const zip = new JSZip();
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: 'geekygeeks14@gmail.com',
    pass: 'XgUC9AvZr16cyP0H'
  },
  // tls: {
  //   // do not fail on invalid certs
  //   rejectUnauthorized: false,
  // }
});

const mailTo= `hkc.kumar@gmail.com, bmmsbkg@gmail.com`

let requestBody={
  jobPerform: `Daily Backup Mail Send.`,
  detail: `${mailTo} Daily Backup Mail send successfully.`,
  scheduleTime: (moment().format('hh:mm:ss A')).toString(),
  status: 'Success'
}


module.exports = {
    sendDailyBackupEmail: async (req, res, next) => {
    try {
      let today = new Date(todayIndiaDate);
      let dd = String(today.getDate()).padStart(2, '0');
      let mm = String(today.getMonth() + 1).padStart(2, '0'); 
      let yyyy = today.getFullYear();
      today = dd + '/' + mm + '/' + yyyy;
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
  
      
      zip.file("users.json", JSON.stringify(userData));
      zip.file("roles.json",JSON.stringify(roleData));
      zip.file("exams.json", JSON.stringify(examData));
      zip.file("results.json",JSON.stringify(resultData));
      zip.file("resultentrypers.json", JSON.stringify(resultEntryPerData));
      zip.file("examdateandsubs.json",JSON.stringify(examDateAndSubData));
      zip.file("vehicles.json", JSON.stringify(vehicleData));
      zip.file("vehicleroutefares.json",JSON.stringify(vehicleRouteFareData));
      zip.file("monthlyfeelists.json", JSON.stringify(monthlyFeeListData));
      zip.file("payements.json",JSON.stringify(paymentData));
      zip.file("invoices.json", JSON.stringify(invoiceData));
      zip.file("payoptions.json",JSON.stringify(payOptionData));

      const buffer = await zip.generateAsync({ type: `nodebuffer` })

      if(buffer){
          const mailOptions ={
              from: `"Daily Backup ${today}"   <info@bmmschool.in>`, // sender address
              to: mailTo, // list of receivers
              subject: `Daily Backup ${today}`, // Subject line
              text: "Find atachment", // plain text body
              html: "<b>BM Memorial School</b>", // html body
              attachments: [
                {   
                    filename: `Daily_${today}.zip`,
                    content:  buffer
                },
              ],
          }
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              requestBody.status= `Fail`
              requestBody.detail= error.message? error.message: `Error while sending mail`
              cronjobModel.create(requestBody,function (err, response) {
                if (err) {
                    next(err)
                } else {
                    res.status(200).json({
                        status: 'success',
                        message: `Daily Backup run`
                    })
                }
              }) 
         
            }else{
              cronjobModel.create(requestBody,function (err, response) {
                if (err) {
                    next(err)
                } else {
                    res.status(200).json({
                        status: 'success',
                        message: `Daily Backup run`
                    })
                 }
                }) 
              }
          });
          
      }else{
        requestBody.status= `Fail`
        requestBody.detail= err.message? err.message: `Error while creating backup.`
        cronjobModel.create(requestBody,function (err, response) {
          if (err) {
              next(err)
          } else {
              res.status(200).json({
                  status: 'success',
                  message: `Daily Backup run`
              })
           }
          }) 
      }
    
    } catch (err) {
      requestBody.status= `Fail`
      requestBody.detail= err.message? err.message: `Something went wrong when creating backup/sending mail`
      cronjobModel.create(requestBody,function (err, response) {
        if (err) {
            next(err)
        } else {
            res.status(200).json({
                status: 'success',
                message: `Daily Backup run`
            })
         }
      }) 
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Something went wrong when creating backup/sending mail",
        error: err.message,
      });
    }
  },
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
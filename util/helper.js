const fast2sms = require("fast-two-sms");
const axios = require('axios')
var CronJob = require('cron').CronJob;
const moment = require("moment-timezone");
const todayIndiaDate = moment.tz(Date.now(), "Asia/Kolkata");
todayIndiaDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
console.log("Today India date",  moment.tz(Date.now(), "Asia/Kolkata").format('YYYY'));
const mongoose = require("mongoose");
const { userModel } = require("../models/user");
//const mailgun = require("mailgun-js");
const CryptoJS = require('crypto-js');
const {invoiceModel}=require("../models/invoice ");
const {messageModel} = require('../models/message')
const nodemailer = require("nodemailer");
const fs = require("fs").promises;

const JSZip = require('jszip');
const zip = new JSZip();
const {roleModel}=require("../models/role");
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
//const OneSignal = require('onesignal-node'); 
// const awsSdk = require("aws-sdk");
// const s3 = new awsSdk.S3()

const DOMAIN ="https://api.mailgun.net/v3/sandboxea9896c664194cff9614608387a91f33.mailgun.org";
require("dotenv/config");
const smsapikey = process.env.SMS_API;
const URL = process.env.MONGO_LOCAL_CONN_URL;
const SECRET_MSG= process.env.SECRET_MSG
const SECRET_MSG_PASSWORD = process.env.SECRET_MSG_PASSWORD
const whatsappApiUrl = process.env.WHATSAPP_API_URL
const whatsappApiToken = process.env.WHATSAPP_API_TOKEN

function generateUniqueId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
Date.prototype.getFinancialMonthIndex = function(timezone = "Asia/Kolkata") {
  // Get the actual month index (0-11) using moment-timezone
  const actualMonthIndex = moment.tz(this, timezone).month();
  // Shift the index so that April is 1 and March is 12
  return (actualMonthIndex + 9) % 12 + 1;
};
module.exports = {
  // to send email
  sendEmail: async (data) => {
    // console.log("email", data);
    // const mg = mailgun({
    //   apiKey: "53e27866df661695271225a6e49e93d4-02fa25a3-4de5fb23",
    //   domain: DOMAIN,
    // });
    // const data1 = {
    //   from: "info@bmmschool.in",
    //   to: data.email,
    //   subject: "Registered Successfully with LAKSHMI FUND.",
    //   text: "Testing some Mailgun awesomness!",
    // };
    // mg.messages().send(data1, function (error, body) {
    //   if (error) {
    //     console.log("mail", error);
    //   } else {
    //     console.log("shi", body);
    //   }
    // });

    // let mailOptions = {
    //   from: "fundlakshmi@gmail.com",
    //   to: data.reciverEmail,
    //   subject: "Registered Successfully with LAKSHMI FUND.",
    //   // text: `Welcome ${data.name}.\nYou are sucessfully register to Laxmi Fund with \nPhone Number - ${data.phoneNumber}\nYour ROI-ID is ${data.roiId}.\nYour Password is ${data.password}.`,
    //   html: `<html style="width:100%;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0;"><head> <meta charset="UTF-8"> <meta content="width=device-width, initial-scale=1" name="viewport"> <meta name="x-apple-disable-message-reformatting"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta content="telephone=no" name="format-detection"> <title>LAKSHMI FUND REGISTRATION</title> <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,400i,700,700i" rel="stylesheet"><style type="text/css"> @media only screen and (max-width: 600px) { p, ul li, ol li, a { font-size: 16px !important; line-height: 150% !important } h1 { font-size: 30px !important; text-align: left; line-height: 120% !important } h2 { font-size: 26px !important; text-align: left; line-height: 120% !important } h3 { font-size: 20px !important; text-align: left; line-height: 120% !important } h1 a { font-size: 30px !important; text-align: left } h2 a { font-size: 26px !important; text-align: left } h3 a { font-size: 20px !important; text-align: left } .es-menu td a { font-size: 16px !important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size: 16px !important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size: 16px !important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size: 12px !important } *[class="gmail-fix"] { display: none !important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align: center !important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align: right !important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align: left !important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display: inline !important } .es-button-border { display: block !important } a.es-button { font-size: 20px !important; display: block !important; border-left-width: 0px !important; border-right-width: 0px !important } .es-btn-fw { border-width: 10px 0px !important; text-align: center !important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width: 100% !important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width: 100% !important; max-width: 600px !important } .es-adapt-td { display: block !important; width: 100% !important } .adapt-img { width: 100% !important; height: auto !important } .es-m-p0 { padding: 0px !important } .es-m-p0r { padding-right: 0px !important } .es-m-p0l { padding-left: 0px !important } .es-m-p0t { padding-top: 0px !important } .es-m-p0b { padding-bottom: 0 !important } .es-m-p20b { padding-bottom: 20px !important } .es-mobile-hidden, .es-hidden { display: none !important } .es-desk-hidden { display: table-row !important; width: auto !important; overflow: visible !important; float: none !important; max-height: inherit !important; line-height: inherit !important } .es-desk-menu-hidden { display: table-cell !important } table.es-table-not-adapt, .esd-block-html table { width: auto !important } table.es-social { display: inline-block !important } table.es-social td { display: inline-block !important } } #outlook a { padding: 0; } .ExternalClass { width: 100%; } .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; } .es-button { mso-style-priority: 100 !important; text-decoration: none !important; } a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; } .es-desk-hidden { display: none; float: left; overflow: hidden; width: 0; max-height: 0; line-height: 0; mso-hide: all; } </style> </head> <body style="width:100%;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0;"> <div class="es-wrapper-color" style="background-color:#F6F6F6;"><table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;"> <tbody><tr style="border-collapse:collapse;"> <td valign="top" style="padding:0;Margin:0;"> <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;"> <tbody><tr style="border-collapse:collapse;"> <td align="center" style="padding:0;Margin:0;"> <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;" width="600" cellspacing="0" cellpadding="0" align="center"> <tbody><tr style="border-collapse:collapse;"> <td align="left" style="Margin:0;padding-top:15px;padding-bottom:15px;padding-left:20px;padding-right:20px;"> </td> <td width="20"></td> </tr> </tbody></table> </td> </tr> </tbody></table> <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;"> <tbody><tr style="border-collapse:collapse;"> <td align="center" style="padding:0;Margin:0;"> <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center"> <tbody><tr style="border-collapse:collapse;"> <td style="padding:0;Margin:0;padding-top:25px;background-color:#EE2735;" bgcolor="#ee2735" align="left"> <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> <tbody><tr style="border-collapse:collapse;"> <td width="600" valign="top" align="center" style="padding:0;Margin:0;"> <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> <tbody><tr style="border-collapse:collapse;"> <td align="center" style="padding:0;Margin:0;padding-left:20px;padding-right:20px;padding-bottom:25px;font-size:0px;"></td> </tr> </tbody></table> </td> </tr> </tbody></table> </td> </tr> <tr> <td bgcolor="#ffffff" style="padding: 40px 30px 40px 30px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%"> <tbody> <tr> <p style="font-size: 16px;"> <b>Dear ${data.name
    //     },</b> </p> </tr> <tr> <h3><b>You are Successfully Registered with LAKSHMI FUND.</b></h3> Please find your login information below. <br> <br> ROI-ID : ${data.roiId
    //     } <br><br> Password: ${data.password}<br><br>Phone No : ${data.phoneNumber
    //     }<br> <br><br><br> <br> Thank you, <br> <br> Lakshmi Fund Team <br> </tr> </tbody> </table> </td> </tr> </td> </tr> </tbody></table> </td> </tr> </tbody></table><table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top;"> <tbody><tr style="border-collapse:collapse;"> <td align="center" style="padding:0;Margin:0;"> <table class="es-footer-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#9AAEA6;" width="600" cellspacing="0" cellpadding="0" bgcolor="#9aaea6" align="center"> <tbody><tr style="border-collapse:collapse;"> <td style="padding:0;Margin:0;background-color:#F6F6F6;" bgcolor="#f6f6f6" align="left"> <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> <tbody><tr style="border-collapse:collapse;"> <td width="600" valign="top" align="center" style="padding:0;Margin:0;"> <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;"> <tbody><tr style="border-collapse:collapse;"> <td align="center" style="Margin:0;padding-bottom:5px;padding-left:20px;padding-right:20px;padding-top:25px;font-size:0px;"></td> </tr> <tr style="border-collapse:collapse;"> <td esdev-links-color="#666666" align="center" class="es-m-txt-с" style="padding:0;Margin:0;padding-top:10px;padding-bottom:20px;"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:12px;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:18px;color:#666666;"> Copyright © ${new Date().getFullYear()} LAKSHMI FUND, All Rights Reserved.</p></td> </tr> </tbody></table> </td> </tr> </tbody></table> </td> </tr> </tbody></table> </td> </tr> </tbody></table> </td> </tr> </tbody></table> </div> </body></html>`,
    // };

    // transporter.sendMail(mailOptions, function (error, info) {
    //   if (error) {
    //     console.log("error aa gyi", error);
    //     return false;
    //   } else {
    //     console.log("Email sent: " + info.response);
    //     return true;
    //   }
    // });
  },
  //to send sms
  sendSms: async (data) => {
    // let options = {
    //   authorization: smsapikey,
    //   // sender_id:"BMMS",
    //   message:`Registration Successful with B.M.M. SCHOOL.Your BMMS-ID: ${data.userId}.\nPassword: ${data.password}`,
    //   numbers: [data.phoneNumber],
    // };
    // console.log("options", options)

    // function capitalize(sentance){
    //   sentance = sentance.replace(/ +(?= )/g,'')
    //   if(sentance.length===0) return ""
  
    //   const words = sentance.split(" ");
    //   const capitalizeWord = words.map((word) => { 
    //     if(word.trim().length>0) return word[0].toUpperCase() + word.substring(1).toLowerCase(); 
        
    //   }).join(" ");
    //   return capitalizeWord
    // }

    // function limitString (string = '', limit = 0) {  
    //   return string.substring(0, limit)
    // }
    // const capitalizeName= capitalize(data.fullName)

    // const name = limitString(capitalizeName, 27)

    // let options2 = {
    //   authorization: smsapikey,
    //   // route : "p", // p for promational // q for quick 3.50 
    //   // sender_id:"BMMS",
    //   message:`Welcome to BMM SCHOOL ${name}.Click here http://bmmschool.in`,
    //   numbers: [data.phoneNumber],
    // };


    const randomSixDigitNumber = Math.floor(100000 + Math.random() * 900000);
    try {
      const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
        "route" : "otp",
        "variables_values" : `${randomSixDigitNumber}`,
        "numbers" : data.phoneNumber,
      }, {
        headers: {
          'Authorization': `${smsapikey}`, 
          'Content-Type': 'application/json'
        }
      });
  
      console.log('SMS sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending SMS:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  //to genearte new password
  randomPassword: (number = 8) => {
    const chars = ["0123456789"];
    return [number]
      .map((len, i) => {
        return Array(len)
          .fill(chars[i])
          .map((x) => {
            return x[Math.floor(Math.random() * x.length)];
          })
          .join("");
      })
      .concat()
      .join("")
      .split("")
      .sort(() => {
        return 0.5 - Math.random();
      });
  },

  //to genrate new roi

  newUserIdGen: async () => {
    const generateId = () => {
      let id = Math.floor(Math.random() * 900000) + 100000; // Generate a 6-digit number (from 100000 to 999999)
      return id.toString();
    };
  
    let newUserId = generateId();
  
    while (true) {
      const sameRoiId = await userModel.findOne({ "userInfo.userId": newUserId });
      if (sameRoiId) {
        newUserId = generateId(); // Regenerate if ID already exists
      } else {
        break;
      }
    }
    return newUserId;
  },

  encryptAES : (text) => {
    return CryptoJS.AES.encrypt(text, SECRET_MSG).toString();
  },


  decryptAES : (encryptedBase64) => {
    console.log('decryptAES', encryptedBase64)
    const decrypted = CryptoJS.AES.decrypt(encryptedBase64, SECRET_MSG);
    if (decrypted) {
        try {
            console.log(decrypted);
            const str = decrypted.toString(CryptoJS.enc.Utf8);
            if (str.length > 0) {
                return str;
            } else {
                return encryptedBase64;
            }
        } catch (e) {
            return encryptedBase64;
        }
    }
    return encryptedBase64;
  },

  passwordEncryptAES : (text) => {
    return CryptoJS.AES.encrypt(text, SECRET_MSG_PASSWORD).toString();
  },
  passwordDecryptAES : (encryptedBase64) => {
    const decrypted = CryptoJS.AES.decrypt(encryptedBase64, SECRET_MSG_PASSWORD);
    if (decrypted) {
        try {
            const str = decrypted.toString(CryptoJS.enc.Utf8);
            if (str.length > 0) {
                return str;
            } else {
                return encryptedBase64;
            }
        } catch (e) {
            return encryptedBase64;
        }
    }
    return encryptedBase64;
  },
  newInvoiceIdGenrate: async()=>{
    const currentYear = (Number(moment.tz(Date.now(), "Asia/Kolkata").format('YY')))
    let lastInvoice =  await invoiceModel.findOne({},{invoiceId:1, _id:0}).sort({_id:-1})
    const lastInvoiceIdYear= (lastInvoice && lastInvoice.invoiceId)? lastInvoice.invoiceId.substring(0, 2): currentYear
    const invoiceGenNumber =  (parseInt(lastInvoiceIdYear) === currentYear && lastInvoice && lastInvoice.invoiceId)? parseInt(lastInvoice.invoiceId.substring(2)):0
    const newInvoiceId = currentYear + (invoiceGenNumber+1).toString().padStart(5, '0')

    return newInvoiceId
  }, 
  currentSession :()=> {
    const currentYear = Number(moment.tz(Date.now(), "Asia/Kolkata").format('YYYY'))
    const currentMonth= Number(moment.tz(Date.now(), "Asia/Kolkata").format('MM'))
    let session=''
    if(currentMonth>=4){
        session = `${(currentYear).toString()}-${(currentYear+1).toString().substring(2)}`
    }else{
        session = `${(currentYear-1).toString()}-${(currentYear).toString().substring(2)}`
    }
    //console.log("session", session)
    return session
  },

 
  previousSession : () => {
    const currentYear = Number(moment.tz(Date.now(), "Asia/Kolkata").format('YYYY'));
    const currentMonth = Number(moment.tz(Date.now(), "Asia/Kolkata").format('MM'));
    let previousSession = '';
    if (currentMonth >= 4) { 
        previousSession = `${(currentYear - 1).toString()}-${currentYear.toString().substring(2)}`;
    } else { 
        previousSession = `${(currentYear - 2).toString()}-${(currentYear - 1).toString().substring(2)}`;
    }
    return previousSession
  },


  getAdmissionSession:(admmissionDate)=>{
    const currentDate= new Date(admmissionDate)
    const currentYear = Number(moment.tz(currentDate, "Asia/Kolkata").format('YYYY'))
    const currentMonth= Number(moment.tz(currentDate, "Asia/Kolkata").format('MM'))
    let session=''
    if(currentMonth>=4){
        session = `${(currentYear).toString()}-${(currentYear+1).toString().substring(2)}`
    }else{
        session = `${(currentYear-1).toString()}-${(currentYear).toString().substring(2)}`
    }
    //console.log("session", session)
    return session
  },
  whatsAppMessage:async ( sendNumber, message , templateType, data)=>{
    console.log("sendNumbersendNumbersendNumber===>", sendNumber)
    // 8930991910
    let toNumber= sendNumber
    console.log("toNumber>>>>>>>>>", toNumber)

    console.log("11111111111111", templateType)
      let WAMessageData={}
        if(templateType ){
          if(templateType==='registration'){
            WAMessageData={
                 "messaging_product": "whatsapp", 
                  "to": `91${toNumber}`, 
                  "recipient_type": "individual",
                  "type": "template", 
                  "template": {
                      "name": "registration", 
                      "language": {
                        "code": "en" 
                      },
                      "components": [
                        {
                            "type" : "body",
                            "parameters": [
                                {
                                    "type": "text",
                                    "text": data.name
                                },
                                {
                                    "type": "text",
                                    "text": data.class
                                },
                                {
                                  "type": "text",
                                  "text": data.userId
                                },
                                {
                                    "type": "text",
                                    "text": data.password
                                }
                        ]
                      }
                    ] 
                  } 
            }
          }

          if(templateType==='sharePassword'){
            WAMessageData={
                 "messaging_product": "whatsapp", 
                 "recipient_type": "individual",
                  "to": `91${toNumber}`, 
                  "type": "template", 
                  "template": {
                      "name": "sharepassword", 
                      "language": {
                        "code": "en" 
                      },
                      "components": [
                        {
                            "type" : "body",
                            "parameters": [
                                {
                                    "type": "text",
                                    "text": data.userId
                                },
                                {
                                    "type": "text",
                                    "text": data.password
                                }
                        ]
                      }
                    ]  
                  } 
            }
          }
          if(templateType ==='general'){
            WAMessageData={
              "messaging_product": "whatsapp", 
              "recipient_type": "individual",
               "to": `91${toNumber}`, 
               "type": "template", 
               "template": {
                   "name": "general ", 
                   "language": {
                     "code": "hi" 
                   },
                   "components": [
                     {
                         "type" : "body",
                         "parameters": [
                             {
                                 "type": "text",
                                 "text": `${data.title}`
                             },
                             {
                                 "type": "text",
                                 "text": `${data.message}`
                             }
                     ]
                   }
                 ]  
               } 
         }
            // WAMessageData={
            //   "messaging_product": "whatsapp",
            //   "recipient_type": "individual",
            //   "to": `91${toNumber}`,
            //   "type": "text",
            //   "text": {
            //     "body": `${message}`
            //   }
            // }
          }
          if(templateType ==='test'){
            WAMessageData={
              "messaging_product": "whatsapp", 
              "to": `91${toNumber}`, 
              "type": "template", 
              "template": { 
                "name": "hello_world", 
                "language": { 
                  "code": "en_US" 
                } 
              } 
            }
          }
          if(templateType ==='notification'){
            //This message from BM Memorial School
            // {{1}} Notification
            // =====================
            // Details:{{2}}
            // Date:{{3}}
            WAMessageData={
              "messaging_product": "whatsapp", 
              "to": `91${toNumber}`, 
              "type": "template",
              "template": { 
                "name": "notification", 
                "language": { 
                  "code": "en" 
                },
                "components": [
                  {
                      "type" : "body",
                      "parameters": [
                          {
                              "type": "text",
                              "text": `${data.title}`
                          },
                          {
                              "type": "text",
                              "text": `${data.details}`
                          },
                          {
                            "type": "text",
                            "text": `${data.date}`
                        }
                  ]
                }
              ]  
              } 
            }
          }  
        }else{
            return false
        }
      try {
          const response = await axios.post(
              `${whatsappApiUrl}`,
              {
                  ...WAMessageData
              },
              {
                  headers: {
                      Authorization: `Bearer ${whatsappApiToken}`,
                      'Content-Type': 'application/json',
                  },
              }
          );
          console.log("sucess555555555555555555", response.data)
          const newMessageInfo= new messageModel({
            templateType: templateType,
            recipientType: 'individual',
            messageId:generateUniqueId(),
            userId: data.userId?data.userId :'N/A',
            sendMessageFor:data.sendMessageFor,
            messageData:{
                success: true,
                detail:response.data
            },
          })
           await newMessageInfo.save();
           const isAccepted = response.data.messages.some(message => message.message_status === 'accepted');
            if (isAccepted) {
              return true
              //console.log(true);
            } else {
              return false
              //console.log(false);
            }
      } catch (error) {
        console.log("error44444444444444444444", error.response ? error.response.data : error.message)
        const newMessageInfo= new messageModel({
          templateType: templateType,
          recipientType: 'individual',
          messageId:generateUniqueId(),
          sendMessageFor:data.sendMessageFor,
          userId: data.userId?data.userId :'N/A',
          messageData:{
              success: false,
              error:error.response ? error.response.data : error.message
          }
        })
         await newMessageInfo.save();
         return false
      }
  },


  // notificationSend : async () => {
 
  //     try {
  //      const client = new OneSignal.Client('1ad13ded-ebe0-4bdc-b8c3-23a02796e880', 'M2YxNDExOGMtNDFhNS00M2MzLTg5NTgtMWM2OTgzNjRmODU5');
  //      //const response = await client.viewDevices({ limit: 200, offset: 0 });
  //      //console.log(response.body);
  //         const notification = {
  //           contents: {
  //             'tr': 'Yeni bildirim',
  //             'en': 'New notification',
  //           },
  //           //included_segments: ['Subscribed Users'],
  //           include_player_ids:[],
  //           // filters: [
  //           //   { field: 'tag', key: 'level', relation: '>', value: 10 }
  //           // ]
  //         };
         
  //         try {
  //           const response = await client.createNotification(notification);
  //           console.log("response notify",response);
  //         } catch (e) {
  //           if (e instanceof OneSignal.HTTPError) {
  //             // When status code of HTTP response is not 2xx, HTTPError is thrown.
  //             console.log(e.statusCode);
  //             console.log(e.body);
  //           }
  //         }
  //       } catch (e) {
  //         console.log(e)
  //           return e;
  //       }
    
  // },
  s3upload: async(userId,fileName, file)=>{
    // const Bucket="cyclic-fine-rose-fly-sari-ap-northeast-2"
    // const AWS_REGION="ap-northeast-2"
    // const AWS_ACCESS_KEY_ID=""
    // const AWS_SECRET_ACCESS_KEY=""
    // const AWS_SESSION_TOKEN=""

//  AWS_REGION="ap-south-1"
// export AWS_ACCESS_KEY_ID=""
// export AWS_SECRET_ACCESS_KEY=""
// export AWS_SESSION_TOKEN="I"
    // const AWS_REGION=process.env.AWS_REGION
    // const AWS_ACCESS_KEY_ID=process.env.AWS_ACCESS_KEY_ID
    // const AWS_SECRET_ACCESS_KEY=process.env.AWS_SECRET_ACCESS_KEY
    //   await s3.putObject({
    //     Body: JSON.stringify({key:"value"}),
    //     Bucket: "cyclic-plum-clear-caridea-ap-south-1",
    //     Key: "some_files/my_file.json",
    // }).promise()
    //console.log("AWS_REGION", AWS_REGION,"AWS_ACCESS_KEY_ID", AWS_ACCESS_KEY_ID,"AWS_SECRET_ACCESS_KEY", AWS_SECRET_ACCESS_KEY)

    // awsSdk.config.update({region: AWS_REGION});
    // const s3 = new awsSdk.S3({
    //     apiVersion: '2006-03-01',
    //     accessKeyId: AWS_ACCESS_KEY_ID,
    //     secretAccessKey: AWS_SECRET_ACCESS_KEY
    // });
    //  const dddd=   await s3.putObject({
    //     Body: file.data,
    //     Bucket: "cyclic-fine-rose-fly-sari-ap-northeast-2",
    //     Key:fileName,
    // })
    // console.log("dddddddddd", dddd.response)

    // var bucketParams = {
    //     Bucket: userId.toString(),
    //     ACL: 'private'
    // };

    // s3.createBucket(bucketParams, async function (err, data) {
    //     if (err) {
    //         console.log("Error-1", err);
    //     } else {
    //         var uploadParams = {
    //             Bucket: userId,
    //             Key: fileName,
    //             Body: file
    //         };

    //         //console.log('uploadParams', uploadParams)

    //         // s3.upload(uploadParams, function (err, data) {
    //         //     if (err) {
    //         //         console.log("Error", err);
    //         //     }
    //         //     if (data) {
    //         //         console.log("Upload Success", data.Location);
    //         //     }
    //         // });

    //     }
    // });

  },


  sendDailyBackupEmailCron:async()=>{ 
    console.log('Before job instantiation');
    const job = new CronJob('0 */1 * * * *', async function() {
      const d = new Date();
      console.log('Every Tenth Minute:', d);
      let today = new Date(todayIndiaDate);
      let dd = String(today.getDate()).padStart(2, '0');
      let mm = String(today.getMonth() + 1).padStart(2, '0'); 
      let yyyy = today.getFullYear();
      today = dd + '/' + mm + '/' + yyyy;
      console.log("todaytoday", today)
      const userData = await roleModel.find()
      const userData2 = await roleModel.find()
      const text= JSON.stringify(userData)
      const text2= JSON.stringify(userData2)
  
      zip.file("user.json", text);
      zip.file("user2.json", text2);
      const buffer = await zip.generateAsync({ type: `nodebuffer` })
  
      async function main() {
        const info = await transporter.sendMail({
          from: `"Daily Backup ${today}"   <info@bmmschool.in>`, // sender address
          to: "hkc.kumar@gmail.com, bmmsbkg@gmail.com",//"bmmsbkg@gmail.com", // list of receivers
          subject: `Daily Backup ${today}`, // Subject line
          text: "Find atachment", // plain text body
          html: "<b>BM Memorial School</b>", // html body
          attachments: [
            {   
              filename: `Daily_${today}.zip`,
              content:  buffer
            },
          ],
        });
        //console.log("hhhhhhhhhhhhhhhhhh",JSON.stringify(info, null, 2))
        if(info.accepted){
          console.log("Daily Backup Mail send.")
  
        }else{
          console.log("Daily Backup Mail not send.")
  
        }
      
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
        
      }
      
      main().catch(
        console.error
        );
    },
    null,
    true,
    // 'America/Los_Angeles'
    );
    console.log('After job instantiation');
    job.start();
  },



};

const moment = require("moment-timezone");
const admin = require('firebase-admin');
const multer = require('multer');
const fast2sms = require("fast-two-sms");
const mongoose = require("mongoose");
// const {mongodb, ObjectId} = require("mongodb");
const crypto = require('crypto');
const sha256 = require("sha256");
const uniqid = require("uniqid")
// const MongoClient = mongodb.MongoClient;
const URL = process.env.MONGO_LOCAL_CONN_URL;
const { userModel } = require("../../models/user");
const { examModel } = require("../../models/exam");
const {roleModel} = require("../../models/role")
const { cronjobModel } = require("../../models/cronjob");
const { FundingSource } = require("../../models/fundingSource");
const { AuthToken } = require("../../models/authtoken");
const cloudinary = require("cloudinary").v2;
const { ocrSpace } = require('ocr-space-api-wrapper');
const { passwordEncryptAES, newUserIdGen, newInvoiceIdGenrate, sendDailyBackupEmail, encryptAES, getAdmissionSession, passwordDecryptAES, whatsAppMessage, previousSession, uploadImageFireBase, getAadharNumber, removeDocFireBase, getCurrentSession, redisFlusCall, redisDeleteCall, redisSetKeyCall, generateUniqueIdWithTime, getRankedResult} = require('../../util/helper')
const {
  getAllActiveRoi,
  withDrawalBalance,
  
} = require("../../util/income");
const {getRedisClient}= require('../../util/redisDB')
const { resultModel } = require("../../models/result");
const { resultEntryPerModel } = require("../../models/resutlEntryPer");
const {examDateAndSubModel}=require("../../models/examDateAndSub");
const { blogModel } = require("../../models/blog");
const {vehicleModel}=require("../../models/vehicle");
const {vehicleRouteFareModel}=require("../../models/vehicleRouteFare");
const {monthlyFeeListModel}=require("../../models/monthlyFeeList");
const {paymentModel}=require("../../models/payment");
const {invoiceModel}=require("../../models/invoice ");
const {messageModel} = require('../../models/message')
const fastcsv = require("fast-csv");
const fs = require("fs");
const {payOptionModel}=require("../../models/payOption");
let slugify = require('slugify')
const axios = require('axios');
const user=require("./user");
const myCache=require("../..");
const { userInfo } = require("os");



const authorization = process.env.SMS_API;
const UPLOAD_IMAGE_URL = process.env.UPLOAD_IMAGE_URL
const OCR_API_KEY= process.env.OCR_SPACE_IMAGE_TO_TEXT_API_KEY
const { PHONEPE_MERCHANT_ID, PHONEPE_MERCHANT_KEY, PHONEPE_MERCHANT_SALT, PHONEPE_CALLBACK_URL } = process.env;
const HalfYearlyMonthIndex = 6
const AnualExamMonthIndex = 12

// const storage = multer.memoryStorage(); // Store uploaded files in memory temporarily
// const upload = multer({ storage });

const generateHash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};
const classList=["1 A","1 B","2 A","2 B","3 A","3 B","4 A","4 B","5 A","5 B","6 A","6 B","7 A","7 B","8 A","9 A","10 A","UKG A","UKG B","LKG A","LKG B","NUR A","NUR B","PRE NUR A", "PRE NUR B"]
const examList =['UNIT TEST-I', 'UNIT TEST-II', 'HALF YEARLY EXAM', 'ANNUAL EXAM']
const yearList =['2022-23', '2023-24', '2024-25', '2025-26']
const subjectList =['HINDI', 'ENGLISH', 'MATH','SCIENCE','SST','COMPUTER','COMP PRACT','HINDI NOTES','ENGLISH NOTES','MATH NOTES','SCIENCE NOTES','SST NOTES','HINDI SUB ENRICH','ENGLISH SUB ENRICH','MATH SUB ENRICH','SCIENCE SUB ENRICH','SST SUB ENRICH','HINDI RHYMES','ENGLISH RHYMES','DRAWING','GK MV','ATTENDANCE']
const monthList =  ["april", "may", "june", "july", "august", "september", "october", "november", "december","january", "february", "march"] 
const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const performanceList= [
  {grade:'A1', performance:'Outstanding'},
  {grade:'A2', performance:'Excellent'},
  {grade:'B1', performance:'Very Good'},
  {grade:'B2', performance:'Good'},
  {grade:'C1', performance:'Above Average'},
  {grade:'C2', performance:'Average'},
  {grade:'D',  performance:'Pass'},
  {grade:'E',  performance:'Fail'},
]
const getGrade=(score)=>{
  if(score > 100 || score < 0) return "INVALID SCORE";
  if(score >=91) {
    return "A1"
  }else if(score >=81) {
    return "A2"
  }else if(score >=71) {
    return "B1"
  }else if(score >=61) {
    return "B2"
  }else if(score >=51) {
    return "C1"
  }else if(score >=41) {
    return "C2"
  }else if(score >=33) {
    return "D"
  }else{
    return "E"
  }
 }

const getPerformance =(grade)=>{
  
  const performanceObj = performanceList.find( data => data.grade === grade)
  if(performanceObj){
    return performanceObj.performance
  }else{
    return 'Invalid'
  }
}
const percentageMarks= (getTotal, fullMarks)=>{
  return ((Number(getTotal)*100)/Number(fullMarks)).toFixed(2)
}

checkAdmissionDate=(user, columnMonth, session)=>{
  let pay=true
  if(user.created){
    let columnMonthIndex=  monthNames.indexOf(columnMonth.toLowerCase())
    if(user.userInfo.admissionDate){
        const admissionDate = new Date(user.userInfo.admissionDate)
        //console.log("admissionDateadmissionDate",admissionDate)
        const admissionDay = admissionDate.getDate()
        //console.log("admissionDay",admissionDay) 
        const admissionYear = admissionDate.getFullYear()
        const admissionMonthIndex = admissionDate.getMonth()
        let admissionSession=''
        if(admissionMonthIndex>=3){
          admissionSession = `${(admissionYear).toString()}-${(admissionYear+1).toString().substring(2)}`
        }else if(admissionMonthIndex<3 ){
          admissionSession = `${(admissionYear-1).toString()}-${(admissionYear).toString().substring(2)}`
        }
        if(columnMonthIndex>=3 && session===admissionSession && (admissionMonthIndex>columnMonthIndex || (admissionMonthIndex===columnMonthIndex && admissionDay>=21 || (admissionMonthIndex<3 && admissionMonthIndex<columnMonthIndex )) )){
          pay= false
        
        }else if(columnMonthIndex<3 && admissionMonthIndex<3 && session ===admissionSession && (admissionMonthIndex>columnMonthIndex || (admissionMonthIndex===columnMonthIndex && admissionDay>=21))){
          pay= false
        }
    }
  }
  return pay

}
                    //(Sdata, userPayDetail, monthlyFeeList, busRouteFareList, session)
const getMonthPayData=(sData, userPayDetail, monthlyFeeList, busRouteFareList, session )=>{
  let busFee= 0
  let monthlyFee=0
  if(userPayDetail.busService && busRouteFareList.length>0){
    const busFeeData= busRouteFareList.find(busData => busData.busRouteId === userPayDetail?.busRouteId)
    busFee = (busFeeData && busFeeData.fare)? busFeeData.fare:0
  }
  if(monthlyFeeList.length>0  && userPayDetail.feeFree !=true){
    //console.log("userPayDetail.class",userPayDetail.class)
    const monthlyFeeData = monthlyFeeList.find(data => data.className === userPayDetail.class)
    monthlyFee = monthlyFeeData && monthlyFeeData.monthlyFee ? monthlyFeeData.monthlyFee :0
  }
  let monthPayData={}
  for (const month of monthList) {
    let monthData={}
    const monthEnable =  checkAdmissionDate(sData, month, session)
      if(monthEnable && (userPayDetail.feeFree != true || userPayDetail.busService === true)){
        monthData['monthlyFee']= userPayDetail.feeFree === true ? 0: monthlyFee
        monthData['busFee']= userPayDetail.busService === true ? busFee:0
        monthData['payEnable']= true
        monthData['paidDone']= userPayDetail && userPayDetail[month]? true: false
        monthData['amt'] = userPayDetail && userPayDetail[month] ? (parseInt(userPayDetail[month].monthlyFee) + parseInt(userPayDetail[month].busFee)):"000"
      }else{  
        monthData['payEnable']= false
      }
      monthPayData[month]= monthData
  }
  return monthPayData
}

function encryptObj(objecData){
  objecData.userInfo.roleName= encryptAES(objecData.userInfo.roleName)
  objecData.userInfo.roleId= encryptAES(objecData.userInfo.roleId)
  objecData.userInfo.phoneNumber1= encryptAES(objecData.userInfo.phoneNumber1)
  objecData.userInfo.phoneNumber2= encryptAES(objecData.userInfo.phoneNumber2)
  objecData.userInfo.aadharNumber= encryptAES(objecData.userInfo.aadharNumber)
  objecData.userInfo.userId= encryptAES(objecData.userInfo.userId)
  objecData.userInfo.fullName= encryptAES(objecData.userInfo.fullName)
  //delete objecData.userInfo.isPaymentReciever

  return objecData
}

// Helper function to add exam fees
const addExamFees = (feeData, isAnnualExamFeeNotPaid, isHalfExamFeeNotPaid) => {
  let dueAmt=0
  if (isAnnualExamFeeNotPaid) {
      dueAmt += feeData && feeData.annualExamFee ? Number(feeData.annualExamFee) : 0;
  }
  if (isHalfExamFeeNotPaid) {
      dueAmt += feeData && feeData.halfExamFee ? Number(feeData.halfExamFee) : 0;
  }
  return dueAmt;
};

// Helper function to determine if the admission date falls within a specific session
const isAdmissionInCurrentSession = (admissionSession, previousSession) => admissionSession === previousSession;


const activeParam = {$and:[{deleted:false},{isApproved:true}, {isActive:true}]}


module.exports = {
  getAllUsers: async (req, res) => {
    try {
      const searchStr= req.body.searchStr
      let searchParam={}
      let classParam={}
      let roleParam={}
       if (searchStr && searchStr !== "" && searchStr !== undefined && searchStr !== null){
         searchParam={
          $or:[
            {'userInfo.roleName': new RegExp(searchStr, 'i')},
            {'userInfo.fullName': new RegExp(searchStr, 'i')},
            {'userInfo.fatherName': new RegExp(searchStr, 'i')},
            {'userInfo.motherName': new RegExp(searchStr, 'i')},
            {'userInfo.email': new RegExp(searchStr, 'i')},
            {'userInfo.phoneNumber1': new RegExp(searchStr, 'i')},
            {'userInfo.phoneNumber2': new RegExp(searchStr, 'i')},
            {'userInfo.aadharNumber':new RegExp(searchStr, 'i')},
            {'userInfo.userId':new RegExp(searchStr, 'i')}
          ]
        }
      }
      if(req.body.selectedClass){
          classParam={'userInfo.class':req.body.selectedClass}
      }

      if(req.body.selectedRole){
        roleParam={'userInfo.roleName':req.body.selectedRole}
      }

      if(req.body.studentId){
        searchParam={'_id':req.body.studentId}
      }
      let query = {
        $and: [ { deleted: false },searchParam,classParam,roleParam]
      }

      //console.log("gggggggggggggghhhhhhhhhhhhhhhh", JSON.stringify(query))
      const users = await userModel.find(query);
      if(users && users.length>0){


        // if (req.body.selectedClass) {
        //   for (const it of users) {
        //     if (it.userInfo && it.userInfo.busService && it.userInfo.busRouteId && it.userInfo.userId) {
        //     const data =  await paymentModel.updateMany(
        //         { userId: it.userInfo.userId },
        //         { busRouteId: it.userInfo.busRouteId }
        //       );
        //     console.log("data===============>", data)
        //     }
        //   }
        // }

        return res.status(200).json({
          success: true,
          message: 'Successfully get all users.',
          users,
        });
      }else{
        return res.status(200).json({
          success: false,
          message: 'Users not found.',
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
  getAllStudents: async (req, res) => {
    try {
      const CURRENTSESSION = getCurrentSession()
      const searchStr= req.body.searchStr
      let studentAprroveParam =  {$and:[{deleted:false},{isApproved:true}]}
      let searchParam={}
      let classParam={}
      let filterOptionParam={}
      let dataFilterParam={}
      let studentById={}
      let sortingOption={'created':'desc'}
       if (searchStr && searchStr !== "" && searchStr !== undefined && searchStr !== null){
         searchParam={
          $or:[
            {'userInfo.fullName': new RegExp(searchStr, 'i')},
            {'userInfo.fatherName': new RegExp(searchStr, 'i')},
            {'userInfo.motherName': new RegExp(searchStr, 'i')},
            {'userInfo.email': new RegExp(searchStr, 'i')},
            {'userInfo.phoneNumber': new RegExp(searchStr, 'i')},
            {'userInfo.phoneNumber1': new RegExp(searchStr, 'i')},
            {'userInfo.phoneNumber2': new RegExp(searchStr, 'i')},
            {'userInfo.aadharNumber':new RegExp(searchStr, 'i')},
            {'userInfo.userId':new RegExp(searchStr, 'i')}
          ]
        }
      }
      if(req.body.role==='TEACHER'){
        dataFilterParam={
          'userInfo.phoneNumber': 0,
          'userInfo.phoneNumber1': 0,
          'userInfo.phoneNumber2': 0,  
          'userInfo.aadharNumber': 0,
        }
        sortingOption={
          created: 1
        }
        studentAprroveParam={$and:[{deleted:false},{isApproved:true},{isActive:true}]}
      }

      if(req.body.selectedClass){
        classParam={'userInfo.class':req.body.selectedClass}
      }
      if(req.body.filterOption && req.body.docFilter===true){
        const filterKey= [`document.${req.body.filterOption}`]
        filterOptionParam={
          $or: [
            { [filterKey]: { $exists: false } },  // Field does not exist
            { [filterKey]: "" }  // Field is an empty string
          ]
        }
      }else if(req.body.filterOption && req.body.docFilter===false){
        if(req.body.filterOption==='No Mobile Number'){
          filterOptionParam={$or:[{'userInfo.phoneNumber1':{$in:['','0000000001', '0000000000','1234567890']}}]}
        }
        if(req.body.filterOption==='No Aadhar'){
          filterOptionParam={'userInfo.aadharNumber':''}
        }
        if(req.body.filterOption==='Deactive'){
          studentAprroveParam={$and:[{deleted:false},{isApproved:true},{isActive:false}]}
        }
        if(req.body.filterOption==='Free Students'){
          studentAprroveParam={$and:[{'userInfo.feeFree':true}]}
        }
        if(req.body.filterOption==='Bus Students'){
          if(req.body.selectedRouteId){
            studentAprroveParam={$and:[{'userInfo.busService':true},{'userInfo.busRouteId':req.body.selectedRouteId}]}
          }else{
            studentAprroveParam={$and:[{'userInfo.busService':true}]}
          }
        }
      }
      if(req.body.studentId){
        studentById={'_id': req.body.studentId}
      }
      const condParam={
        $and: [
          studentAprroveParam,
          {
            'userInfo.roleName':'STUDENT'
          },
          searchParam,
          classParam,
          filterOptionParam,
          studentById,
          {'userInfo.session': CURRENTSESSION}
        ],
      }
      if(req.body.sortByClass){
        sortingOption={'userInfo.class':req.body.sortByClass}
      }
      //console.log("condParammmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm", JSON.stringify(condParam))
      const users = await userModel.find(condParam,dataFilterParam).sort(sortingOption);
    
      if(users && users.length>0){

 

  async function updateInvoiceClasses() {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const classList = ["4", "5", "6", "7", "8", "9", "10"];

      // const resultBanrches = classList.map(cls=>({
      //   case: {$eq: ["$class", cls]},
      //   then: `${cls} A`
      // })) 

      // await resultModel.updateMany(
      //   {"class": {$in: classList}},
      //   [
      //     {
      //       $set:{
      //         "class":{
      //           $switch:{
      //             branches: resultBanrches,
      //             default: "$class"
      //           }
      //         }
      //       }
      //     }
      //   ],
      //   {session}
      // )

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      console.log("Transaction committed successfully.");
    } catch (error) {
      // Abort transaction in case of error
      await session.abortTransaction();
      session.endSession();

      console.error("Transaction aborted due to error:", error);
    }
  }

  // Call the function
  //updateInvoiceClasses();


        const classList = ["5", "6", "7", "8", "9", "10"];

        const invoiceuBarches = classList.map(cls => ({
          case: { $eq: ["$invoiceInfo.class", cls] },
          then: `${cls} A`
        }));

        //**** invoice update */
        // await invoiceModel.updateMany(
        //   { "invoiceInfo.class": { $in: classList } },  // Match documents
        //   [
        //     { 
        //       $set: { 
        //         "invoiceInfo.class": { 
        //           $switch: {
        //             branches: invoiceuBarches,  // Apply case conditions
        //             default: "$invoiceInfo.class" // Keep unchanged if not in the list
        //           }
        //         }
        //       }
        //     }
        //   ]
        // );

           //**** users update */
        const userbranches = classList.map((cls)=>{
          return{
            case: {$eq:["$userInfo.class", cls]},
            then:`${cls} A`
          }
        })

        // await userModel.updateMany(
        //   {"userInfo.class": {$in:classList}},
        //   [
        //     {
        //       $set: {
        //         "userInfo.class":{
        //           $switch:{
        //             branches: userbranches,
        //             default:"$userInfo.class"
        //           }
        //         }
        //       }
        //     }
        //   ],
        //  {session}
        // )

        /***  payment update */

        const payBranches = classList.map(cls=>({
          case: {$eq: ["$class", cls]},
          then: `${cls} A`
        })) 

        // await paymentModel.updateMany(
        //   {"class": {$in: classList}},
        //   [
        //     {
        //       $set:{
        //         "class":{
        //           $switch:{
        //             branches: payBranches,
        //             default: "$class"
        //           }
        //         }
        //       }
        //     }
        //   ],
        //   {session}
        // )

        /*** monthlyfeelist update */

        const monthFeeBranches= classList.map(cls=>({
          case: {$eq:["$className", cls]},
          then: `${cls} A`
        }))

        // await monthlyFeeListModel.updateMany(
        //   {"className":{$in: classList}},
        //   [
        //     {
        //       $set:{
        //         "className":{
        //           $switch:{
        //             branches: monthFeeBranches,
        //             default: "$className"
        //           }
        //         }
        //       }
        //     }
        //   ],
        //   {session}
        // )

        /***  result update */

        const resultBanrches = classList.map(cls=>({
          case: {$eq: ["$class", cls]},
          then: `${cls} A`
        })) 

        // await resultModel.updateMany(
        //   {"class": {$in: classList}},
        //   [
        //     {
        //       $set:{
        //         "class":{
        //           $switch:{
        //             branches: resultBanrches,
        //             default: "$class"
        //           }
        //         }
        //       }
        //     }
        //   ],
        //   {session}
        // )

        /*** resultPer update */     
        // await resultEntryPerModel.updateMany(
        //   { "allowedList.class": { $in: classList } },  // Match documents with relevant class values
        //   [
        //     {
        //       $set: {
        //         "allowedList": {
        //           $map: {
        //             input: "$allowedList",
        //             as: "elem",
        //             in: {
        //               $mergeObjects: [
        //                 "$$elem",  // Preserve other fields
        //                 {
        //                   class: {
        //                     $cond: {
        //                       if: { $in: ["$$elem.class", classList] },  // Check if class is in list
        //                       then: { $concat: ["$$elem.class", " A"] },  // Append ' A'
        //                       else: "$$elem.class"  // Keep unchanged if not in classList
        //                     }
        //                   }
        //                 }
        //               ]
        //             }
        //           }
        //         }
        //       }
        //     }
        //   ],
        //   {session}
        // );

        //**** Update vehicleFare id all student  */
        async function updateVehicleFareIdForEachStudent() {
          try {
            // Fetch bus route records
            const busRoutes = await vehicleRouteFareModel.find({ session: '2024-25' })
              .select('_id busRouteId');
        
            if (!busRoutes.length) {
              console.log("No bus routes found for the session.");
              return;
            }
        
            // Create bulk update operations
            // const updateOperations = busRoutes.map(route => ({
            //   updateMany: {
            //     filter: { "userInfo.busRouteId": route._id.toString() }, // Filter by _id
            //     update: { $set: { "userInfo.busRouteId": route.busRouteId } } // Update with busRouteId
            //   }
            // }));
        
            // // Perform bulk update if there are any operations
            // if (updateOperations.length > 0) {
            //   await userModel.bulkWrite(updateOperations);
            // }
        
            console.log("Update operation completed successfully.");
          } catch (error) {
            console.error("Error occurred:", error);
          }
        }
        
        //updateVehicleFareIdForEachStudent()
        
        //**** get all file name and update */
        // const folderPath='/home/decipher/myproject/final images/otherphoto22'
        // const fileNames= await uploadPhotos(folderPath)
        // console.log("fileNames" ,fileNames.length)
        // for(const fileName of fileNames) {
        //   const userId = fileName.split("_")[1].split('.')[0]
        //   console.log("userId", userId)
        //   const user = await userModel.findOne({"userInfo.userId": userId})
        //     if (user.document &&  user.document.stPhoto){
        //         // Save the updated user in the database
        //        // await userModel.findOneAndUpdate({_id:user._id}, {"document.stPhoto": "" });
        //     }
        // }

      //  for (const it of users) {
        
        //await userModel.findOneAndUpdate({_id: it._id},{'userInfo.session':'2024-25'})
        // const stClass = it.userInfo.class
        //         // let newStClass=''
        //         // if(stClass =='10'){newStClass= '9'}else
        //         // if(stClass =='9') {newStClass= '8'}else
        //         // if(stClass =='8') {newStClass= '7'}else
        //         // if(stClass =='7') {newStClass= '6'}else
        //         // if(stClass =='6') {newStClass= '5'}else
        //         // if(stClass =='5') {newStClass= '4 A'}else
        //         // if(stClass =='4 A') {newStClass= '3 A'}else
        //         // if(stClass =='4 B') {newStClass= '3 B'}else
        //         // if(stClass =='3 A') {newStClass= '2 A'}else
        //         // if(stClass =='3 B') {newStClass= '2 B'}else
        //         // if(stClass =='2 A') {newStClass= '1 A'}else
        //         // if(stClass =='2 B') {newStClass= '1 B'}else
        //         // if(stClass =='1 A') {newStClass= 'UKG A'}else
        //         // if(stClass =='1 B') {newStClass= 'UKG B'}else
        //         // if(stClass =='UKG A') {newStClass= 'LKG A'}else
        //         // if(stClass =='UKG B') {newStClass= 'LKG B'}else
        //         // if(stClass =='LKG A') {newStClass= 'NUR A'}else
        //         // if(stClass =='LKG B') {newStClass= 'NUR B'}else
        //         // if(stClass =='NUR A') {newStClass= 'PRE NUR A'}else
        //         // if(stClass =='NUR B') {newStClass= 'PRE NUR B'}
                
        // const  payFound = await paymentModel.findOneAndUpdate({$and:[{userId: it.userInfo.userId},{session:'2024-25'}]},{class: it.userInfo.class})
        //    if(!payFound){
        //     const newPaymentData = paymentModel({
        //       userId:it.userInfo.userId,
        //       session:'2024-25',
        //       class:it.userInfo.class,
        //       dueAmount: 0,
        //       excessAmount:0,
        //       totalFineAmount:0
        //     })
        //     const  newPaymentDataCreated = await newPaymentData.save()

        //     console.log("newPaymentDataCreated", newPaymentDataCreated)
        //   }
        // }
        return res.status(200).json({
          success: true,
          message: 'Successfully get all students.',
          users,
        });
      }else{
        return res.status(200).json({
          success: false,
          message: 'Students not found.',
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
  getAllTeacherAndStaff: async (req, res) => {
    try {
      const searchStr= req.body.searchStr
      let searchParam={}
      let classParam={}
      let roleParam=   {$or:[{'userInfo.roleName':'TEACHER'},{'userInfo.roleName':'ACCOUNTANT'}]}
       if (searchStr && searchStr !== "" && searchStr !== undefined && searchStr !== null){
         searchParam={
          $or:[
            {'userInfo.roleName': new RegExp(searchStr, 'i')},
            {'userInfo.fullName': new RegExp(searchStr, 'i')},
            {'userInfo.fatherName': new RegExp(searchStr, 'i')},
            {'userInfo.motherName': new RegExp(searchStr, 'i')},
            {'userInfo.email': new RegExp(searchStr, 'i')},
            {'userInfo.phoneNumber1': new RegExp(searchStr, 'i')},
            {'userInfo.phoneNumber2': new RegExp(searchStr, 'i')},
            {'userInfo.aadharNumber':new RegExp(searchStr, 'i')},
            {'userInfo.userId':new RegExp(searchStr, 'i')}
          ]
        }
      }
   
      if(req.body.selectedClass){
          classParam={'userInfo.class':req.body.selectedClass}
      }

      const users = await userModel.find({
        $and: [ { deleted: false },searchParam,classParam,roleParam]
      });
      if(users && users.length>0){
        return res.status(200).json({
          success: true,
          message: 'Successfully get all teacher and staff',
          users,
        });
      }else{
        return res.status(200).json({
          success: false,
          message: "Teacher and staff not found.",
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
  deleteUser: async (req, res) => {
    try {
    const updatedUser=  await userModel.findOneAndUpdate({_id:req.params.id},{deleted: true, modified:new Date()});
     if(updatedUser){
      await paymentModel.updateMany({ 'userId': updatedUser.userInfo.userId },{ $set: { deleted: true, modified: new Date() } });
        return res.status(200).json({
          success: true,
          message: 'Deleted user successfully',
        });
      }else{
        return res.status(200).json({
          success: false,
          message: "Not deleted user.",
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
  rollNumberUpdate: async (req, res) => {
    try {
      // console.log("1222222", req.body.rollNumberData)
      for (const it of req.body.rollNumberData) {
        await userModel.findOneAndUpdate({'userInfo.userId': it.userId},{'rollNumber': it.rollNumber, modified:new Date()});
      }
      return res.status(200).json({
        success: true,
        message: 'Roll number updated successfully',
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },

  updateUserById: async (req, res) => {
    try {
      const CURRENTSESSION = getCurrentSession()
      const userData =  await userModel.findOne({_id:req.params.id});
      if(!userData){
        return res.status(200).json({
          success: false,
          message: "user not found.",
        });
      }
      if(req.body.roleUpdate){
          const newRoleName = req.body.newRoleName
          delete req.body.roleUpdate
          delete req.body.newRoleName
          const getNewRoleData = await roleModel.findOne({$and:[{roleName:newRoleName},{ roleName:{$nin:['TOPADMIN','ADMIN']}}]})
          if(!getNewRoleData){
            return res.status(200).json({
              success: false,
              message: "Role not found. Please choose correct role.",
            });
          }
          req.body.roleName = getNewRoleData.roleName
          req.body.roleId = getNewRoleData._id.toString()
          if(newRoleName!=='STUDENT'){
            await paymentModel.findOneAndDelete({'userId': userData.userInfo.userId})
          }
      }

      let user = JSON.parse(JSON.stringify(userData))
      if(req.body.student_document){
        user['document']={
          ...user['document'],
          ...req.body.student_document
        }
      }else if(req.body.passwordChange){
        user.userInfo.password= passwordEncryptAES(req.body.password)
      }else{
        user.userInfo={
          ...user.userInfo,
          ...req.body
        }
      }

      user.modified = new Date();

     const updatedUser= await userModel.findOneAndUpdate({_id:req.params.id}, user,{new:true});
      if(updatedUser && req.body.passwordChange){
        await AuthToken.deleteMany({ userId: user.userInfo.userId })
      }
      if(updatedUser){
        if(updatedUser.userInfo.roleName==='STUDENT'){
          const foundPayment = await paymentModel.findOne({$and:[{session:CURRENTSESSION},{'userId': updatedUser.userInfo.userId}]})
          if(!foundPayment){
            const newPaymentData = paymentModel({
              userId:updatedUser.userInfo.userId,
              session: CURRENTSESSION,
              class:updatedUser.userInfo.class,
              dueAmount: 0,
              excessAmount:0,
              totalFineAmount:0,
              feeFree: req.body.feeFree,
              busService: req.body.busService,
              busRouteId: req.body.busService ? updatedUser.userInfo.busRouteId : undefined,
              paymentLedgerPage: updatedUser.userInfo.paymentLedgerPage
            })
            const  newPaymentDataCreated = await newPaymentData.save()
          }else{
            const payData ={
              class: updatedUser.userInfo.class , 
              feeFree: req.body.feeFree, 
              busService: req.body.busService,
              busRouteId: req.body.busService ? updatedUser.userInfo.busRouteId : undefined, 
              paymentLedgerPage: updatedUser.userInfo.paymentLedgerPage
            }
            await paymentModel.findOneAndUpdate({$and:[{session:CURRENTSESSION},{'userId': updatedUser.userInfo.userId}]}, payData)
          
          }
            
          const RedisPaymentKey =`payment-${updatedUser.userInfo.class}-${updatedUser.userInfo.session}`
          redisDeleteCall({key:RedisPaymentKey})

        }
        return res.status(200).json({
          success: true,
          message: "Updated successfully.",
          data:updatedUser
        });
      }else{
        return res.status(200).json({
          success: false,
          message: "Not updated user.",
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

  updateStatus: async (req, res, next) => {
      try{
      const CURRENTSESSION = getCurrentSession()
      const userId = req.body.userId;
      
      const user= await userModel.findOne({ 'userInfo.userId': userId })
      if(!user){
        return res.status(200).json({
          success: false,
          message: "User not found."
        })
      }
      let datatoUpdate = JSON.parse(JSON.stringify(user))
      const recoverTrue= req.body.recover
      if(recoverTrue){
        datatoUpdate.isActive=true
        datatoUpdate.isApproved= true
        datatoUpdate.modified= new Date()
        datatoUpdate.deleted=false
        datatoUpdate.userInfo.session= CURRENTSESSION
      }else{
        if(req.body.task==='isApproved'){
            datatoUpdate.isApproved = req.body.isApproved
            datatoUpdate.modified = new Date()
        }
    
        if(req.body.task==='isActive'){
            datatoUpdate.isActive = req.body.isActive 
            datatoUpdate.modified = new Date()
        }
      }

       const response = await userModel.findOneAndUpdate({ 'userInfo.userId': userId},datatoUpdate,{$new:true})
        if(response) {
          if(datatoUpdate.isActive ===false || datatoUpdate.isApproved===false){
            await AuthToken.deleteMany({ userId: userId })
          }
          if(recoverTrue && response && response.userInfo.roleName==='STUDENT'){
            const foundPayment = await paymentModel.findOne({$and:[{session:response.userInfo.session},{'userId': response.userInfo.userId}]})
            if(!foundPayment){
              const newPaymentData = paymentModel({
                userId:response.userInfo.userId,
                session:response.userInfo.session,
                class:response.userInfo.class,
                busService: response.userInfo.busService,
                busRouteId: response.userInfo.busService? reponse.userInfo.busRouteId : undefined,
                dueAmount: 0,
                excessAmount:0,
                totalFineAmount:0
              })
              await newPaymentData.save()
              const RedisPaymentKey =`payment-${response.userInfo.class}-${response.userInfo.session}`
              redisDeleteCall({key:RedisPaymentKey})
            }
              await paymentModel.updateMany({'userId': response.userInfo.userId},{deleted: false, modified:new Date()})
              const paymentlList = await paymentModel.find({'userId': response.userInfo.userId})
              for (const it of paymentlList){
                const  RedisPaymentKey =`payment-${it.class}-${it.session}`
                redisDeleteCall({key:RedisPaymentKey})
              }
          }
          return res.status(200).json({
            success: true,
            message: "Update status successfully.",
          });
        }else{
          return res.status(200).json({
            success: false,
            message: "Status not updated",
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
  updatePaymentRecieverUser:  async (req, res, next) => {
    try{
        const response= await userModel.findOne({ 'userInfo.userId': req.body.userId })
        if(response){
            const role= response.userInfo.roleName
            if(role==='ADMIN' || role==='ACCOUNTANT'){
              response['isPaymentReciever'] = req.body.status
              response.modified = new Date()
              response.save()
              return res.status(200).json({
                success: true,
                message: "Update status successfully.",
              });
            }else{
              return res.status(200).json({
                success: false,
                message: "Can't update as payment reciever. Contact to Admin"
              })
            }
          }else{
            return res.status(200).json({
              success: false,
              message: "User not found"
            })
          }  
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  },
  getPaymentRecieverUser: async (req, res) => {
    try {
      let allPaymentRecieverUser = await userModel.find({$and:[{'userInfo.roleName':{$in:['ADMIN','ACCOUNTANT']}},{isPaymentReciever:true}]})
      if(allPaymentRecieverUser && allPaymentRecieverUser.length>0){
        return res.status(200).json({
          success: true,
          message: "Payment Reciever List successfully.",
          data:allPaymentRecieverUser
        });
      }else{
        return res.status(200).json({
          success: false,
          message: "Payment Reciever List not found.",
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
  getSmsData: async (req, res) => {
    try {
      const { wallet } = await fast2sms.getWalletBalance(authorization);
       if (wallet) {
        return res.status(200).json({
          success: true,
          message: "SMS data get Successfully",
          wallet,
        });
      } else {
        return res.status(200).json({
          success: false,
          message: "SMS data not found.",
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

  submitResult: async (req, res) => {
    try {
      //console.log("req", req.body)
      const resultData= req.body

      if(resultData.resultPermissionData.role==='TEACHER' && resultData.subject){
          let subjectName=  resultData.subject.toLowerCase().trim()
          subjectName = subjectName.includes(' ')? subjectName.split(' ').join('_'):subjectName
        //  console.log("subject", subjectName)
        const examType = resultData.resultPermissionData.examType
        for (const it of resultData.resultMarks) {
          // console.log("userId", it.userId)
          //   let result={
          //     subjects:{}
          //   }
          //   // if(resultData.resultPermissionData.examType.includes('unit')){
          //   //   result.subjects['HINDI']=0
          //   //   result.subjects['ENGLISH']=0
          //   //   result.subjects['MATH']=0
          //   //   result.subjects['SCIENCE']=0
          //   //   result.subjects['SST']=0
          //   //   result.subjects['COMPUTER']=0
          //   // }
          //   result.subjects[subjectName]=it.marks
       
          //   console.log("resultttttttttttttttt",result)
          //   const subjectParam= `subjects.${subjectName}`
            
       
          //  const newAndUpdateRsultEntry= await resultModel.findOneAndUpdate({$and:[
          //   {userId:it.userId},
          //   {resultYear:resultData.resultPermissionData.resultYear},
          //   {examType:resultData.resultPermissionData.examType},
          //   {class:resultData.class},
          //   {subjectParam:subjectName}
          //   ]},
          //    result,   
          //    {upsert: true, new:true},
          //   );


          const resultParam ={$and:[
            {userId:it.userId},
            {resultYear:resultData.resultPermissionData.resultYear},
            {examType:resultData.resultPermissionData.examType},
            {class:resultData.class},
            ]}
            let resultEntryFound= await resultModel.findOne(resultParam);
            if(resultEntryFound){
              if(subjectName==='attendance'){
                if(examType.includes('HALF')){
                  resultEntryFound.attendance1 = it.marks
                }else{
                  resultEntryFound.attendance2 = it.marks
                }
              }else{
                if(resultEntryFound.subjects){
                  resultEntryFound.subjects[subjectName]=it.marks
                }else{
                  let resultEntryData=resultEntryFound
                  resultEntryData['subjects']={
                    [subjectName]:it.marks
                  }
                }
              }
              await resultModel.findOneAndUpdate(resultParam,resultEntryFound )

            }else{
                let result={
                    subjects:{}
                  }
                  if(subjectName==='attendance'){
                    if(examType.includes('HALF')){
                      result.attendance1 = it.marks
                    }else{
                      result.attendance2 = it.marks
                    }
                  }else{
                    result.subjects[subjectName] = it.marks
                  }
                  const newResultEntryData=resultModel({
                    userId:it.userId,
                    resultYear:resultData.resultPermissionData.resultYear,
                    examType:resultData.resultPermissionData.examType,
                    class:resultData.class,
                    ...result
                  })
                  //console.log('newRsultEntryDataaaaaaaaaaaaaaaaaaaa',newResultEntryData)
                 const  newResultEntryCreated = await newResultEntryData.save()
            }
        }

        return res.status(200).json({
            success: true,
            message: "Update result successfully.",
        });

      }
      // else if(resultData.resultPermissionData.role==='ADMIN'){
      //     for (let it of resultData.totalResultMarks) {
          
      //      const updateRsultEntry= await resultModel.findOneAndUpdate({$and:[
      //       {userId:it.userId},
      //       {resultYear:resultData.resultPermissionData.resultYear},
      //       {examType:resultData.resultPermissionData.examType},
      //       {class:resultData.class}
      //       ]},
      //       it,   
      //        {new:true},
      //       );

      //       console.log("updateRsultEntry",updateRsultEntry)
      //   }

      // }

    
   

    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },

  getResult: async (req, res) => {
    try {
      //console.log("req", req.body)
    const resultQuery= req.body
     const userData =  await userModel.find({$and:[{'userInfo.class':resultQuery.selectedClass},{'userInfo.roleName':'STUDENT'},activeParam]});
      if(resultQuery.resultPermissionData.action==='ENTRY'){
          let subjectName=  resultQuery.selectedSubject && resultQuery.selectedSubject.toLowerCase().trim()
          subjectName = subjectName.includes(' ')?subjectName.split(' ').join('_'):subjectName
          let subjectPermissionParam={
            userId:1,
          }
          if(subjectName==='attendance' && resultQuery.resultPermissionData.examType.includes('HALF')) {
            subjectPermissionParam.attendance1=1
            
          } else if(subjectName==='attendance' && resultQuery.resultPermissionData.examType.includes('ANNUAL')){
            subjectPermissionParam.attendance2=1

          }else{
            subjectPermissionParam={
              userId:1,
              subjects:{}
            }
            subjectPermissionParam.subjects[subjectName]=1
          }  
 
          let resultParam={
            $and:[
            {resultYear:resultQuery.resultPermissionData.resultYear},
            {examType:resultQuery.resultPermissionData.examType},
            {class:resultQuery.selectedClass},
            ]
          }
        const resultData = await resultModel.find(resultParam,subjectPermissionParam);
          return res.status(200).json({
            success: true,
            message: "Result get successfully.",
            result:resultData
          });
    
      }else if(resultQuery.resultPermissionData.role === 'ADMIN' && ['TOPADMIN', 'ADMIN'].includes(req.user.userInfo.roleName)){
       
        const fullMarks =resultQuery.fullMarks
        const classBetween1to10 = resultQuery.classBetween1to10
        const class9to10 = resultQuery.class9to10
        const examType= resultQuery.resultPermissionData.examType
        const resultYear= resultQuery.resultPermissionData.resultYear
        // console.log("examTypeexamType", examType)
        // console.log("resultYearresultYear", resultYear)
        const examData = await examModel.findOne({$and:[{examType:examType},{examYear:resultYear}]});
       
        //console.log("examDataexamData", examData.fullAttendance)
        const fullAttendance = examData && examData.fullAttendance?examData.fullAttendance:0
        const mainExams =  (examType==='ANNUAL EXAM' || examType==='HALF YEARLY EXAM')?true:false
        let resultParam={}
        let secondResultParam={}
        
      
          if(userData && userData.length>0){
            if(mainExams && classBetween1to10){
              if(examType==='ANNUAL EXAM'){
                resultParam = { 
                  resultYear:resultYear,
                  examType:'UNIT TEST-II',
                  class:resultQuery.selectedClass
                }
                secondResultParam = {
                  resultYear:resultYear,
                  examType:examType,
                  class:resultQuery.selectedClass
                }
              }else{
                resultParam = { 
                  resultYear:resultYear,
                  examType:'UNIT TEST-I',
                  class:resultQuery.selectedClass
                }
                secondResultParam = {
                  resultYear:resultYear,
                  examType:examType,
                  class:resultQuery.selectedClass
                }
              }
      
                let newResultData=[]
                    for (const studentData of userData) {
                    let studentResultData = {
                      ...studentData.userInfo,
                      document: {
                        stPhoto: studentData.document.stPhoto
                      },
                      rollNumber: studentData.rollNumber
                    }
                    let total = 0 
                    const secondResultData = await resultModel.findOne({$and:[
                      {
                        ...secondResultParam,
                        userId:studentData.userInfo.userId}
                    ]})
                    
                        if(secondResultData){
                          let subjectsValues=0
                          if(class9to10){

                            const copyOfSecondResultData = JSON.parse(JSON.stringify(secondResultData));
                       
                            Object.defineProperty(copyOfSecondResultData.subjects , 'computer', {
                              enumerable: false,  
                            });
                            Object.defineProperty(copyOfSecondResultData.subjects , 'comp_pract', {
                              enumerable: false,  
                            });
                            subjectsValues = (copyOfSecondResultData && copyOfSecondResultData.subjects)? Object.values(copyOfSecondResultData.subjects):0;
                          }else{
                            subjectsValues = (secondResultData && secondResultData.subjects)? Object.values(secondResultData.subjects):0;
                          }
                          
                          total = subjectsValues ? subjectsValues.reduce((sum, curr)=> sum+Number(curr), 0):0
                          studentResultData={
                            ...studentResultData,
                            studentResultSecond: secondResultData? secondResultData:{},
                            total: total
                          }

                        }else{
                          studentResultData = {
                            ...studentResultData,
                            studentResultSecond: {},
                            total: total
                          }
                        }

                      const unitResultData = await resultModel.findOne({$and:[
                          {...resultParam,userId: studentData.userInfo.userId}
                        ]})

                        if(unitResultData){
                          let subjectsValues=0
                          if(class9to10){
                            // const copyOfUnitResultData= unitResultData
                            // console.log("copyOfUnitResultData",copyOfUnitResultData)
                            // Object.defineProperty(copyOfUnitResultData.subjects, 'computer', {
                            //   enumerable: false,  
                            // });
                            let unitTotal=0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.hindi ? Number(unitResultData.subjects.hindi)/2:0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.english ? Number(unitResultData.subjects.english)/2:0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.math ? Number(unitResultData.subjects.math)/2:0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.science ? Number(unitResultData.subjects.science)/2:0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.sst ? Number(unitResultData.subjects.sst)/2:0

                            // subjectsValues = (copyOfUnitResultData && copyOfUnitResultData.subjects)? Object.values(copyOfUnitResultData.subjects):0;
                            // total += subjectsValues ? (subjectsValues.reduce((sum, curr)=> sum+Number(curr), 0))/2:0
                            total +=unitTotal
                          }else{
                            let unitTotal=0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.hindi ? Number(unitResultData.subjects.hindi):0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.english ? Number(unitResultData.subjects.english):0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.math ? Number(unitResultData.subjects.math):0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.science ? Number(unitResultData.subjects.science):0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.sst ? Number(unitResultData.subjects.sst):0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.computer ? Number(unitResultData.subjects.computer):0
                            // subjectsValues = (unitResultData && unitResultData.subjects)? Object.values(unitResultData.subjects):0;
                            // total += subjectsValues ? subjectsValues.reduce((sum, curr)=> sum+Number(curr), 0):0
                            total += unitTotal
                          }
                         
                       
                          studentResultData = {
                            ...studentResultData,
                            studentResult: unitResultData? unitResultData:{},
                            total: total
                          }
                        }else{
                          studentResultData = {
                            ...studentResultData,
                            studentResult: {},
                            total: total
                          }
                        }
                        newResultData.push(studentResultData)
                      }
                  
                      const sortResultData =  getRankedResult(newResultData)
                      // Assign rank with handling same scores
                        const actualResult = newResultData.map(originalData=> {
                        const rankedUser = sortResultData.find((sortdata)=> originalData.userId === sortdata.userId)
                        const percentage = percentageMarks(originalData.total, fullMarks)
                        const grade = getGrade(percentage)
                        const performance= getPerformance(grade)
                        const ddd= {
                          ...originalData,
                          rank: rankedUser ? rankedUser.rank : 0,
                          percentage :percentage,
                          grade:grade ,
                          performance:performance,
                          fullMarks:fullMarks,
                          fullAttendance:fullAttendance
                        }
                        return ddd
                      }
                    )
                return res.status(200).json({
                  success: true,
                  message: "Result get successfully.",
                  result:actualResult
                });
            }else{
            
              const resultParam={
                $and:[
                {resultYear:resultYear},
                {examType:resultQuery.resultPermissionData.examType},
                {class:resultQuery.selectedClass}
                ]
              }
            
              const resultData = await resultModel.find(resultParam);
              if(userData && userData.length>0){
                const newResultData = userData.map(data=>{
                  const found = resultData.find(element => element.userId === data.userInfo.userId);
                    if(found){
                      const subjectsValues = Object.values(found.subjects);
                      const total = subjectsValues.reduce((sum, curr)=> sum+Number(curr), 0)
                  
                      let newResultData = {
                        ...data.userInfo,
                        rollNumber:data.rollNumber,
                        studentResult:found,
                        total:total
                        }
                    
                        return newResultData
                    }else{
                      const newResultData = {
                        ...data.userInfo,
                        rollNumber:data.rollNumber,
                        studentResult:{},
                        total:0
                        }
                        return newResultData
                    }
                })
              
              const sortResultData =  getRankedResult(newResultData)
              const actualResult = newResultData.map(originalData=> {
                  const rankedUser = sortResultData.find((sortdata)=> originalData.userId === sortdata.userId)
                  let ddd = {}
                  if(mainExams){
                    const percentage = percentageMarks(originalData.total, fullMarks)
                    const grade = getGrade(percentage)
                    const performance= getPerformance(grade)
                     ddd= {
                      ...originalData,
                      rank: rankedUser ? rankedUser.rank: 0, 
                      percentage :percentage,
                      grade:grade ,
                      performance:performance,
                      fullMarks:fullMarks,
                      fullAttendance:fullAttendance
                    }
                  }else{
                     ddd = {
                      ...originalData,
                      rank: rankedUser ? rankedUser.rank: 0,
                    }
                  }
                      return ddd
                  }
                )
                return res.status(200).json({
                  success: true,
                  message: "Result get successfully.",
                  result:actualResult
                });
              }
            }
          }else{
            return res.status(200).json({
              success: false,
              message: "Result not found.",
            });
          }
      }else{
        return res.status(400).json({
          success: true,
          message: "Result Permssion not allowed. Please contact to admin",
          result:[]
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
  oldExamResult: async (req, res) => {
    try {
      //console.log("req", req.body)
    const resultQuery= req.body
     //const userData =  await userModel.find({$and:[{'userInfo.class':resultQuery.selectedClass},{'userInfo.roleName':'STUDENT'},activeParam]});

        const fullAttendance =resultQuery.fullAttendance
        const fullMarks =resultQuery.fullMarks
        const classBetween1to10 = resultQuery.classBetween1to10
        const class9to10 = resultQuery.class9to10
        const examType= resultQuery.resultPermissionData.examType
        const mainExams =  (examType==='ANNUAL EXAM' || examType==='HALF YEARLY EXAM')?true:false
        let resultParam={}
        let secondResultParam={}
            if(mainExams && classBetween1to10){
              if(examType==='ANNUAL EXAM'){
                resultParam = { 
                  resultYear:resultQuery.resultPermissionData.resultYear,
                  examType:'UNIT TEST-II',
                  class:resultQuery.selectedClass
                }
                secondResultParam = {
                  resultYear:resultQuery.resultPermissionData.resultYear,
                  examType:examType,
                  class:resultQuery.selectedClass
                }
              }else{
                resultParam = { 
                  resultYear:resultQuery.resultPermissionData.resultYear,
                  examType:'UNIT TEST-I',
                  class:resultQuery.selectedClass
                }
                secondResultParam = {
                  resultYear:resultQuery.resultPermissionData.resultYear,
                  examType:examType,
                  class:resultQuery.selectedClass
                }
              }
      
                let newResultData=[]
                    let total = 0 
                    const secondResultDataAll = await resultModel.find({$and:[
                      {
                        ...secondResultParam,
                      }
                    ]})
                    if(secondResultDataAll && secondResultDataAll.length>0){
                      for(const secondResultData of secondResultDataAll){
                        const studentData= await userModel.findOne({'userInfo.userId':secondResultData.userId})
                        let studentResultData={}
                        if(studentData){
                          studentResultData = {
                            ...studentData.userInfo,
                          }
                        }
                    
                        if(secondResultData){
                          let subjectsValues=0
                          if(class9to10){

                            const copyOfSecondResultData = JSON.parse(JSON.stringify(secondResultData));
                       
                            Object.defineProperty(copyOfSecondResultData.subjects , 'computer', {
                              enumerable: false,  
                            });
                            Object.defineProperty(copyOfSecondResultData.subjects , 'comp_pract', {
                              enumerable: false,  
                            });
                            subjectsValues = (copyOfSecondResultData && copyOfSecondResultData.subjects)? Object.values(copyOfSecondResultData.subjects):0;
                          }else{
                            subjectsValues = (secondResultData && secondResultData.subjects)? Object.values(secondResultData.subjects):0;
                          }
                          
                          total = subjectsValues ? subjectsValues.reduce((sum, curr)=> sum+Number(curr), 0):0
                          studentResultData={
                            ...studentResultData,
                            studentResultSecond: secondResultData? secondResultData:{},
                            total: total
                          }

                        }else{
                          studentResultData = {
                            ...studentResultData,
                            studentResultSecond: {},
                            total: total
                          }
                        }

                      const unitResultData = await resultModel.findOne({$and:[
                          {...resultParam,userId: studentData.userInfo.userId}
                        ]})

                        if(unitResultData){
                          let subjectsValues=0
                          if(class9to10){
                            // const copyOfUnitResultData= unitResultData
                            // console.log("copyOfUnitResultData",copyOfUnitResultData)
                            // Object.defineProperty(copyOfUnitResultData.subjects, 'computer', {
                            //   enumerable: false,  
                            // });
                            let unitTotal=0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.hindi ? Number(unitResultData.subjects.hindi)/2:0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.english ? Number(unitResultData.subjects.english)/2:0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.math ? Number(unitResultData.subjects.math)/2:0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.science ? Number(unitResultData.subjects.science)/2:0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.sst ? Number(unitResultData.subjects.sst)/2:0

                            // subjectsValues = (copyOfUnitResultData && copyOfUnitResultData.subjects)? Object.values(copyOfUnitResultData.subjects):0;
                            // total += subjectsValues ? (subjectsValues.reduce((sum, curr)=> sum+Number(curr), 0))/2:0
                            total +=unitTotal
                          }else{
                            let unitTotal=0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.hindi ? Number(unitResultData.subjects.hindi):0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.english ? Number(unitResultData.subjects.english):0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.math ? Number(unitResultData.subjects.math):0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.science ? Number(unitResultData.subjects.science):0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.sst ? Number(unitResultData.subjects.sst):0
                            unitTotal +=  unitResultData.subjects && unitResultData.subjects.computer ? Number(unitResultData.subjects.computer):0
                            // subjectsValues = (unitResultData && unitResultData.subjects)? Object.values(unitResultData.subjects):0;
                            // total += subjectsValues ? subjectsValues.reduce((sum, curr)=> sum+Number(curr), 0):0
                            total += unitTotal
                          }
                         
                       
                          studentResultData = {
                            ...studentResultData,
                            studentResult: unitResultData? unitResultData:{},
                            total: total
                          }
                        }else{
                          studentResultData = {
                            ...studentResultData,
                            studentResult: {},
                            total: total
                          }
                        }
                        newResultData.push(studentResultData)
                      }
                    }else{
                      return res.status(200).json({
                            success: false,
                            message: "Result not found.",
                          });
                    }
                  
                  const sortResultData =  newResultData.slice().sort((a,b) => b.total - a.total);
                  const actualResult = newResultData.map(originalData=> {
                      const sortDataIndex = sortResultData.findIndex((sortdata)=> (originalData && originalData.userId) === (sortdata && sortdata.userId))
                          const percentage = percentageMarks(originalData.total, fullMarks)
                          const grade = getGrade(percentage)
                          const performance= getPerformance(grade)
                          const ddd= {
                            ...originalData,
                            rank:sortDataIndex +1,
                            percentage :percentage,
                            grade:grade ,
                            performance:performance,
                            fullMarks:fullMarks,
                            fullAttendance:fullAttendance
                          }
                          return ddd
                      }
                    )
                return res.status(200).json({
                  success: true,
                  message: "Result get successfully.",
                  result:actualResult
                });
              
            }else{
              const resultParam={
                $and:[
                {resultYear:resultQuery.resultPermissionData.resultYear},
                {examType:resultQuery.resultPermissionData.examType},
                {class:resultQuery.selectedClass}
                ]
              }
              let newResultData=[]
              const allResultData = await resultModel.find(resultParam);
              if(allResultData && allResultData.length>0){
                for(const rData of allResultData){

                  const userfound = await userModel.findOne({'userInfo.userId':rData.userId});
                    if(userfound){
                      const subjectsValues = Object.values(rData.subjects);
                      const total = subjectsValues.reduce((sum, curr)=> sum+Number(curr), 0)
                      let resultData = {
                        ...userfound.userInfo,
                        studentResult:rData,
                        total:total
                        }
                        newResultData.push(resultData)
                    }
                }
              
              const sortResultData =  newResultData.slice().sort((a,b) => b.total - a.total);
              const actualResult = newResultData.map(originalData=> {
                  const sortDataIndex = sortResultData.findIndex((sortdata)=> originalData.userId === sortdata.userId)
                  let ddd = {}
                  if(mainExams){
                    const percentage = percentageMarks(originalData.total, fullMarks)
                    const grade = getGrade(percentage)
                    const performance= getPerformance(grade)
                     ddd= {
                      ...originalData,
                      rank:sortDataIndex +1,
                      percentage :percentage,
                      grade:grade ,
                      performance:performance,
                      fullMarks:fullMarks,
                      fullAttendance:fullAttendance
                    }
                  }else{
                     ddd = {
                      ...originalData,
                      rank:sortDataIndex +1
                    }
                  }
                      return ddd
                  }
                )
                return res.status(200).json({
                  success: true,
                  message: "Result get successfully.",
                  result:actualResult
                });
              }else{
                return res.status(200).json({
                  success: false,
                  message: "Result not found.",
                });
              }
            }
     
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },

  getDeletedUser: async (req, res) => {
    try {
      const searchStr= req.body.searchStr
      let searchParam={}
       if (searchStr && searchStr !== "" && searchStr !== undefined && searchStr !== null){
         searchParam={
          $or:[
            {'userInfo.roleName': new RegExp(searchStr, 'i')},
            {'userInfo.fullName': new RegExp(searchStr, 'i')},
            {'userInfo.fatherName': new RegExp(searchStr, 'i')},
            {'userInfo.motherName': new RegExp(searchStr, 'i')},
            {'userInfo.email': new RegExp(searchStr, 'i')},
            {'userInfo.phoneNumber1': new RegExp(searchStr, 'i')},
            {'userInfo.phoneNumber2': new RegExp(searchStr, 'i')},
            {'userInfo.aadharNumber':new RegExp(searchStr, 'i')},
            {'userInfo.userId':new RegExp(searchStr, 'i')}
          ]
        }
      }

      const users = await userModel.find({
        $and: [ { deleted: true },searchParam]
      });
      if(users && users.length){
        return res.status(200).json({
          success: true,
          message: 'Deleted user get successfully',
          users,
        });
      }else{
        return res.status(200).json({
          success: true,
          message: 'Deleted user not found',
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

  permanentDeleteUser: async (req, res) => {
    try {
     await userModel.deleteOne({_id:req.params.id});
      return res.status(200).json({
        success: true,
        message: "Deleted successfully."
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },

  reportData: async (req, res) => {
    try {
      let repodata={}
    let queryParam={}
    if(req.body.deleteOption){
      queryParam={
        ...queryParam,
        deleted:req.body.deleteOption==='true'?true:false,
      }
    }
    if(req.body.activeOption){
      queryParam={
        ...queryParam,
        isActive:req.body.activeOption==='true'?true:false,
      }
    }
    if(req.body.gender){
      queryParam={
        ...queryParam,
        'userInfo.gender':req.body.gender,
      }
    }
    if(req.body.selectedClass){
      queryParam={
        ...queryParam,
        'userInfo.class':req.body.selectedClass,
      }
    }
    if(req.body.selectedRole){
      queryParam={
        ...queryParam,
        'userInfo.roleName':req.body.selectedRole,
      }
    }
    if(req.body.selectedCategory){
      queryParam={
        ...queryParam,
        'userInfo.category':req.body.selectedCategory,
      }
    }
    if(req.body.isBelowPoverty){
      if (req.body.isBelowPoverty === 'true') {
        queryParam = {
          ...queryParam,
          'userInfo.isBelowPoverty': true,
        };
      } else {
        queryParam = {
          ...queryParam,
          $or: [
            { 'userInfo.isBelowPoverty': false },
            { 'userInfo.isBelowPoverty': { $exists: false } }
          ]
        };
      }
    }

   const reportCount= await userModel.find({$and:[activeParam,queryParam]}).countDocuments();

    return res.status(200).json({
      success: true,
      message: "Report Data get successfully.",
      reportData:repodata,
      reportCount:reportCount?reportCount:0,
    });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },

  createExam: async (req, res) => {
    try {
     const oldExam = await examModel.findOne({$and:[{examType:req.body.examType},{examYear:req.body.examYear}]});
     if(!oldExam){
      const examData=new examModel({
        examType: req.body.examType,
        examYear: req.body.examYear,
        fullAttendance: req.body.fullAttendance,
        created: new Date(),
        modified: new Date()
      })
      let newExamData = await examData.save();
      if(newExamData){
        return res.status(200).json({
          success: true,
          message: "exam created successfully."
        });
      }else{
        return res.status(200).json({
          success: false,
          message: "exam not created."
        });
      }
    }else{
      return res.status(200).json({
        success: false,
        message: "exam already created."
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

  updateExam: async (req, res) => {
    try {
      let newUpdate=null
      if(req.body.key==='primary'){
        newUpdate= await examModel.findOneAndUpdate({_id:req.body.examId},{primary:req.body.value, modified: new Date()});
      }
      if(req.body.key==='attendence'){
        newUpdate= await examModel.findOneAndUpdate({_id:req.body.examId},{fullAttendance:req.body.fullAttendance, modified: new Date()});
      }
      if(req.body.key==='adminEntryAllow'){
        newUpdate= await examModel.findOneAndUpdate({_id:req.body.examId},{adminAllowed:req.body.value, modified: new Date()});
      }
      if(newUpdate){
        return res.status(200).json({
          success: true,
          message: "exam updated successfully."
        });
      }else{
        return res.status(200).json({
          success: false,
          message: "exam not updated try again."
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

  deleteExam: async (req, res) => {
    try {
    const updatedExam=  await examModel.findOneAndUpdate({_id:req.params.id},{deleted:true});
      if(updatedExam){
        return res.status(200).json({
          success: true,
          message: "Deleted exam successfully."
        });
      }else{
        return res.status(200).json({
          success: true,
          message: "Exam not deleted."
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
  getExam:async(req, res)=>{
    try{
      const getExamsData= await examModel.find({})
      const getResultEntryPerData = await resultEntryPerModel.find({});
      const getTeacherData= await userModel.find({$and:[activeParam, {'userInfo.roleName':'TEACHER'}]})
      // let filterGetResultEntryPerData=[]
      // for (const data of getResultEntryPerData) {
      //   const userFound= getTeacherData.find(it=> it.userInfo.userId===data.userId)
      //   if(userFound){
      //     const permissionData= JSON.parse(JSON.stringify(data))
      //       const newData= {
      //         ...userFound.userInfo,
      //         ...permissionData,
      //       }
      //       filterGetResultEntryPerData.push(newData)
      //   }
      // }
      const sendData={
        examsData:getExamsData? getExamsData:[],
        teacherData:getTeacherData? getTeacherData:[],
        resultEntryPerData:getResultEntryPerData? getResultEntryPerData:[]
      }

        return res.status(200).json({
          success: true,
          message: "Exam data get successfully.",
          data: sendData
        })
    }catch(err){
      console.log(err)
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
  },
  getExamDateAndSub:async(req, res)=>{
    try{
      const getExamsData= await examDateAndSubModel.find({})
      if(getExamsData){
        return res.status(200).json({
          success: true,
          message: "Exam data get successfully.",
          data: getExamsData
        })
      }else{
        return res.status(200).json({
          success: false,
          message: "Exam data not found.",
        })
      }

    }catch(err){
      console.log(err)
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
  },
  updateExamDateAndSub:async(req, res)=>{
    try{
     //const examDateDetail=  await examDateAndSubModel.findOne({$and:[{ examYear : req.body.selectedSession},{examType: req.body.selectedExamType}]})
     const examDateDetail=  await examDateAndSubModel.find({})
      if(examDateDetail, examDateDetail.length>0){
       await examDateAndSubModel.findOneAndUpdate(
        {'_id':examDateDetail[0]._id},
        // {$and:[
        //   { examYear : req.body.selectedSession},
        //   {examType: req.body.selectedExamType}
        // ]},
        {examDateAndSub:req.body.examDateAndSub, modified: new Date()});
      }else{
        const examData=new examDateAndSubModel({
          examYear:req.body.selectedSession,
          examType:req.body.selectedExamType,
          examDateAndSub: req.body.examDateAndSub,
          created: new Date(),
          modified:new Date()
        })
        await examData.save();
      }
      return res.status(200).json({
        success: true,
        message: "Exam data created successfully.",
      })
    }catch(err){
      console.log(err)
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
  },

  getExamPermission :async(req, res)=>{
    try{
          const adminUser = await userModel.findOne({$and:[{'userInfo.userId':req.query.userId},{deleted:false},{'userInfo.roleName':{$in:['ADMIN','TOPADMIN']}}]})
          const getExamsData= await examModel.findOne({$and:[{deleted:false, primary:true}]})
            const resultEntryPermission= await resultEntryPerModel.findOne({$and:[{deleted:false, userId:req.query.userId}]}) 
          if(adminUser && getExamsData){
            const permission={
              classAllowed :classList,
              subjectsAllowed : subjectList,
              entry:true
            }
            let sendExamsData={
              permission:permission,
              examsData:getExamsData
            }
            if(adminUser.userInfo.roleName==='TOPADMIN'){
              return res.status(200).json({
                success: true,
                message: "Result entry permission data get successfully.",
                data: sendExamsData 
              })
            }
            if(adminUser.userInfo.roleName==='ADMIN' &&  getExamsData.adminAllowed){
              return res.status(200).json({
                success: true,
                message: "Result entry permission data get successfully.",
                data: sendExamsData 
              })
            }else{
              return res.status(200).json({
                success: false,
                message: "Result entry permission not allowed. Please contact to admin.", 
              })
            }
          }else{
            if(resultEntryPermission && getExamsData){
              const sendExamsData={
                permission:resultEntryPermission,
                examsData:getExamsData
              }
              return res.status(200).json({
                success: true,
                message: "Result entry permission data get successfully.",
                data: sendExamsData 
              })
      
            }else{
              return res.status(200).json({
                success: false,
                message: "Result entry permission not allowed. Please contact to admin.", 
              })
            }
          }
     
    }catch(err){
      console.log(err)
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
  },
  createResultEntryPermission: async(req, res)=>{
    try{
      const checkAlreadyExist = await resultEntryPerModel.findOne({userId:req.body.teacherId});
      if(!checkAlreadyExist){
        const resultEntryPerData= new resultEntryPerModel({
          userId:req.body.teacherId,
          // subjectsAllowed:req.body.subjectsAllowed,
          // classAllowed:req.body.classAllowed,
          allowedList:req.body.allowedList
        })
        const newResultEntryPer = await resultEntryPerData.save();
        if(newResultEntryPer){
          return res.status(200).json({
            success: true,
            message: "Result entry permisssion created successfully.",
          })
        }else{
          return res.status(200).json({
            success: false,
            message: "Result entry permisssion not created.",
          })
        }
     
      }else{
        return res.status(200).json({
          success: false,
          message: "Already Result Entry Permission created.",
        })
      }
   
    }catch(err){
      console.log(err)
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
  },
  getResultEntryPermission: async(req, res)=>{
    try{
      const getResultEntryPerData = await resultEntryPerModel.find({});
      if(getResultEntryPerData && getResultEntryPerData){
        return res.status(200).json({
          success: true,
          message: "Result entry permisssion get successfully.",
          data:getResultEntryPerData
        })
      }else{
        return res.status(200).json({
          success: false,
          message: "Result entry permisssion not found.",
        })
      }
    }catch(err){
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
  },
  updateResultEntryPermission: async (req, res) => {
    try {
      let newUpdate=null
      if(req.body.key==='entry'){
        newUpdate= await resultEntryPerModel.findOneAndUpdate({_id:req.body.resultEntryPerId},{entry:req.body.value, modified: new Date()});
      }
      if(req.body.key==='update'){
       let resultEntryPerData= await resultEntryPerModel.findOne({$and:[{_id:req.body.resultEntryPerId}]})
      //  console.log("resultEntryPerData", resultEntryPerData,)
      //  console.log("req.body.allowedList", req.body.allowedList,)
        resultEntryPerData.allowedList = req.body.allowedList,
        resultEntryPerData.modified = new Date

       newUpdate= await resultEntryPerModel.findOneAndUpdate({$and:[{_id:req.body.resultEntryPerId}]},resultEntryPerData);
      }
      if(newUpdate){
        return res.status(200).json({
          success: true,
          message: "Updated successfully."
        });
      }else{
        return res.status(200).json({
          success: false,
          message: 'Not updated, try agian',
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
  deleteResultEntryPermission: async(req, res)=>{
    try{
      const deleted = await resultEntryPerModel.deleteOne({_id:req.params.id});
      if(deleted){
        return res.status(200).json({
          success: true,
          message: "Delated successfully.",
        })
      }else{
        return res.status(200).json({
          success: false,
          message: "Not Delated",
        })
      }
  
    }catch(err){
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
  },
  getAdminDashboardData:async(req, res)=>{
    try{
      let dashBoardData={}
      let todayTransaction={
        totalCredit: 0,
        toatlDebit:0,
        onlineCredit:0,
        cashCredit:0,
        cashDebit: 0
      }
      const totalStudent= await userModel.find({$and:[activeParam, {'userInfo.roleName': 'STUDENT'}]}).countDocuments()
      const totalTeacher= await userModel.find({$and:[activeParam, {'userInfo.roleName': 'TEACHER'}]}).countDocuments()
      const indiaTimezone = 'Asia/Kolkata';
      const startOfTomorrow = moment.tz(indiaTimezone).add(1, 'day').startOf('day').toDate().toISOString();
      const startOfYesterday = moment.tz(indiaTimezone).startOf('day').toDate().toISOString();
      const TodayDate = moment.tz(new Date(), 'DD/MM/YYYY', 'Asia/Kolkata').format('DD/MM/YYYY');;
      const invoiceTodayParams = {
              'invoiceInfo.submittedDate':{
                '$gte':startOfYesterday,
                '$lte':startOfTomorrow 
              }
        }
        console.log("invoiceTodayParams", invoiceTodayParams)
      const birthDayUser = await userModel.aggregate([
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
            $and:[
              {istDate: {
                $eq: new Date(new Date().getTime() + 19800000).toISOString().substr(5, 5)
                }
              },
              {deleted: false},
              {isApproved: true},
              {isActive: true}
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
      // const todayInvoice = await  invoiceModel.find({$and:[{deleted:false},invoiceTodayParams]})
      //  if(todayInvoice && todayInvoice.length>0){
      //     for (const it of todayInvoice) {
      //           if(it.transactionType && it.transactionType==='credit'){
      //            todayTransaction.totalCredit= Number(todayTransaction.totalCredit)+ Number(it.amount)
      //              if(it.invoiceInfo && it.invoiceInfo.payment && it.invoiceInfo.payment.length>0){
      //                 for (const payInfo of it.invoiceInfo.payment) {
      //                     if(payInfo && payInfo.payModeId.toString()==='Cash'){
      //                       todayTransaction.cashCredit = Number(todayTransaction.cashCredit) + Number(payInfo.amount)
      //                     }
      //                     if(payInfo && payInfo.payModeId.toString()!=='Cash'){
      //                       todayTransaction.onlineCredit = Number(todayTransaction.onlineCredit) + Number(payInfo.amount)
      //                     }
      //                 }
      //             }
      //         }
      //     }
      //   }

        const todayTransaction2 = await invoiceModel.aggregate([
          {
              $match: {
                  $and: [
                      { deleted: false },
                      invoiceTodayParams // Filter for today's invoices
                  ]
              }
          },
          {
              $match: { transactionType: 'credit' } // Only credit transactions
          },
          {
              $unwind: { path: "$invoiceInfo.payment", preserveNullAndEmptyArrays: true } // Unwind payment array
          },
          {
              $group: {
                  _id: null,
                  totalCredit: { $sum: { $toDouble: "$amount" } }, // Sum of all credit amounts
                  cashCredit: {
                      $sum: {
                          $cond: [
                              { $eq: [{ $toString: "$invoiceInfo.payment.payModeId" }, "Cash"] },
                              { $toDouble: "$invoiceInfo.payment.amount" },
                              0
                          ]
                      }
                  },
                  onlineCredit: {
                      $sum: {
                          $cond: [
                              { $ne: [{ $toString: "$invoiceInfo.payment.payModeId" }, "Cash"] },
                              { $toDouble: "$invoiceInfo.payment.amount" },
                              0
                          ]
                      }
                  }
              }
          },
          {
              $project: {
                  _id: 0,
                  totalCredit: 1,
                  cashCredit: 1,
                  onlineCredit: 1
              }
          }
      ]);
      
      const todayTransactionResult = todayTransaction2[0] || { totalCredit: 0, cashCredit: 0, onlineCredit: 0,  toatlDebit:0, };
      console.log("result", todayTransactionResult)

      // const  filterParamsTxLedger = [
      //     {$match: {$and:[{$or:[{'otherInformation.system_mode': {$in:[system_mode,system_mode.toLowerCase()]}},{'app_mode':{$in:[system_mode,system_mode.toLowerCase()]}}]},{$or:[{'otherInformation.helox_type':true},{'capture_type':'api'}]}]}},
      //     {
      //         $group: {
      //             _id: {
      //                 year: {$year:{$toDate: '$otherInformation.submitingData'}},
      //                 month: {$month: {$toDate: '$otherInformation.submitingData'}},
      //                 day: {$dayOfMonth: {$toDate: '$otherInformation.submitingData'}}
      //             },
      //             count: {$sum: 1},
      //             "salesAmount": {$sum: { $toDouble:'$billingInformation.initialAmount'}},
      //             "salesCount": {$sum: {$cond: [{$gt: ['$billingInformation.initialAmount', 0]}, {$sum: 1}, 0]}},
      //             'budtenderAmount': {$sum: {$cond: [{$gt:['$billingInformation.budtenderTipAmount', 0]},'$billingInformation.budtenderTipAmount',0] }},
      //             'budtenderCount': {$sum: {$cond: [{$gt:['$billingInformation.budtenderTipAmount', 0]},{$sum:1},0] }},
      //             'driverAmount': {$sum: {$cond: [{$gt:['$billingInformation.driverTipAmount', 0]},'$billingInformation.driverTipAmount',0] }},
      //             'driverCount': {$sum: {$cond: [{$gt:['$billingInformation.driverTipAmount', 0]},{$sum:1},0] }},
      //         },

      //     },
      //     //{$sort:{'_id':-1}}
      // ]
       
      

      dashBoardData={
        totalStudent:totalStudent,
        totalTeacher:totalTeacher,
        todayBirthday:birthDayUser,
        todayTransaction:todayTransactionResult
      }

      if(dashBoardData){
        return res.status(200).json({ 
          success: true,
          message: "Get dashboard data successfully.",
          dashboardData:dashBoardData
        });
      }
    }catch(err){
      console.log(err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

  },
  studentDashboardData:async (req, res)=>{
    try{
      const CURRENTSESSION = getCurrentSession()
      let mainUser = await userModel.findOne({$and:[activeParam,{'userInfo.roleName': 'STUDENT'},{'userInfo.userId': req.query.mainUserId}]});
      if(!mainUser){
        return res.status(401).json({
          success: false,
          message: 'Token expired',
        });
      }
      let otherUser=[]
      if(mainUser){
        otherUser = await userModel.find({$and:[activeParam, {'userInfo.roleName': 'STUDENT'},{ 'userInfo.userId': { $ne: mainUser.userInfo.userId }},{$or:[{ "userInfo.phoneNumber1": mainUser.userInfo.phoneNumber1},{ "userInfo.phoneNumber2": mainUser.userInfo.phoneNumber2}]}]});
      }
    const allUserIds= [mainUser.userInfo.userId, ...otherUser.map(data=> data.userInfo.userId)]
     const paymentPrevYear = await paymentModel.find({$and:[{session:previousSession()},{delected: false}, {userId:{$in:[...allUserIds]}}]})
     const paymentCurrYear = await paymentModel.find({$and:[{session:CURRENTSESSION},{delected: false}, {userId:{$in:[...allUserIds]}}]})
    
     const allTransaction = await  invoiceModel.find({$and:[{delected:false},{userId:{$in:[...allUserIds]}}]})
 
      const userData= encryptObj(mainUser)
      
      const newOtherUser = otherUser.map(item => encryptObj(item));

    dashBoardData={
      user: userData, 
      //token: tokenGen, 
      otherUser: newOtherUser,
      paymentPrevYear:paymentPrevYear,
      paymentCurrYear:paymentCurrYear,
      allTransaction:allTransaction
    }

    if(dashBoardData){
      return res.status(200).json({ 
        success: true,
        message: "get dashboard data successfully.",
        dashboardData:dashBoardData
      });
    }
  }catch(err){
    console.log(err);
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  },
  upgradeClass: async (req, res) => {
    try {
      const CURRENTSESSION = getCurrentSession()
      console.log("CURRENTSESSION", CURRENTSESSION);
      const totalStudent = await userModel.find({$and: 
        [ 
          activeParam,
          {'userInfo.roleName':'STUDENT'},
          {'userInfo.class':req.body.selectedClass},
        ]
      })
      console.log("totalStudent", totalStudent.length)
      if (totalStudent && totalStudent.length > 0) {
        for (const student of totalStudent) {
            // Update user information
            const updatedStudent = await userModel.findOneAndUpdate(
                { _id: student._id },
                { 
                    $set: { 
                        'userInfo.class': req.body.upgradeClass, 
                        'userInfo.session': CURRENTSESSION,
                        'userInfo.paymentLedgerPage': '' 
                    } 
                },
                { new: true } // Returns the updated document
            );
            //console.log("updatedStudent", updatedStudent)
            if (updatedStudent) { // Only proceed if user update is successful
                // Check if a payment record exists
                const payFound = await paymentModel.findOne({
                    userId: student.userInfo.userId,
                    session: CURRENTSESSION
                });
    
                // If payment record does not exist, create a new one
                if (!payFound) {
                    const newPaymentData = new paymentModel({
                        userId: student.userInfo.userId,
                        session: CURRENTSESSION,
                        class: req.body.upgradeClass,
                        dueAmount: 0,
                        excessAmount: 0,
                        totalFineAmount: 0,
                        feeFree: student.userInfo.feeFree,
                        busService: student.userInfo.busService,
                        busRouteId: student.userInfo.busService ? student.userInfo.busRouteId : undefined,
                        paymentLedgerPage: student.userInfo.paymentLedgerPage 
                    });
    
                    await newPaymentData.save();
                }
            }
        }
    }
    
        
      return res.status(200).json({
        success: true,
        message: "class upgraded successfully",
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  createList: async (req, res) => {
    try{
      let newListCreated=''
      if(req.params.name==='vehicleList'){
        const newInfo= new vehicleModel({
          ...req.body
        })
        newListCreated = await newInfo.save();
      }
      if(req.params.name==='busRouteFareList'){
        const busRouteId = generateUniqueIdWithTime()
        const newInfo= new vehicleRouteFareModel({
          ...req.body,
          busRouteId
        })
        newListCreated = await newInfo.save();
      }
      if(req.params.name==='monthlyFeeList'){
        const newInfo= new monthlyFeeListModel({
          ...req.body
        })
        newListCreated = await newInfo.save();
      }
      if(req.params.name==='createPayOption'){
        const newInfo= new payOptionModel({
          ...req.body
        })
        newListCreated = await newInfo.save();
      }
      if(newListCreated){
        const CURRENTSESSION = getCurrentSession()
        const reqSession = req.body.session || CURRENTSESSION
        const RedisListKey = `AllList_${reqSession}`
        redisDeleteCall(RedisListKey)

        return res.status(200).json({
          success: true,
          message: "created successfully.",
        })
      }else{
        return res.status(200).json({
          success: false,
          message: "Not created list, Please try again!",
        })
      }
    }catch(err){
      console.log(err)
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
  },

  updateList: async (req, res) => {
    try{
      let updateList=''
      if(req.params.name==='vehicleList'){
        updateList = await  vehicleModel.findByIdAndUpdate({_id: req.params.id},req.body)
      }

      if(req.params.name==='busRouteFareList'){
        updateList = await  vehicleRouteFareModel.findByIdAndUpdate({_id: req.params.id},req.body)
      }

      if(req.params.name==='monthlyFeeList'){
        updateList = await  monthlyFeeListModel.findByIdAndUpdate({_id: req.params.id},req.body)
      }

      if(req.params.name==='updatePayOption'){
        updateList = await  payOptionModel.findByIdAndUpdate({_id: req.params.id},req.body)
      }

      if(updateList){
        const CURRENTSESSION = getCurrentSession()
        const reqSession = req.body.session || CURRENTSESSION
        const RedisListKey = `AllList_${reqSession}`
        redisDeleteCall({key:RedisListKey})
        return res.status(200).json({
          success: true,
          message: "Updated successfully.",
        })
      }else{
        return res.status(200).json({
          success: false,
          message: "Not updated list, Please try again!",
        })
      }
    }catch(err){
      console.log(err)
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
  },

  getAllList: async (req, res) => {
    //const busRouteFareList111= await vehicleRouteFareModel.find()
    //const ids=[]
    //for (const element of busRouteFareList111) {
          // element.session = '2024-25'
          // element['busRouteId'] = generateUniqueIdWithTime()
          // await element.save();
          //ids.push(element.busRouteId)
    //}

    //console.log("ids0", ids)

    

    // const busRouteFareList111= await vehicleRouteFareModel.find({session:'2024-25'})
    // for (const element of busRouteFareList111) {
    //       let newEle= JSON.parse(JSON.stringify(element))
    //       delete newEle._id
    //       newEle.session = '2025-26'
    //       const newInfo = new vehicleRouteFareModel(newEle)
    //       await newInfo.save();
    // }


    // const monthlyFeeList111 = await monthlyFeeListModel.find()
    // for (let element of monthlyFeeList111) {
    //   const examFee = element.examFee;
    //   // Use Mongoose's updateOne method to update the document
    //   await monthlyFeeListModel.updateOne(
    //       { _id: element._id }, 
    //       {
    //           $unset: { examFee: "" }, // Properly remove the `examFee` field
    //           $set: {
    //               annualExamFee: examFee,
    //               halfExamFee: examFee,
    //               session: '2024-25'
    //           }
    //       }
    //   );
    // }


    // const monthlyFeeList111= await monthlyFeeListModel.find({session:'2024-25'})
    // for (const element of monthlyFeeList111) {
    //       let newEle = JSON.parse(JSON.stringify(element))
    //       delete newEle._id
    //       newEle.session = '2025-26'
    //       const newInfo = new monthlyFeeListModel(newEle)
    //       await newInfo.save();
    // }

    const CURRENTSESSION = getCurrentSession()
    const reqSession = req.query.session || CURRENTSESSION
    const RedisListKey = `AllList_${reqSession}`
    try{
      const redisClient = getRedisClient();
      // if(myCache.has("AllList")){
      if(redisClient && await redisClient.exists(RedisListKey)){
        listCacheValue = await redisClient.get(RedisListKey)
        listCacheValue = JSON.parse(listCacheValue)
        let vehicleList = listCacheValue.vehicleList
        let busRouteFareList = listCacheValue.busRouteFareList
        let monthlyFeeList = listCacheValue.monthlyFeeList
        let payOptionList = listCacheValue.payOptionList
        let paymentRecieverUserList =listCacheValue.paymentRecieverUserList
        let allStudentUserIdList = listCacheValue.allStudentUserIdList
        return res.status(200).json({
          success: true,
          message: "Get list successfully from cache.",
          data:{
            vehicleList,
            busRouteFareList,
            monthlyFeeList,
            payOptionList,
            paymentRecieverUserList,
            allStudentPhoneList:[], //flatPhoneNum,
            allStudentUserIdList : allStudentUserIdList
          }
        })
      }else{
        let vehicleList= await vehicleModel.find()
        let busRouteFareList= await vehicleRouteFareModel.find({session:reqSession})
        let monthlyFeeList= await monthlyFeeListModel.find({session: reqSession})
        let payOptionList= await payOptionModel.find()
        let paymentRecieverUserList = await userModel.find({$and:[activeParam,{'userInfo.roleName':{$in:['ADMIN','ACCOUNTANT']}},{'userInfo.userId':{$nin:['topadmin']}}]}) // 918732 Anshu kumar id
        let allStudentUserId = await userModel.find({$and:[activeParam,{'userInfo.roleName':'STUDENT'}, {'userInfo.session':CURRENTSESSION}]},{"userInfo.userId": 1})
        //let allStudentPhone1 = await userModel.find({$and:[activeParam,{'userInfo.roleName':'STUDENT'}]},{"userInfo.phoneNumber1": 1})
        //let allStudentPhone2 = await userModel.find({$and:[activeParam,{'userInfo.roleName':'STUDENT'}]},{"userInfo.phoneNumber2": 1})
        //allStudentPhone1 = [...allStudentPhone1].map(data=> data.userInfo.phoneNumber1)
        //allStudentPhone2 = [...allStudentPhone2].map(data=> data.userInfo.phoneNumber2)
        //const flatPhoneNum= [...new Set([...allStudentPhone1, ...allStudentPhone1])].map(phone=> {return {label: phone, value: phone}})
        //console.log("allStudentPhone1", flatmap)
        const returnData={
          vehicleList,
          busRouteFareList,
          monthlyFeeList,
          payOptionList,
          paymentRecieverUserList,
          allStudentPhoneList:[], //flatPhoneNum,
          allStudentUserIdList : allStudentUserId && allStudentUserId .length>0 ?allStudentUserId.map(data=> {return {label: data.userInfo.userId,value: data.userInfo.userId}}):[]
        }
        if(redisClient) {
          redisSetKeyCall({key:RedisListKey, data:JSON.stringify(returnData)})
        }
        return res.status(200).json({
          success: true,
          message: "Get list successfully.",
          data:returnData
        })
      }

  
    }catch(err){
      console.log(err)
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
  },

  getAllList2 : async (req, res) => {
    try {
      // Concurrently fetch data using Promise.all
      const [
        vehicleList,
        busRouteFareList,
        monthlyFeeList,
        payOptionList,
        paymentRecieverUserList,
        allStudents
      ] = await Promise.all([
        vehicleModel.find(),
        vehicleRouteFareModel.find(),
        monthlyFeeListModel.find(),
        payOptionModel.find(),
        userModel.find({
          $and: [
            activeParam,
            { 'userInfo.roleName': { $in: ['ADMIN', 'ACCOUNTANT'] } },
            { 'userInfo.userId': { $nin: ['topadmin'] } }
          ]
        }),
        userModel.find({
          $and: [activeParam, { 'userInfo.roleName': 'STUDENT' }]
        }, { 'userInfo.userId': 1, 'userInfo.phoneNumber1': 1, 'userInfo.phoneNumber2': 1 })
      ]);
  
      // Extract phone numbers and remove duplicates
      const flatPhoneNum = [
        ...new Set(
          allStudents.flatMap(student => [student.userInfo.phoneNumber1, student.userInfo.phoneNumber2])
        )
      ].filter(Boolean).map(phone => ({ label: phone, value: phone })); // Remove undefined/null and map
  
      // Extract student user IDs
      const allStudentUserIdList = allStudents.map(student => ({
        label: student.userInfo.userId,
        value: student.userInfo.userId
      }));
  
      return res.status(200).json({
        success: true,
        message: "Get list successfully.",
        data: {
          vehicleList,
          busRouteFareList,
          monthlyFeeList,
          payOptionList,
          paymentRecieverUserList,
          allStudentPhoneList: flatPhoneNum,
          allStudentUserIdList
        }
      });
    } catch (err) {
      console.log(err)
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
  },
  

  addPayment: async (req, res) => {
    let newInvoiceCreatedId=''
    try{
      const CURRENTSESSION = getCurrentSession()
      const reqSession = req.body.session || CURRENTSESSION
      let paymentAdded=null
      const newInvoiceIdGen = await newInvoiceIdGenrate()
      const submitType= req.body.submitType
      if(!submitType){
        return res.status(200).json({
          success: false,
          message: "Submit type not found, Please try again!",
        })
      }
      const userData = await userModel.findOne({$and:[{'userInfo.userId':req.body.userId},{'userInfo.roleName':'STUDENT'}]})
      if(!userData){
        return res.status(200).json({
          success: false,
          message: "User data not found, Contact to admin!",
        })
      }
      let newInvoiceInfo= new invoiceModel({})
      newInvoiceInfo['invoiceInfo'] = {...req.body}
      newInvoiceInfo['invoiceType'] = submitType
      newInvoiceInfo['transactionType'] ='credit'
      newInvoiceInfo['paidStatus'] = true
      newInvoiceInfo['userId'] = req.body.userId,
      newInvoiceInfo['class'] = req.body.class,
      newInvoiceInfo['amount'] = req.body.paidAmount
      newInvoiceInfo['invoiceId'] = newInvoiceIdGen
      newInvoiceInfo['insertedId'] = req.body.insertedId
      newInvoiceInfo['session']= reqSession
      const newInvoiceCreate = await newInvoiceInfo.save();
      if(newInvoiceCreate){
        newInvoiceCreatedId = newInvoiceCreate._id
        let paymentFound =  await paymentModel.findOne({$and:[{userId: req.body.userId},{session: reqSession}]})
          if(paymentFound){
              if(submitType==='MONTHLY'){
                for(const data of req.body.feeList){
                  if(paymentFound[data.month.toLowerCase()] && paymentFound[data.month.toLowerCase()].paidStatus===true){
                      await invoiceModel.deleteOne({_id:newInvoiceCreate._id}) 
                      return res.status(200).json({
                        success: false,
                        message: `Payment is already done of this "${data.month}" month.`,
                      })
                    }
                    else{
                      //console.log("hhhhhhhhhhh")
                      paymentFound[data.month.toLowerCase()]={
                        monthlyFee: data.monthlyFee,
                        busFee:  data.busFee? data.busFee:0,
                        busRouteId : data.busRouteId? data.busRouteId:0,
                        paymentRecieverId: req.body.paymentRecieverId,
                        paidStatus: true,
                        submittedDate : req.body.submittedDate,
                        invoiceId: newInvoiceCreate.invoiceId,
                        receiptNumber: req.body.receiptNumber 
                      }
                    }
                }
                paymentFound['dueAmount'] = parseInt(req.body.paidAmount) >= parseInt(req.body.totalAmount)? 0 : parseInt(req.body.dueAmount|| 0) + parseInt(req.body.overDueAmount || 0)
                paymentFound['excessAmount'] = req.body.excessAmount? req.body.excessAmount:0
                paymentFound['totalConcession']  = parseInt(paymentFound.totalConcession)+ parseInt(req.body.concession ? req.body.concession:0)
                paymentFound['totalFineAmount']  = parseInt(paymentFound.totalFineAmount)+ parseInt(req.body.fineAmount? req.body.fineAmount:0)
                paymentFound['paymentLedgerPage'] = req.body.paymentLedgerPage? req.body.paymentLedgerPage: paymentFound['paymentLedgerPage']
              }
              if(submitType==='EXAM_FEE'){
                if(paymentFound.other &&paymentFound.other.length>0 ){
                  let othertPay=[]
                  for(const data of req.body.otherFeeList){
                    othertPay=[
                      ...othertPay,
                      {
                        name: data.name,
                        amount: Number(data.amount),
                        paymentRecieverId: req.body.paymentRecieverId,
                        paidStatus: true,
                        submittedDate : req.body.submittedDate,
                        invoiceId: newInvoiceCreate.invoiceId,
                        receiptNumber: req.body.receiptNumber 
                      }
                    ]
                  }
                  paymentFound.other=[...paymentFound.other, ...othertPay]
                  
                }else{
                  for(const data of req.body.otherFeeList){
                    paymentFound.other=[{
                      name: data.name,
                      amount: Number(data.amount),
                      paymentRecieverId: req.body.paymentRecieverId,
                      paidStatus: true,
                      submittedDate : req.body.submittedDate,
                      invoiceId: newInvoiceCreate.invoiceId,
                      receiptNumber: req.body.receiptNumber 
                    }
                  ]
                }
                }
             
              }
              if(submitType==='OTHER_PAYMENT'){
                if(paymentFound.other && paymentFound.other.length>0 ){
                  let othertPay=[]
                  let oldOtherDue = paymentFound.otherDue ? JSON.parse(JSON.stringify(paymentFound.otherDue)):{}
                  for(const data of req.body.otherFeeList){
                    const othertPayList={
                        name: data.name,
                        amount: Number(data.amount),
                        paymentRecieverId: req.body.paymentRecieverId,
                        paidStatus: true,
                        submittedDate : req.body.submittedDate,
                        invoiceId: newInvoiceCreate.invoiceId,
                        receiptNumber: req.body.receiptNumber,
                      }
                      othertPay.push(othertPayList)
                    if(data && data.name && data.name.includes('due') && Object.keys(oldOtherDue).length>0){
                      oldOtherDue={
                        ...oldOtherDue,
                        [data.name]: Number(oldOtherDue[data.name]) - Number(data.amount)
                      }
                    }
                    if (data.name === 'dueMarch_Month_Bus') {
                        paymentFound['dueAmount'] = Number(paymentFound['dueAmount']) - Number(data.amount)
                        delete oldOtherDue[data.name];
                    }
                  }
                  paymentFound.otherDue= oldOtherDue
                  if(req.body.dueFor){
                    paymentFound.otherDue={
                      ...paymentFound.otherDue,
                      [req.body.dueFor]: req.body.dueAmount?Number(req.body.dueAmount):0
                    }
                  }
                  paymentFound.other=[...paymentFound.other, ...othertPay]
                  
                }else{
                  let othertPay=[]
                  for(const data of req.body.otherFeeList){
                    const othertPayList={
                      name: data.name,
                      amount: Number(data.amount),
                      paymentRecieverId: req.body.paymentRecieverId,
                      paidStatus: true,
                      submittedDate : req.body.submittedDate,
                      invoiceId: newInvoiceCreate.invoiceId,
                      receiptNumber: req.body.receiptNumber 
                    }
                    othertPay.push(othertPayList)
                  }
                  paymentFound.other=[...othertPay]
                }
                if(req.body.dueFor){
                  const oldOtherDue= paymentFound.otherDue
                  paymentFound.otherDue={
                    ...oldOtherDue,
                    [req.body.dueFor]: req.body.dueAmount?Number(req.body.dueAmount):0
                  }
                }
              }
              // paymentFound['totalPaidAmount'] =  parseInt(paymentFound.totalPaidAmount)+ parseInt(req.body.paidAmount)
              // paymentFound['totalAmount'] =  parseInt(paymentFound.totalAmount) + parseInt(req.body.totalAmount)
              paymentFound.modified = new Date()
              paymentAdded = await paymentModel.findByIdAndUpdate({_id: paymentFound._id},paymentFound)
          }else{
            let newPaymentInfo= new paymentModel({})
            if(submitType==='MONTHLY'){
                req.body.feeList.forEach(data=>
                  newPaymentInfo[data.month.toLowerCase()]={
                        monthlyFee: data.monthlyFee,
                        busFee:  data.busFee? data.busFee:0,
                        busRouteId : data.busRouteId? data.busRouteId:0,
                        paymentRecieverId: req.body.paymentRecieverId,
                        submittedDate : req.body.submittedDate,
                        paidStatus: true,
                        invoiceId: newInvoiceCreate.invoiceId,
                        receiptNumber: req.body.receiptNumber 
                  }
                )
                newPaymentInfo['dueAmount'] = req.body.dueAmount? req.body.dueAmount:0
                newPaymentInfo['excessAmount'] = req.body.excessAmount? req.body.excessAmount:0
                newPaymentInfo['totalConcession'] = req.body.concession? req.body.concession:0
                newPaymentInfo['totalFineAmount']= req.body.fineAmount? req.body.fineAmount:0
                newPaymentInfo['userId'] = req.body.userId
                newPaymentInfo['session'] = req.body.session
                newPaymentInfo['class'] = req.body.class
                newPaymentInfo['paymentLedgerPage'] = req.body.paymentLedgerPage? req.body.paymentLedgerPage: undefined
                // newPaymentInfo['totalPaidAmount'] = req.body.paidAmount
                // newPaymentInfo['totalAmount'] = req.body.totalAmount
            }
            if(submitType==='EXAM_FEE'){
                for(const data of req.body.otherFeeList){
                  newPaymentInfo.other=[{
                      name: data.name,
                      amount: Number(data.amount),
                      paymentRecieverId: req.body.paymentRecieverId,
                      paidStatus: true,
                      submittedDate : req.body.submittedDate,
                      invoiceId: newInvoiceCreate.invoiceId,
                      receiptNumber: req.body.receiptNumber 
                    },
                  ]
                }
                newPaymentInfo['dueAmount'] = 0
                newPaymentInfo['excessAmount'] = 0
                newPaymentInfo['totalConcession'] = 0
                newPaymentInfo['totalFineAmount']= 0
                newPaymentInfo['userId'] = req.body.userId
                newPaymentInfo['session'] = req.body.session
                newPaymentInfo['class'] = req.body.class
            }
            paymentAdded = await newPaymentInfo.save();
          }
      }
      if(paymentAdded){
        if(reqSession === CURRENTSESSION && req.body.paymentLedgerPage){
          await userModel.findByIdAndUpdate({'userInfo.userId': req.body.userId},{
            $set:{
              'userInfo.paymentLedgerPage': req.body.paymentLedgerPage
            }
          })
        }
        const RedisPaymentKey =`payment-${req.body.class}-${reqSession}`
        redisDeleteCall({key:RedisPaymentKey})
        return res.status(200).json({
          success: true,
          message: "Payment Added successfully.",
          invoiceId: newInvoiceCreate.invoiceId
        })
      }else{
        await invoiceModel.deleteOne({_id:newInvoiceCreate._id}) 
        return res.status(200).json({
          success: false,
          message: "Payment not added, Please try again!",
        })
      }
    }catch(err){
      if(newInvoiceCreatedId){
        await invoiceModel.deleteOne({_id:newInvoiceCreatedId}) 
      }
      console.log(err)
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
  },

  getPaymentDetail: async (req, res) => {
    try{
      const CURRENTSESSION = getCurrentSession()
      let list =[]
      let selectedClass=''
      let reqSession= req.query.session || CURRENTSESSION
      let searchStr = req.query.searchStr? (req.query.searchStr).trim():''
      let searchParam={}
      let userIdParam={}
      let deletedParam = {'deleted':false}
      let classParam={'userInfo.class':'1 A'}
      let sessionParam= {'session':req.query.session}
      const roleParam={'userInfo.roleName':'STUDENT'}
      if(req.query.selectedClass){
        selectedClass = req.query.selectedClass
        //classParam={'userInfo.class':req.query.selectedClass}
        classParam={'class':req.query.selectedClass}
      }
      const redisClient = getRedisClient()
      // await redisClient.flushDb()
      const RedisPaymentKey =`payment-${selectedClass}-${reqSession}`
      if(selectedClass && !req.query.userId  && redisClient && await redisClient.exists(RedisPaymentKey)){
          let cacheList = await redisClient.get(RedisPaymentKey)
          list = JSON.parse(cacheList)
          return res.status(200).json({
            success: true,
            message: "Payment detail get successfully(Cache).",
            data: list
          })
      }
      if (searchStr && searchStr !== "" && searchStr !== undefined && searchStr !== null){
        searchParam={
          $or:[
            {'userInfo.fullName': new RegExp(searchStr, 'i')},
            {'userInfo.fatherName': new RegExp(searchStr, 'i')},
            {'userInfo.motherName': new RegExp(searchStr, 'i')},
            {'userInfo.email': new RegExp(searchStr, 'i')},
            {'userInfo.phoneNumber': new RegExp(searchStr, 'i')},
            {'userInfo.phoneNumber1': new RegExp(searchStr, 'i')},
            {'userInfo.phoneNumber2': new RegExp(searchStr, 'i')},
            {'userInfo.aadharNumber':new RegExp(searchStr, 'i')},
            {'userInfo.userId':new RegExp(searchStr, 'i')}
          ]
        }
      }
      if(req.query.userId){
          classParam={}
          searchParam={}
          //userIdParam={'userInfo.userId': req.query.userId}
          userIdParam={'userId': req.query.userId}
      }
      if(req.query.selectedPhone){
        const phoneNoUserIds = await userModel.find({$and:[activeParam,{$or:[{'userInfo.phoneNumber1':req.query.selectedPhone},{'userInfo.phoneNumber2':req.query.selectedPhone}]}]}) 
        classParam={}
        searchParam={}
        //userIdParam={'userInfo.userId': req.query.userId}
        userIdParam={'userId':{$in:[...phoneNoUserIds.map(data=> data.userInfo.userId)]}}
      }
      
      //let students= await userModel.find({$and:[ activeParam, classParam, roleParam, searchParam, userIdParam]})
      const busRouteFareList = await vehicleRouteFareModel.find({session:reqSession})
      const monthlyFeeList = await monthlyFeeListModel.find({session: reqSession})
      //let payOptionList= await payOptionModel.find()
   
      //let paymentRecieverUserList = await userModel.find({$and:[activeParam,{'userInfo.roleName':{$in:['ADMIN','ACCOUNTANT']}},{'userInfo.userId':{$nin:['918732']}}]}) 
      // if(students && students.length){
      //   const userIds= students.map(data=> data.userInfo.userId)
      //   let payDetail= await paymentModel.find({$and:[{userId:{$in:[...userIds]}}, sessionParam]})
      
      //   const newList=  await Promise.all(students.map(async(sData)=> {
      //     let condInvParam ={$and:[{'userId': sData.userInfo.userId},{'session': req.query.session},{deleted: false},{paidStatus: true}]}
      //     const invoiceData = await invoiceModel.find(condInvParam)
      //     let userPayDetail =(payDetail && payDetail.length)? payDetail.find(data=> data.userId ===sData.userInfo.userId): undefined
      //                                         //(sData, userPayDetail, monthlyFeeList, busRouteFareList)
      //     const monthPayDetail= getMonthPayData(sData, userPayDetail, monthlyFeeList, busRouteFareList)
      //     return{
      //       sData,
      //       userPayDetail: userPayDetail? userPayDetail: undefined,
      //       ...monthPayDetail,
      //       preDueAmount: userPayDetail && userPayDetail.dueAmount?userPayDetail.dueAmount:0,
      //       preExcessAmount: userPayDetail && userPayDetail.excessAmount?userPayDetail.excessAmount:0,   
      //       userInvoiceDetail: invoiceData
      //     }
      //   }))
      //   return res.status(200).json({
      //     success: true,
      //     message: "Payment detail get successfully.",
      //     data: newList
      //   })
      // }else{
      //   return res.status(200).json({
      //     success: false,
      //     message: "Payment detail not found"
      //   })
      // }
     
      const allPayDetail= await paymentModel.find({$and:[sessionParam, classParam, userIdParam, deletedParam]})
     
      if(allPayDetail && allPayDetail.length>0){
        const userIds= allPayDetail.map(data=> data.userId)
        const allStudents = await userModel.find({'userInfo.userId': {$in:[...userIds]}})
        const PREV_SESSSION = previousSession()
        const allPreviousPayDetail = reqSession===CURRENTSESSION? await paymentModel.find({$and:[{userId:{$in:[...userIds]}}, {session:PREV_SESSSION}]}):undefined
        const prev_busRouteFareList = await vehicleRouteFareModel.find({session:PREV_SESSSION})
        const prev_monthlyFeeList = await monthlyFeeListModel.find({session: PREV_SESSSION})
        for (const it of allPayDetail) {
          let prevAmtDue=0
          const sData= allStudents.find(data=> data.userInfo.userId=== it.userId)
          if(!sData){
            continue;
          }
         
          const previousPayDetail = reqSession===CURRENTSESSION? allPreviousPayDetail.find(data=> data.userId=== it.userId) || undefined : undefined
          const condInvParam ={$and:[{'userId': sData.userInfo.userId},{'session': req.query.session},{deleted: false},{paidStatus: true}]}
          const invoiceData = await invoiceModel.find(condInvParam)
          const userPayDetail = it
                                             //(sData, userPayDetail, monthlyFeeList, busRouteFareList, session)
          const monthPayDetail= getMonthPayData(sData, userPayDetail, monthlyFeeList, busRouteFareList, reqSession)

          if(previousPayDetail){

            // Main logic
            const prevMonthPayDetail = getMonthPayData(sData, previousPayDetail, prev_monthlyFeeList, prev_busRouteFareList, previousSession());
            let dueAmt = 0;
            const feeData = prev_monthlyFeeList.find(data => data.className === previousPayDetail.class);
            const isPrevOtherPay= previousPayDetail && previousPayDetail.other && previousPayDetail.other.length > 0? true:false
            const isAnnualExamFeeNotPaid = isPrevOtherPay? !previousPayDetail.other.some(data => data.name === 'ANNUAL EXAM') : true
            const isHalfExamFeeNotPaid = isPrevOtherPay? !previousPayDetail.other.some(data => data.name === 'HALF YEARLY EXAM') : true
            if (sData.userInfo.admissionDate) {
                const admissionDate = new Date(sData.userInfo.admissionDate);
                const admissionMonthIndex = admissionDate.getFinancialMonthIndex();
                const admissionSession = getAdmissionSession(sData.userInfo.admissionDate);
                const isCurrentSession = isAdmissionInCurrentSession(admissionSession, previousSession());
                if(isCurrentSession){
                  if(admissionMonthIndex<HalfYearlyMonthIndex && isHalfExamFeeNotPaid){
                    dueAmt += addExamFees(feeData, false, true)
                  }
                  if(admissionMonthIndex<AnualExamMonthIndex && isAnnualExamFeeNotPaid){
                    dueAmt += addExamFees(feeData, true, false)
                  }
                }else{
                  if(isHalfExamFeeNotPaid){
                    dueAmt += addExamFees(feeData, false, true)
                  }
                  if(isAnnualExamFeeNotPaid){
                    dueAmt += addExamFees(feeData, true, false)
                  }
                }
            } else {
              if(isHalfExamFeeNotPaid){
                dueAmt += addExamFees(feeData, false, true)
              }
              if(isAnnualExamFeeNotPaid){
                dueAmt += addExamFees(feeData, true, false)
              }
            }  

            if(previousPayDetail && previousPayDetail.otherDue){
              for(const key in previousPayDetail.otherDue) {
                dueAmt+= previousPayDetail.otherDue[key]? Number(previousPayDetail.otherDue[key]):0;
              }
            }
            //console.log("prevMonthPayDetail", prevMonthPayDetail)
            monthList.map(mData=>{
              if(prevMonthPayDetail[mData].payEnable){
                if(prevMonthPayDetail[mData].paidDone){
                 // paidAmt+=prevMonthPayDetail[mData].amt?Number(prevMonthPayDetail[mData].amt):0
                }else{
                  dueAmt+=Number(prevMonthPayDetail[mData].monthlyFee)+ Number(prevMonthPayDetail[mData].busFee)
                }
              }
            })
          
            prevAmtDue= dueAmt + Number(previousPayDetail.dueAmount) - Number(previousPayDetail.excessAmount)                                       
          }
          const newData= {
            sData,
            userPayDetail:it,
            ...monthPayDetail,
            preDueAmount: it.dueAmount,
            preExcessAmount: it.excessAmount,   
            userInvoiceDetail: invoiceData,
            prevYearAmtDue: reqSession===CURRENTSESSION? prevAmtDue : undefined
          }
          list.push(newData)
        }
        if(selectedClass && !req.query.userId){
          redisSetKeyCall({key:RedisPaymentKey, data:JSON.stringify(list)})
        }

        return res.status(200).json({
          success: true,
          message: "Payment detail get successfully.",
          data: list
        })
      }else{
        return res.status(200).json({
          success: false,
          message: "Payment detail not found"
        })
      }
    }catch(err){
      console.log(err)
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
  },

  deletePayment: async (req, res) => {
    try{
      if(req.query.paymentId){
        //let payDetail= await paymentModel.findOneAndUpdate({_id:req.query.paymentId },{deleted: true})
        return res.status(200).json({
          success: true,
          message: "Payment detail deleted.",
        })
      }else{
        return res.status(200).json({
          success: false,
          message: "Payment detail not found"
        })
      }
    }catch(err){
      console.log(err)
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
  },

  getAllInvoice: async(req, res)=>{
    try{
      let invoiceData
      let limit = (req.query.limit && parseInt(req.query.limit) > 0 )? parseInt(req.query.limit):10
      let pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber) : 0 ;
      let totalCount=0
      let totalPaidAmount=0
      let isDesc= req.query.isDesc? req.query.isDesc=='true'? 'desc':'asc': 'desc'
      let sortOrder={'created':isDesc}
      let startOfDateRange;
      let endOfDateRange;
      let dayCount
      const topAdminRole = req.user.userInfo.roleName==='TOPADMIN'?true:false
      const timeZone ='Asia/Kolkata'
      const TodayDate = moment.tz(timeZone).endOf('day').toDate()
      if(req.query.fromDate&&req.query.toDate){
           startOfDateRange = moment.tz(req.query.fromDate, timeZone).startOf('day').toDate().toISOString();
           endOfDateRange = moment.tz(req.query.toDate, timeZone).endOf('day').toDate().toISOString();
           dayCount = moment(TodayDate).diff(startOfDateRange, 'days')+1;
           
      }else if(req.query.fromDate && !req.query.toDate){
          startOfDateRange = moment.tz(req.query.fromDate, timeZone).startOf('day').toDate().toISOString();
         
          dayCount = moment(TodayDate).diff(startOfDateRange, 'days')+1;
      }

   
      console.log("dayCount", dayCount)
      let dateFilter={};
      if(req.query.fromDate && !req.query.toDate){
        if(req.query.dateFilterType && req.query.dateFilterType==='sub_date'){
          dateFilter = {
            'invoiceInfo.submittedDate':{
                '$gte':startOfDateRange
            }
          }
        }else{
          dateFilter = {
            'created':{
                '$gte':startOfDateRange
            }
          }
        }
      }
       if(req.query.fromDate && req.query.toDate){
        if(req.query.dateFilterType && req.query.dateFilterType==='sub_date'){
          dateFilter = {
            'invoiceInfo.submittedDate':{
              "$gte": startOfDateRange,
              "$lte": endOfDateRange
            }
          }
        }else{
          dateFilter = {
            'created':{
              "$gte": startOfDateRange,
              "$lte": endOfDateRange
            }
          }
        }
      }

      console.log("dateFilter", dateFilter)

      if(req.query.invoiceId){
        invoiceData= await invoiceModel.find({invoiceId:req.query.invoiceId })
        dateFilter={}
        dayCount= undefined
      }else{
        if(req.query.sortOrder && req.query.sortOrder==='sub_date'){
          sortOrder = {'invoiceInfo.submittedDate': isDesc}
        }
        if(req.query.sortOrder && req.query.sortOrder==='entry_date'){
          sortOrder = {'created': isDesc}
        }
   
       const sumData = await invoiceModel.aggregate([
                {
                    "$match": {
                        ...dateFilter,
                        "deleted": false
                    }
                },
                {
                    "$group": {
                        "_id": null,
                        "totalAmount": { "$sum": "$amount" }
                    }
                },
                {
                  $project: {
                    _id: 0,
                    totalAmount: 1
                  }
              }
        ])
        // console.log("sumData", sumData[0]? sumData[0].totalAmount:0)
        totalPaidAmount= sumData[0]? sumData[0].totalAmount:0
        totalCount= await invoiceModel.find(dateFilter).countDocuments()
        invoiceData= await invoiceModel.find(dateFilter).sort(sortOrder).limit(limit).skip(limit * pageNumber)
      }
      if(invoiceData && invoiceData.length>0){
        let allInvoice=[]
          for (let it of invoiceData) {
            if(it.invoiceInfo.userId){
              const userData =  await userModel.findOne({'userInfo.userId': it.invoiceInfo.userId})
              it.invoiceInfo['userData']= userData
            }
              if(it.invoiceInfo.paymentRecieverId){
              const recieverData = await userModel.findOne({'_id': it.invoiceInfo.paymentRecieverId})
                //console.log("recieverDatarecieverDatarecieverData", recieverData)
                it.invoiceInfo['recieverName'] = recieverData && recieverData.userInfo &&recieverData.userInfo.fullName? recieverData.userInfo.fullName:'N/A'
              }
             allInvoice.push(it)
          }
        return res.status(200).json({
          success: true,
          message: "Invoice detail get successfully.",
          data: allInvoice,
          pageSize:totalCount>0? Math.floor(totalCount/limit)+1:0,
          totalCount:totalCount,
          totalPaidAmount: topAdminRole? totalPaidAmount : (dayCount && dayCount<=32) ?totalPaidAmount:0
        })
      }else{
        return res.status(200).json({
          success: false,
          message: "Invoice detail not found"
        })
      }
    }catch(err){
      console.log(err)
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
  },
  getInvoicesByUserId: async(req, res)=>{
    try{

      //const invoiceAll= await invoiceModel.find({})
     
      // let invIds=[]
      // for (const it of invoiceAll) {
      //     if(it.invoiceInfo.paidAmount!==it.invoiceInfo.totalGrandAmount){
      //       invIds.push(it.userId)
      //     }
      // }
      //console.log("invIdsinvIdsinvIds", new Set( invIds))
        let condParam ={$and:[{'userId': req.query.userId},{'session': req.query.session}]}
        //let condParam ={$and:[{'userId': req.query.userId}]}

        const invoiceData = await invoiceModel.find(condParam)
          return res.status(200).json({
            success: true,
            message: "Invoice detail get successfully.",
            data: invoiceData
          })
      }catch(err){
        console.log(err)
        return res.status(400).json({
          success: false,
          message: err.message,
        })
      }
  },

  deleteTransaction:async(req, res)=>{
        try {
          const CURRENTSESSION = getCurrentSession()
          
          const invoiceData= await invoiceModel.findOne({invoiceId: req.body.invoiceId})
          if(invoiceData && req.body.session && (invoiceData.invoiceType==='MONTHLY'|| invoiceData.invoiceType==='EXAM_FEE' || invoiceData.invoiceType==='OTHER_PAYMENT') ){
            const paymentData= await paymentModel.findOne({$and:[{'userId': invoiceData.userId},{session: req.body.session}]})
            if(paymentData){
              const user = await userModel.findOne({"userInfo.userId": paymentData.userId})
              let unsetMonthName={}
              if(invoiceData.invoiceInfo.feeList){
                for (const it of invoiceData.invoiceInfo.feeList) {
                  unsetMonthName={
                   ...unsetMonthName,
                   [it.month]: ""
                  }
                }
              }
              if(invoiceData.invoiceInfo.otherFeeList){
                for (const it of invoiceData.invoiceInfo.otherFeeList) {
                  paymentData.other= paymentData.other.filter(data=> data.name!==it.name )
                }
              }
              const dueAmount =  Number(paymentData.dueAmount) - Number(invoiceData.invoiceInfo.dueAmount)
              const excessAmount = Number(paymentData.excessAmount) - Number(invoiceData.invoiceInfo.excessAmount)
              const totalFineAmount = Number(paymentData.totalFineAmount) - Number(invoiceData.invoiceInfo.fineAmount)
              const updatePaymentData= {
                'dueAmount' :  dueAmount>0? dueAmount: 0,
                'excessAmount' : excessAmount>0? excessAmount: 0,
                'totalFineAmount' : totalFineAmount>0?totalFineAmount:0,
                'other':paymentData.other,
                '$unset': unsetMonthName
              }
              const updatedPayement = await paymentModel.findOneAndUpdate({'_id': paymentData._id},updatePaymentData,{new: true})
              // delete payemet data if no month available
              // const allKeys = Object.keys(JSON.parse(JSON.stringify(updatedPayement)))
              // if(allKeys.some( key => monthList.includes(key))===false){
              //   await paymentModel.deleteOne({'_id': paymentData._id})
              // }
              if(updatedPayement){
                  const RedisPaymentKey =`payment-${user.userInfo.class}-${req.body.session}`
                  if(CURRENTSESSION === req.body.session) redisDeleteCall({key:RedisPaymentKey})
            
                  await invoiceModel.findOneAndUpdate({'_id': invoiceData._id},{deleted: true})
                  return res.status(200).json({
                    success: true,
                    message: "payment updated successfully"
                  })
              }else{
                  return res.status(200).json({
                    success: false,
                    message: "payment not updated."
                  })
              }
            }else{
              return res.status(200).json({
                success: false,
                message: "payment data not found."
              })
            }

          }else{
            return res.status(200).json({
              success: false,
              message: "Invoice detail not found."
            })
          }
        } catch (err) {
          console.log(err)
          return res.status(400).json({
            success: false,
            message: err.message,
          })
        }
  },

  initiatePayment: async (req, res) => {
    const MERCHANT_ID = "PGTESTPAYUAT86"//"PGTESTPAYUAT";
    const PHONE_PE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
    const SALT_INDEX = 1;
    const SALT_KEY = "96434309-7796-489d-8924-ab56988a6076"//099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
    const APP_BE_URL = "http://localhost:3010/api/"; // our application
    let userId = "MUID123";
    let merchantTransactionId = uniqid();
    const { amount, orderId, customerId } = req.body;
    
    const normalPayLoad = {
      "merchantId": MERCHANT_ID,
      "merchantTransactionId": merchantTransactionId,
      "merchantUserId": userId,
      "amount": Number(amount) * 100,
      //"redirectUrl": "http://localhost:3010/payment",
      //"redirectMode": "REDIRECT",
      //redirectUrl: `http://localhost:3000/payment`, //${APP_BE_URL}/payment/validate/${merchantTransactionId}`,
      //redirectMode: "POST",
      "callbackUrl": "https://bmmsbackendapp.onrender.com/api/public/paymentCallback",
      "mobileNumber": "9999999999",
      "paymentInstrument": {
        "type": "PAY_PAGE"
      }
    };
  
    //const payloadString = JSON.stringify(payload);
    //const xVerify = generateHash(payloadString +'/pg/v1/pay'+ PHONEPE_MERCHANT_SALT) + '###' + PHONEPE_MERCHANT_KEY;
     // Make a base64-encoded payload
      let bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
      let base64EncodedPayload = bufferObj.toString("base64");

       // X-VERIFY => SHA256(base64EncodedPayload + "/pg/v1/pay" + SALT_KEY) + ### + SALT_INDEX
        let string = base64EncodedPayload + "/pg/v1/pay" + SALT_KEY;
        let sha256_val = sha256(string);
        let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;
        axios.post(
          `${PHONE_PE_HOST_URL}/pg/v1/pay`,
          { request: base64EncodedPayload },
          {
            headers: {
              "Content-Type": "application/json",
              "X-VERIFY": xVerifyChecksum,
              accept: "application/json",
            },
          }
        )
        .then(function (response) {
          console.log("response->---------->", response.data);
          console.log("response->---------->", response.data.data.instrumentResponse.redirectInfo.url);
          // res.redirect(response.data.data.instrumentResponse.redirectInfo.url);
          // res.send(response.data)
          //res.status(200).send(response.data);
          return res.status(200).json({
            success: true,
            data: response.data
          })
        })
        .catch(function (error) {
          console.log("errrrr", error)
          //res.send(error);
        });
  
    // try {
    //   const response = await axios.post('https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay', payload, {
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'X-VERIFY': xVerify,
    //     },
    //   });
    //   res.status(200).send(response.data);
    // } catch (error) {
    //   console.log("error", error)
    //   res.status(500).send(error.response ? error.response.data : error.message);
    // }
  },
 sendMessage: async (req, res) => {
    let { userId, toNumber, message , templateType, otherDetail} = req.body;

    console.log("req.bodyreq.body", req.body)
    const user = await userModel.findOne({ 'userInfo.userId': userId });
    try {
      // Share Password template
      if (templateType && templateType === 'sharePassword') {
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'Message not sent. User not found'
          });
        }
    
        const password = passwordDecryptAES(user.userInfo.password);
        const WSData = {
          userId: userId,
          password: password,
          name: user.userInfo.fullName,
          sendMessageFor:'Password Share'
        };
        await mesageApi(toNumber, message, templateType, WSData);
      }
    
      // General template
      if (templateType && templateType === 'general') {
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'Message not sent. User not found'
          });
        }
        if (!otherDetail || !otherDetail.amount || (otherDetail.amount && !Number(otherDetail.amount)>0)) {
          return res.status(404).json({
            success: false,
            message: 'Message not sent. amount not found'
          });
        }
    
        const WSData = {
          title: "फीस संबंधित सूचना",
          message: `प्रिय अभिवावक, आपको सूचित किया जाता है कि ${user.userInfo.fullName} Class-${user.userInfo.class} का महीना/अन्य फीस  ${otherDetail.amount}/- बाकी है। लेट फाइन से बचने के लिए कृपया देय तिथि से पहले जमा कर दें। यदि पहले ही जमा कर दिया गया है तो सूचित कर दें।`,
          userId: userId,
          sendMessageFor:'Due Messaage',
          englishMessage: `Dear Parent, You are informed that the monthly/other fees of ${user.userInfo.fullName} Class- ${user.userInfo.class} is Rs. ${otherDetail.amount}/- pending. Please submit before the due date to avoid late fine. If it has already been deposited then please inform.`
          //message: `प्रिय अभिभावक, ${user.userInfo.fullName} कक्षा का महीना शुल्क ${otherDetail.amount}/- जमा कर दें । लेट फाइन से बचने के लिए कृपया देय तिथि से पहले जमा कर दें। यदि पहले ही जमा कर दिया गया है तो सूचित कर दें।`
         };
          await mesageApi(toNumber, message, templateType, WSData);
      }
    
      // Test template
      if (templateType && templateType === 'test') {
        const WSData = {
          userId: '',
          name: 'N/A',
          sendMessageFor: 'Test'
        };
        await mesageApi(toNumber, message, templateType, WSData);
      }
    
      async function mesageApi(number, msg, tempType, data) {
        const response = await whatsAppMessage(number, msg, tempType, data);
    
        if (response) {
          return res.status(200).json({
            success: true,
            message: 'Message sent successfully'
          });
        } else {
          return res.status(500).json({
            success: false,
            message: 'Message not sent.'
          });
        }
      }
    } catch (err) {
      console.error(err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },

  getAllMessage:async(req, res)=>{
    try {
      const messageData = await messageModel.find({})
      if(messageData && messageData.length>0){
        return res.status(200).json({
          success: true,
          message: 'Message get successfully',
          data:{
            list: messageData
          }
        })
      }else{
        return res.status(200).json({
          success: false,
          message: 'Message not found.'
        })
      }
    } catch (err) {
      console.log(err)
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    } 
  },
  getAllNotes:async(req, res)=>{
    try {
      let searchStr=null
      if(req.query.searchStr){
        searchStr= req.query.searchStr
      }
    const notesData=  await userModel.aggregate([
        {
          $match: {
            // Match by userId if provided
            ...(searchStr ? { "userInfo.userId": searchStr } : {})
          }
        },
        {
          $unwind: "$userInfo.notes" // Unwind the notes array to get individual notes
        },
        {
          $match: {
            // Match by task if provided (assuming partial search with case-insensitive matching)
            ...(searchStr ? { "userInfo.notes.task": { $regex: searchStr, $options: "i" } } : {})
          }
        },
        {
          $project: {
            _id: 0,                    // Exclude _id
            userId: "$userInfo.userId", // Include userId
            userFullName: "$userInfo.fullName",
            class: "$userInfo.class", // Include class
            task: "$userInfo.notes.task", // Include task from notes
            isCompleted: "$userInfo.notes.isCompleted", // Include isCompleted
            created: "$userInfo.notes.created", // Include date for sorting
            delete: "$userInfo.notes.delete" ,// Include delete field
            insertedName: "$userInfo.notes.insertedName" // Include delete field
          }
        },
        {
          $sort: { created: 1 } // Sort by date in ascending order (use -1 for descending order)
        }
      ])
      console.log("notesData")
      if(notesData && notesData.length>0){
        return res.status(200).json({
          success: true,
          message: 'Notes get successfully',
          data: notesData
        })
      }else{
        return res.status(200).json({
          success: false,
          message: 'Notes not found.'
        })
      }
    } catch (err) {
      console.log(err)
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    } 
  },
  
  getAllImages:async(req, res)=>{
    const bucket = admin.storage().bucket();
    try {
      const selectedClass = req.query.selectedClass || undefined
      const allStudentPhoto = await userModel.find({$and:[activeParam, {'userInfo.roleName':'STUDENT'},{'document.stPhoto':{$exists:true}},{'userInfo.class': selectedClass}]},{'document.stPhoto':1})
      //console.log("allStudentPhoto", allStudentPhoto)
      const studentPhotoSet = new Set(allStudentPhoto.map((item) => item.document.stPhoto));
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 5)
      const [files] = await bucket.getFiles({ prefix: "" }); // Replace 'images/' with your folder path
      const urls = await Promise.all(
        files
          .filter((file) => {
            const fileName = file.name.replace('images/', '');
            return studentPhotoSet.has(fileName); // Faster lookup using a Set
          })
          .map(async (file) => {
            const [url] = await file.getSignedUrl({
              action: 'read',
              expires: expirationTime,
            });
            return { url, name: file.name.replace('images/', '') };
          })
      );
      return res.status(200).json({
        success: true,
        message: 'Images urls get successfully',
        data: urls
      })
    } catch (error) {
      console.error("Error while fetching image URLs:", error);
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
  },
  resetRedisCashe:async (req,res)=> {
    try {
      const redisClient = getRedisClient()
      if(redisClient){
        await redisClient.flushAll()
        return res.status(200).json({
          success: true,
          message: 'Redis cache flushed successfully.',
        })
      }else{
        return res.status(200).json({
          success: false,
          message: 'Redis connection not available',
        })
      }
    } catch (error) {
      console.error("Error while redis cache flushing :", error);
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
  },

  userPaymentSetting:async(req, res)=>{
    try {
      const {busOptionEnable, busRouteId, userId, paymentId, session}= req.body
      const userDetail = await userModel.findOne({$and:[activeParam,{'userInfo.userId': userId}]})
      const paymentDetail = await paymentModel.findOne({_id: paymentId})
      if(userId && paymentId && userDetail && paymentDetail){
        const payData = {
          busService: busOptionEnable ? true: false,
          busRouteId: busRouteId 
        } 
        if(userDetail.userInfo.session === paymentDetail.session){
          await userModel.findOneAndUpdate({_id: userDetail._id},{'userInfo.busService': payData.busService, 'userInfo.busRouteId': payData.busRouteId})
        } 
        const payDetailUpdated = await paymentModel.findOneAndUpdate({_id: paymentDetail._id},{...payData},{$new :true})
        if(payDetailUpdated){
          const  RedisPaymentKey =`payment-${payDetailUpdated.class}-${payDetailUpdated.session}`
          redisDeleteCall({key:RedisPaymentKey})

          return res.status(200).json({
            success: true,
            message: 'Pay detail updated successfully'
          })
        }else{
          return res.status(200).json({
            success: true,
            message: 'Pay detail not updated. Please contact to admin.'
          })
        }
      }else{
        return res.status(400).json({
          success: false,
          message: 'User not found.'
        })
      }
    } catch (err) {
      console.log(err)
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    } 
  },

  createBuckup: async (req, res) => {
    sendDailyBackupEmail()

    // let url = URL;
    // let csv

    // mongodb.connect(
    //   url,
    //   { useNewUrlParser: true, useUnifiedTopology: true },
    //   (err, client) => {
    //     if (err) throw err;
    
    //     client
    //       .db("bmms")
    //       .collection("users")
    //       .find({})
    //       .toArray((err, data) => {
    //         if (err) throw err;
            
    //         console.log(data);
    //         const ws = fs.createWriteStream("users.csv");
    //         // TODO: write data to CSV file
    //         csv = fastcsv
    //         .write(data, { headers: true })
    //         .on("finish", function() {
    //           console.log("Write to users.csv successfully!");
    //         })
    //         .pipe(ws);
    //          //sendDailyBackupEmail(data)
    //         client.close();
    //       });

    //       res.setHeader('Content-disposition', 'attachment; filename=' + 'users.csv');
    //       res.set('Content-Type', 'text/csv');
    //       res.status(200).send(csv);
    //   }
    // );

    return res.status(200).json({
      success: false,
      message: "backup created"
    })

    // try {
    //   // console.log("response", response);
    //   const conn = mongoose.createConnection(URL, {
    //     useNewUrlParser: true,
    //     useUnifiedTopology: true,
    //   });
    //   conn.on("open", function () {
    //     conn.db.listCollections().toArray(function (err, allCollectionNames) {
    //       if (err) {
    //         console.log(err);
    //         return res.status(200).json({
    //           success: false,
    //           message: "Backup collection not get.",
    //         });
    //       }
    //       // let collections = allCollectionNames
    //       //   .map((data) => {
    //       //     return { dbName: data.name };
    //       //   })
    //       //   .filter((fdata) => fdata.dbName.includes("FundingSource_"));
    //       conn.close();

    //       return res.status(200).json({
    //         success: true,
    //         message: "Backup collection get Successfully",
    //         allCollectionNames,
    //       });
    //     });
    //   });
    // } catch (err) {
    //   console.log(err);
    //   return res.status(400).json({
    //     success: false,
    //     message: "Something went wrong",
    //     error: err.response,
    //   });
    // }

  //   // try {
  //   //   let curr_date1 = moment.tz(Date.now(), "Asia/Kolkata");
  //   //   let dd = curr_date1.date() - 1;
  //   //   let mm = curr_date1.month() + 1;
  //   //   let yyyy = curr_date1.year();
  //   //   let collectionName = `users${dd}_${mm}_${yyyy}`;
  //   //   userModel.aggregate([{ $out: collectionName }], (err, response) => {
  //   //     if (err) {
  //   //       console.log("err", err);
  //   //       return res.status(200).json({
  //   //         success: false,
  //   //         message: "Backup not created.",
  //   //       });
  //   //     } else {
  //   //       const conn = mongoose.createConnection(URL, {
  //   //         useNewUrlParser: true,
  //   //         useUnifiedTopology: true,
  //   //       });
  //   //       conn.on("open", function () {
  //   //         conn.db
  //   //           .listCollections()
  //   //           .toArray(function (err, allCollectionNames) {
  //   //             if (err) {
  //   //               console.log(err);
  //   //               return res.status(200).json({
  //   //                 success: false,
  //   //                 message: "Backup not created.",
  //   //               });
  //   //             }
  //   //             // let collections = allCollectionNames
  //   //             //   .map((data) => data.name)
  //   //             //   .filter((fdata) => fdata.includes("FundingSource_"));
  //   //             conn.close();
  //   //             // let todayCollection = collections.find(
  //   //             //   (data) => data == collectionName
  //   //             // );
  //   //             // console.log("todayCollection", todayCollection);
  //   //             if (allCollectionNames) {
  //   //               return res.status(200).json({
  //   //                 success: true,
  //   //                 message: "Backup Successfully",
  //   //                 allCollectionNames,
  //   //               });
  //   //             } else {
  //   //               return res.status(200).json({
  //   //                 success: false,
  //   //                 message: "Backup not created.",
  //   //               });
  //   //             }
  //   //           });
  //   //       });
  //   //     }
  //   //   });
  //   // } catch (err) {
  //   //   console.log(err);
  //   //   return res.status(400).json({
  //   //     success: false,
  //   //     message: "Something went wrong",
  //   //     error: err.response,
  //   //   });
  //   // }
  },

  


  /// blog website
  createBlogPost: async (req, res) => {

    let blogReqBody = req.body
    try {
      // function slugify(str) {
      //   return String(str)
      //     .normalize('NFKD') // split accented characters into their base characters and diacritical marks
      //     .replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
      //     .trim() // trim leading or trailing whitespace
      //     .toLowerCase() // convert to lowercase
      //     .replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
      //     .replace(/\s+/g, '-') // replace spaces with hyphens
      //     .replace(/-+/g, '-'); // remove consecutive hyphens
      // }
      let title = blogReqBody.title
      let slugTitle= ''
      if(!title){
        return res.status(400).json({
          success: false,
          message: "Title required.",
        });
      }
      if(title){
        slugTitle = slugify(title, {
          replacement: '-',  // replace spaces with replacement character, defaults to `-`
          remove: undefined, // remove characters that match regex, defaults to `undefined`
          lower: true,       // convert to lower case, defaults to `false`
          strict: false,     // strip special characters except replacement, defaults to `false`
          locale: 'en',      // language code of the locale to use
          trim: true,        // trim leading and trailing replacement chars, defaults to `true`
          remove: /[*+~.()'"!:@]/g       
        })
        if(slugTitle){
          const foundSlug= await blogModel.find({slugTitle:slugTitle})
          if(foundSlug && foundSlug.length>0){
            return res.status(400).json({
              success: false,
              message: "Title already exist.",
            });
          }
        }else{
          return res.status(400).json({
            success: false,
            message: "Title not proper string.",
          });
        }
      }
 
      blogReqBody['slugTitle']= slugTitle

      let newBlogPost = new blogModel(blogReqBody)
      //   {
      //     title:req.body.title,
      //     subTitle:req.body.subTitle,
      //     content:req.body.content,
      //     postImageUrl:req.body.postImageUrl,
      //     category:req.body.category,
      //   }
      // )
      await newBlogPost.save()
      return res.status(200).json({
        success: true,
        message: "New Blog Post created",
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Blog Post not created.",
        error: error.message,
      });
    }
  },
  deleteBlogPost: async (req, res) => {
    try {
      const data= await blogModel.findOneAndDelete({_id:req.body.id})
      return res.status(200).json({
        success: true,
        message: "Delete Blog Post successfuly",
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },

  updateBlogPost: async (req, res) => {
    try {
      const updateData= blogModel.findOneAndUpdate({_id:req.body.blogPostNumber},req.body)
      return res.status(200).json({
        success: true,
        message: "Blog Post updated",
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },

  uploadImage: async(req, res, next)=>{
    console.log("reqqqqqqqqqqqqqqqqqqqqqqqqBody", req.body.fileName)
    console.log("reqqqqqqqqqqqqqqqqqqqqqqqqfile", req.files.file)
    const file =  req.files.file
    try{
      cloudinary.uploader.upload(file.tempFilePath, {
        public_id: req.body.fileName,
        resource_type: 'image'
        },(error, result) => {
          if (!error) {
            // The image has been successfully uploaded.
            console.log('Upload Result:', result);
            return res.status(200).json({
              success: true,
              message:'Image uploaded success',
              data: result,
            });
          } else {
            // Handle the error.
            console.error('Upload Error:', error);
            return res.status(400).json({
              success: false,
              message:'Image not uploaded',
              data: error,
            });
          }
      });
    }catch(err){
      console.log("errrrrrrrrrrrr", err)
      return res.status(400).json({
        success: false,
        message:'Error while upload image',
        error: err.message,
      });
    }
  },
  uploadDocFireBase: async(req, res, next)=>{
    //console.log("reqqqqqqqqqqqqqqqqqqqqqqqqBody", req.body.fileName)
    //console.log("reqqqqqqqqqqqqqqqqqqqqqqqqfile", req.files.image)
   
    try{
      const { userId, docType, fileName } = req.body;
      let userData= await userModel.findOne({'userInfo.userId': userId})

      const ocrPromise = new Promise(async (resolve, reject) => {
        if (docType==='stAadharFside') {
          //console.log("1111111111111")
          try {
            const base64data = 'data:image/jpeg;base64,'+Buffer.from(req.files.image.data, 'binary').toString('base64');
            const result = await ocrSpace(base64data, {
              apiKey: OCR_API_KEY,
              language: 'eng',
            });
            //console.log("222222222222222", result)
            const extractedText =result?.ParsedResults?.[0]?.ParsedText || '';
            //console.log("333333333333", extractedText)

            const uidaiRegex = /\b\d{4}\s\d{4}\s\d{4}\b/;
            const matches = extractedText.match(uidaiRegex);
            resolve(matches ? matches[0] : null);
          } catch (error) {
            console.log("Error", error)
            resolve(null);
          }
        } else {
          resolve(null);
        }
      })

      const timeoutPromise = new Promise((resolve, reject) => {
        if (docType==='stAadharFside') {
          setTimeout(() => 
            resolve('TIME_OUT')
          //reject(new Error('OCR processing timed out'))
          , 3000);
        }else{
          resolve(null)
        }
      });
  
      const uploadPromise= await uploadImageFireBase(req, userId, docType, fileName)
  
      const [ocrResult, imageData] = await Promise.all([
        docType==='stAadharFSide'? Promise.race([ocrPromise, timeoutPromise]) : ocrPromise,
        uploadPromise,
      ]);
      //console.log("4444444444", ocrResult)
      
      if(imageData && imageData.status===true){
        //console.log('docType', docType, "check",docType==='stAadharFside' )
        if(docType==='stAadharFside'){
          const aadharNumber = (ocrResult && ocrResult!=='TIME_OUT')? ocrResult.replace(/\s+/g, '') : '';
          //console.log('Extracted Aadhaar Number:', aadharNumber);
          userData.userInfo['aadharNumber'] = aadharNumber || userData.userInfo.aadharNumber
        }
        userData.document={
          ...userData.document,
            [docType]: fileName
        }
        await userModel.findOneAndUpdate({'_id': userData._id},userData)
        return res.status(200).json({
          success: true,
          message: imageData.message,
          data:{
            url: imageData.url,
            aadharNumber: userData.userInfo.aadharNumber
          }
        });
      }else{
        return res.status(400).json({
          success: false,
          message:imageData.message,
        });
      }
    }catch(err){
      console.log("errrrrrrrrrrrr", err)
      return res.status(400).json({
        success: false,
        message:'Error while upload image',
        error: err.message,
      });
    }
  },
  imageUplaodFireBase: async(req, res, next)=>{
    console.log("reqqqqqqqqqqqqqqqqqqqqqqqqBody", req.body.fileName)
    console.log("reqqqqqqqqqqqqqqqqqqqqqqqqfile", req.files.image)
   
    try{
      const userId= req.body.userId || '543543534'
      const docType= req.body.docType || 'stPhoto'
     const imageData= await uploadImageFireBase(req, userId, docType)
     if(imageData && imageData.status===true){
      return res.status(200).json({
        success: true,
        message: imageData.message,
        data:{
          url: imageData.url
        }
      });
     }else{
      return res.status(400).json({
        success: false,
        message:imageData.message,
      });
     }
    }catch(err){
      console.log("errrrrrrrrrrrr", err)
      return res.status(400).json({
        success: false,
        message:'Error while upload image',
        error: err.message,
      });
    }
  },

  removeDocFireBase: async(req, res, next)=>{
    //console.log("reqqqqqqqqqqqqqqqqqqqqqqqqBody", req.body.docType)
    //console.log("reqqqqqqqqqqqqqqqqqqqqqqqqfile", req.body.userId)
   
    try{
      const {userId, docType}= req.body
      let userData= await userModel.findOne({$and:[{'userInfo.userId': userId},{"userInfo.roleName": "STUDENT"}]})
      if(!userData){
        return res.status(400).json({
          success: false,
          message:'User not found',
        });
      }
      if(!userData.document){
        return res.status(400).json({
          success: false,
          message:'Any Doc/Photo not found.',
        });
      }
      console.log("userData.document[docType]", userData)
      if(!userData.document[docType]){
        return res.status(400).json({
          success: false,
          message:'Doc/Photo not found.',
        });
      }
      const fileName=  userData.document[docType] //`${docType}_${userId}.jpeg`
      const isRemoved= await removeDocFireBase(fileName)
      if(isRemoved){
          userData.document={
            ...userData.document,
            [docType]: ''
          }
          if(docType==='stAadharFside'){
            userData.userInfo['aadharNumber']=''
          }
          await userModel.findOneAndUpdate({'_id': userData.id}, userData)
          return res.status(200).json({
            success: true,
            message: 'Doc/Photo deleted successfully',
          });
      }else{
        return res.status(400).json({
          success: false,
          message:'Doc/Photo not deleted, Try again!',
        });
      }
    }catch(err){
      console.log("errrrrrrrrrrrr", err)
      return res.status(400).json({
        success: false,
        message:'Error while removing Doc/Photo',
        error: err.message,
      });
    }
  },



  //old apis
  updateRole: async (req, res, next) => {
    try {
      let fdata = await FundingSource.findOneAndUpdate(
        { "withDrawalHistory._id": req.body.transactionId },
        {
          $set: {
            "withDrawalHistory.$.status": true,
            "withDrawalHistory.$.paidDate": new Date(),
          },
        },
        (err, data) => {
          if (err) {
            next();
            return res.status(400).json({
              success: false,
              message: " Something went wrong.",
              error: err.message,
            });
          } else {
            return res.status(200).json({
              success: true,
              message: "Withdrawl updated.",
            });
          }
        }
      );
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Something went wrong",
        error: err.response,
      });
    }
  },

  getAllEmail: async (req, res) => {
    try {
      const emailData = await emailModel.find({});
      if (emailData) {
        return res.status(200).json({
          success: true,
          message: "Email data get Successfully",
          data: emailData,
        });
      } else {
        return res.status(200).json({
          success: false,
          message: "Email data not found.",
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Something went wrong",
        error: err.response,
      });
    }
  },
  getAllcronJobs: async (req, res) => {
    try {
      const cronjobData = await cronjobModel.find();
      if (cronjobData) {
        return res.status(200).json({
          success: true,
          message: "Cronjob data get Successfully",
          data: cronjobData,
        });
      } else {
        return res.status(200).json({
          success: false,
          message: "cronjob data not found.",
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Something went wrong",
        error: err.response,
      });
    }
  },
  getAllWithdrawals: async (req, res) => {
    try {
      const withdrawalsData = await FundingSource.find(
        {},
        {
          userId: 1,
          roiId: 1,
          withDrawalHistory: 1,
          bankingInformation: 1,
        }
      );
      if (withdrawalsData && withdrawalsData.length) {
        let withdrawal = [];
        withdrawalsData.forEach((it) => {
          if (it.withDrawalHistory && it.withDrawalHistory.length) {
            it.withDrawalHistory.forEach((element) => {
              let data = {
                roiId: it.roiId,
                userId: it.userId,
                actualAmount: element.actualAmount,
                amount: element.amount,
                date: element.data,
                status: element.status,
                transactionId: element._id,
                bankDetails: it.bankingInformation,
                date: element.date,
                paidDate: element.paidDate,
              };
              withdrawal.push(data);
            });
          }
        });

        return res.status(200).json({
          success: true,
          message: "Withdrawal data get Successfully",
          data: withdrawal,
        });
      } else {
        return res.status(200).json({
          success: false,
          message: "withdrawal data not found.",
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Something went wrong",
        error: err.response,
      });
    }
  },
  backupFund: async (req, res) => {
    // backupFundCreate((result) => {
    //   console.log("result", result);
    // });

    try {
      let curr_date1 = moment.tz(Date.now(), "Asia/Kolkata");
      let dd = curr_date1.date() - 1;
      let mm = curr_date1.month() + 1;
      let yyyy = curr_date1.year();
      let collectionName = `FundingSource_${dd}_${mm}_${yyyy}`;
      FundingSource.aggregate([{ $out: collectionName }], (err, response) => {
        if (err) {
          console.log("err", err);
          return res.status(200).json({
            success: false,
            message: "Backup not created.",
            collections,
          });
        } else {
          const conn = mongoose.createConnection(URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
          conn.on("open", function () {
            conn.db
              .listCollections()
              .toArray(function (err, allCollectionNames) {
                if (err) {
                  console.log(err);
                  return res.status(200).json({
                    success: false,
                    message: "Backup not created.",
                    collections,
                  });
                }
                let collections = allCollectionNames
                  .map((data) => data.name)
                  .filter((fdata) => fdata.includes("FundingSource_"));
                conn.close();
                let todayCollection = collections.find(
                  (data) => data == collectionName
                );
                // console.log("todayCollection", todayCollection);
                if (todayCollection) {
                  return res.status(200).json({
                    success: true,
                    message: "Backup Successfully",
                    collections,
                  });
                } else {
                  return res.status(200).json({
                    success: false,
                    message: "Backup not created.",
                    collections,
                  });
                }
              });
          });
        }
      });
      // if (result.data && result.status === true) {
      //   const collections = result.collections;
      //   return res.status(200).json({
      //     success: true,
      //     message: "Backup Successfully.",
      //     collections,
      //   });
      // } else if (result.data && result.status === false) {
      //   const collections = result.collections;
      //   return res.status(200).json({
      //     success: false,
      //     message: "Backup not created .",
      //     collections,
      //   });
      // } else {
      //   return res.status(200).json({
      //     success: false,
      //     message: "Backup not created or Connection error",
      //   });
      // }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Something went wrong",
        error: err.response,
      });
    }
  },
  getBackupFund: async (req, res) => {
    try {
      // console.log("response", response);
      const conn = mongoose.createConnection(URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      conn.on("open", function () {
        conn.db.listCollections().toArray(function (err, allCollectionNames) {
          if (err) {
            console.log(err);
            return res.status(200).json({
              success: false,
              message: "Backup collection not get.",
            });
          }
          let collections = allCollectionNames
            .map((data) => {
              return { dbName: data.name };
            })
            .filter((fdata) => fdata.dbName.includes("FundingSource_"));
          conn.close();

          return res.status(200).json({
            success: true,
            message: "Backup collection get Successfully",
            collections,
          });
        });
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Something went wrong",
        error: err.response,
      });
    }
  },
  deleteBackupFund: async (req, res) => {
    try {
      // console.log("response", response);
      const conn = mongoose.createConnection(URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      conn.on("open", function () {
        conn.db.listCollections().toArray(function (err, allCollectionNames) {
          if (err) {
            console.log(err);
            return res.status(200).json({
              success: false,
              message: "Backup collection not get.",
            });
          }
          let collections = allCollectionNames
            .map((data) => {
              return { dbName: data.name };
            })
            .filter((fdata) => fdata.dbName.includes("FundingSource_"));
          conn.close();

          return res.status(200).json({
            success: true,
            message: "Backup collection get Successfully",
            collections,
          });
        });
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Something went wrong",
        error: err.response,
      });
    }
  },
  genrateRoiIncome: async (req, res) => {
    try {
      let allRoids = await getAllActiveRoi();
      //console.log("allRoids", allRoids);
      // const roiIncomeGenrate = async () => {
      //   for (it of allRoids) {
      //     console.log(" incomeGenrate roi start ", it);
      //     investIncome(it);
      //   }
      // };
      // const level1IncomeGenrate = async () => {
      //   for (it of allRoids) {
      //     console.log(" incomeGenrate level 1 start", it);

      //     level1Income(it);
      //   }
      // };
      // const level2IncomeGenrate = async () => {
      //   for (it of allRoids) {
      //     console.log(" incomeGenrate level 2 start", it);

      //     level2Income(it);
      //   }
      // };
      // const level3IncomeGenrate = async () => {
      //   for (it of allRoids) {
      //     console.log(" incomeGenrate level 3 start", it);

      //     level3Income(it);
      //   }
      // };
      // const level4IncomeGenrate = async () => {
      //   for (it of allRoids) {
      //     console.log(" incomeGenrate level 4 start", it);

      //     level4Income(it);
      //   }
      // };
      // const level5IncomeGenrate = async () => {
      //   for (it of allRoids) {
      //     console.log(" incomeGenrate level 5 start", it);

      //     level5Income(it);
      //   }
      // };
      // const level6IncomeGenrate = async () => {
      //   for (it of allRoids) {
      //     console.log(" incomeGenrate level 6 start", it);

      //     level6Income(it);
      //   }
      // };
      // const level7IncomeGenrate = async () => {
      //   for (it of allRoids) {
      //     console.log(" incomeGenrate level 7 start", it);

      //     level7Income(it);
      //   }
      // };
      // const level8IncomeGenrate = async () => {
      //   for (it of allRoids) {
      //     console.log(" incomeGenrate level 8 start", it);

      //     level8Income(it);
      //   }
      // };
      // const level9IncomeGenrate = async () => {
      //   for (it of allRoids) {
      //     console.log(" incomeGenrate level 9 start", it);

      //     level9Income(it);
      //   }
      // };
      // const level10IncomeGenrate = async () => {
      //   for (it of allRoids) {
      //     console.log(" incomeGenrate level 10 start", it);

      //     level10Income(it);
      //   }
      // };
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Something went wrong",
        error: err.response,
      });
    }
  },
  genrateRoiWithdrawal: async (req, res) => {
    try {
      let allRoids = await getAllActiveRoi();

      try {
        for (it of allRoids) {
          console.log(" Withdrawal cron jobs start", it);
          withDrawalBalance(it);
        }
      } finally {
        return res.status(200).json({
          success: true,
          message: "Withdrawal generated",
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Something went wrong",
        error: err.response,
      });
    }
  },
};

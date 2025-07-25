const { userModel } = require("../../models/user");
const { roleModel } = require("../../models/role");
const {paymentModel}=require("../../models/payment");
const { AuthToken } = require("../../models/authtoken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const {
  newUserIdGen,
  sendSms,
  randomPassword,
  encryptAES,
  decryptAES,
  passwordEncryptAES,
  passwordDecryptAES,
  whatsAppMessage,
  getCurrentSession,
  redisDeleteCall

} = require("../../util/helper");
const { blogModel } = require("../../models/blog");
const myCache=require("../..");
require("dotenv/config");
const SECRET = process.env.SECRET;
const activeParam = {$and:[{deleted:false},{isApproved:true}, {isActive:true}]}
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

module.exports = {
  userlogin: async (req, res) => {
    try {
      const user = await userModel.findOne({$and:[{'userInfo.roleName':{$in:["TOPADMIN","ADMIN","TEACHER","ACCOUNTANT","ASSISTANT","STUDENT"]}},{"userInfo.userId": req.body.bmmsId }]});
      let isAdmin = false;
      let isStudent= false
      if (!user) {
        return res.status(200).json({
          success: false,
          message: "BMMS ID or Password is wrong.",
        });
      }
     
      if (user.deleted === true) {
        return res
        .status(200)
        .json({ success: false, message: "Please contact to admin 9470510100." });
      }
      if (!user.isActive) {
        return res.status(200).json({
          success: false,
          message: "User was suspended. Please contact to admin 9470510100 ",
        });
      }
      if(!user.isApproved){
          return res.status(200).json({
            success: false,
            message: "User not approved by admin. Please contact to admin 9470510100.",
          });
      }
        if(!(user && passwordDecryptAES(user.userInfo.password)===decryptAES(req.body.password))) {
          return res.status(200).json({
            success: false,
            message: "BMMS ID or Password is wrong",
          });
        }
        const roleExist = await roleModel.findOne({ _id: user.userInfo.roleId });
        if(!roleExist){
          return res.status(200).json({
            success: false,
            message: "Not authorised user",
          });
        }
        if(roleExist && roleExist.roleName &&roleExist.roleName==='STUDENT'){
            isStudent= true
          // return res.status(200).json({
          //   success: false,
          //   message: "Not allowed to login. Please try with with phone number.",
          // });
        }
  
        if (roleExist && roleExist.roleName && (roleExist.roleName === "TOPADMIN" || roleExist.roleName === "ADMIN" || roleExist.roleName === "TEACHER" || roleExist.roleName === "ACCOUNTANT" || roleExist.roleName === "ASSISTANT" )) isAdmin = true;
        const blogWeb= (user && user.userInfo && user.userInfo.userId &&  user.userInfo.userId ==='topadmin')? true:false 
        const expireDay=  isAdmin?"1d":"100d"
        let tokenGen =  blogWeb?
                  jwt.sign(
                    {
                      userId: user.id,
                      isAdmin: isAdmin,
                    },
                    SECRET,
                  )
                :
                  jwt.sign(
                    {
                      userId: user.id,
                      isAdmin: isAdmin,
                      isStudent: isStudent
                    },
                    SECRET,
                    { expiresIn:expireDay}
                  )
        const tokenSave = new AuthToken({
          token: tokenGen,
          userId: user.id
        });
        const userData = encryptObj(user)

        const tokenData = await tokenSave.save();
        return res.status(200).json({
          success: true,
          message: "Logged-in successfully",
          data: { user: userData, token: tokenGen },
        });

    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },
  userLoginWithPhone: async (req, res) => {
    try {
      const user = await userModel.findOne({$and:[activeParam, {'userInfo.roleName': 'STUDENT'},{$or:[{ "userInfo.phoneNumber1": req.body.phoneNumber},{ "userInfo.phoneNumber2": req.body.phoneNumber}]}]});
      if (!user) {
        return res.status(200).json({
          success: false,
          message: "Phone number not registered.",
        });
      }
     
      if (user.deleted === true) {
        return res
        .status(200)
        .json({ success: false, message: "Please contact to school 9470510100." });
      }
      if (!user.isActive) {
        return res.status(200).json({
          success: false,
          message: "Your id is not active. Please contact to school 9470510100 ",
        });
      }
      if(!user.isApproved){
          return res.status(200).json({
            success: false,
            message: "Your id not approved by school. Please contact to school 9470510100.",
          });
      }
        // if(!(user && passwordDecryptAES(user.userInfo.password)===decryptAES(req.body.password))) {
        //   return res.status(200).json({
        //     success: false,
        //     message: "BMMS ID or Password is wrong",
        //   });
        // }
        const roleExist = await roleModel.findOne({ _id: user.userInfo.roleId });
        if(!roleExist){
          return res.status(200).json({
            success: false,
            message: "Not authorised user",
          });
        }
    
        //if(roleExist && roleExist.roleName && (roleExist.roleName === "TOPADMIN" || roleExist.roleName === "ADMIN" || roleExist.roleName === "TEACHER" || roleExist.roleName === "ACCOUNTANT")) isAdmin = true;
     
        // if(isAdmin){
        //   return res.status(200).json({
        //     success: false,
        //     message: "Only student allowed to login with phone number.",
        //   });
        // }
        const expireDay=  "300d"
        let tokenGen =   jwt.sign({userId: user.id, isAdmin: true},SECRET,{ expiresIn:expireDay})
               
        const tokenSave = new AuthToken({
          token: tokenGen,
          userId: user.id
        });
        const otherUser = await userModel.find({$and:[activeParam, {'userInfo.roleName': 'STUDENT'},{ 'userInfo.userId': { $ne: user.userInfo.userId }},{$or:[{ "userInfo.phoneNumber1": req.body.phoneNumber},{ "userInfo.phoneNumber2": req.body.phoneNumber}]}]});
   
        const userData= encryptObj(user)
        //console.log("userData", userData)

        const newOtherUser=  otherUser.map(item => encryptObj(item));
        //console.log("newOtherUser", newOtherUser)

        const tokenData = await tokenSave.save();
        return res.status(200).json({
          success: false,
          message: "Logged-in successfully",
          //data: { user: userData, token: tokenGen, otherUser: newOtherUser},
        });

    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },

  addUser: async (req, res) => {
    try {
       const CURRENTSESSION = getCurrentSession()
      //  const regis=true
      //  if(regis){
      //   return res.status(200).json({
      //     success: false,
      //     message: "Please contact to admin.",
      //   });
      //  }

      if(req.body.aadharNumber){
        const notUniqueUser = await userModel.findOne({ "userInfo.aadharNumber": req.body.aadharNumber});
        if (notUniqueUser){
          return res.status(200).json({
            success: false,
            message: "Aadhar number is already registered.",
          });
        }
      }

      const isAdminRegistration = req.body.isAdminRegistration
      delete req.body.isAdminRegistration 

      const activeParam = {$and:[{deleted:false},{isApproved:true}, {isActive:true}]}
      const allStudentOfClass= await userModel.find({$and:[activeParam, {'userInfo.class':req.body.class},{'userInfo.session':CURRENTSESSION},{'userInfo.roleName':'STUDENT'}]})
      const allRollNumbersValid = (arr) => {
        return arr.every(student => !!student.rollNumber);
      };
      const isAllRollNumbersValid= allRollNumbersValid(allStudentOfClass)

      const newUserId = await newUserIdGen();
      const getRoleId = await roleModel.findOne({ roleName: "STUDENT" });
      let newPassword =  randomPassword().join("").toString();
        let newUserData={
          userInfo: {
            ...req.body,
            dob:new Date(req.body.dob),
            roleId: getRoleId._id.toString(),
            userId: newUserId,
            password: passwordEncryptAES(newPassword)
          },
          isActive:isAdminRegistration? true: false,
          isApproved: isAdminRegistration? true: false,
        }
        if(isAllRollNumbersValid){
          const findMaxRollNumber = (arr) => {
            return arr.reduce((maxStudent, currentStudent) => {
              return currentStudent.rollNumber > maxStudent.rollNumber ? currentStudent : maxStudent;
            });
          };
          if(allStudentOfClass && allStudentOfClass.length>0){
            const maxRoleNumberStudent = findMaxRollNumber(allStudentOfClass);
            newUserData['rollNumber']= Number(maxRoleNumberStudent.rollNumber)+1
          }
        }
        let newUser = new userModel(newUserData);
        const sendSMSandEmaildata = {
          fullName: req.body.fullName,
          email: req.body.email,
          phoneNumber: req.body.phoneNumber1,
          userId: newUserId,
          password: newPassword,
        };

        // let responseData = {
        //   name: req.body.name,
        //   email: req.body.email,
        //   roiId: newRoiId,
        //   referralRoiId: req.body.parentRoiId,
        //   receiverPhoneNumber: req.body.phoneNumber,
        //   password: newPassword,
        // };
          const sms ='' //await sendSms(sendSMSandEmaildata);
          const smsSend =  (sms && sms.return)? true: false
          const WSData={
             name: req.body.fullName,
             class:req.body.class,
             userId:sendSMSandEmaildata.userId,
             password: sendSMSandEmaildata.password,
             sendMessageFor:'Registration'
          }
     
            let userData = await newUser.save();
            const registrationMessage= smsSend?"Registration successful and Mobile number verified":"Registration successful and Mobile number not verified."
          if(userData){
              //await whatsAppMessage(sendSMSandEmaildata.phoneNumber,null, 'registration',WSData)
              if(userData.userInfo && userData.userInfo.roleName==='STUDENT'){
                // myCache.del("AllList")
                const newPaymentData = paymentModel({
                  userId:userData.userInfo.userId,
                  session: CURRENTSESSION,
                  class:userData.userInfo.class,
                  dueAmount: 0,
                  excessAmount:0,
                  totalFineAmount:0,
                  busService: userData.userInfo.busService,
                  busRouteId: userData.userInfo.busService ? userData.userInfo.busRouteId : undefined, 
                  paymentLedgerPage: userData.userInfo.paymentLedgerPage
                })
                const  newPaymentDataCreated = await newPaymentData.save()
                if(newPaymentDataCreated){
                  const RedisPaymentKey =`payment-${userData.userInfo.class}-${CURRENTSESSION}`
                  redisDeleteCall({key:RedisPaymentKey})
                }
              }
            return res.status(200).json({
              success: true,
              message: registrationMessage
            });
          } else {
            return res.status(400).json({
              success: false,
              message: "Registration unsuccessful.",
            });
          }
    } catch (err) {
      console.log("errrrr", err)
      return res.status(400).json({
        success: false,
        message: "Resigtration unsuccessful.",
        error: err.message,
      });
    }
  },

  getAllUser: async (req, res) => {
    try {
      let data = await userModel.find(
        {
          $and: [
            { deleted: false },
            {
              "userInfo.email": {
                $nin: ["topadmin@yopmail.com"],
              },
            },
          ],
        },
      );
      data = data.map((d) => {
        return {
          name: d.userInfo.name,
          userId: d.userInfo.userId,
        };
      });
      return res.status(200).json({
        success: true,
        message: "Users found",
        data,
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Users not found.",
        error: error.message,
      });
    }
  },
  getBlogPost: async (req, res) => {
    try {

      const data = await blogModel.findOne({slugTitle:req.params.slugTitle})
      if(data){
        await blogModel.findOneAndUpdate({_id:data._id},{viewCount: Number(data.viewCount)+1})
        return res.status(200).json({
          success: true,
          message: "Get Blog Post successfuly",
          data
        });
      }else{
        return res.status(200).json({
          success: false,
          message: "Blog not found",
        });
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Error while getting blog post data",
        error: error.message,
      });
    }
  },
  getAllBlogPost: async (req, res) => {
    try {
      const data= await blogModel.find().sort( { "created": -1 } )
      return res.status(200).json({
        success: true,
        message: "Get All Blog Post successfuly",
        data
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Error while getting All blog post data",
        error: error.message,
      });
    }
  },
  paymentCallback: (req, res) => {
    // Process callback data
    const data = req.body;
    console.log('Payment callback received:', data);
    res.status(200).send('Callback received');
  },
};

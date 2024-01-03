const { userModel } = require("../../models/user");
const { roleModel } = require("../../models/role");
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
  passwordDecryptAES

} = require("../../util/helper");
const { blogModel } = require("../../models/blog");

const SECRET = process.env.SECRET;

module.exports = {
  userlogin: async (req, res) => {
    try {
      const user = await userModel.findOne({ "userInfo.userId": req.body.bmmsId });
      let isAdmin = false;
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
        if (roleExist && roleExist.roleName && (roleExist.roleName === "TOPADMIN" || roleExist.roleName === "ADMIN" || roleExist.roleName === "TEACHER" || roleExist.roleName === "ACCOUNTANT")) isAdmin = true;
        const blogWeb= (user && user.userInfo && user.userInfo.userId &&  user.userInfo.userId ==='918732')? true:false 
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
                    },
                    SECRET,
                    { expiresIn:expireDay}
                  )
        const tokenSave = new AuthToken({
          token: tokenGen,
          userId: user.id
        });

        const tokenData = await tokenSave.save();
        return res.status(200).json({
          success: true,
          message: "Logged-in successfully",
          data: { user: user, token: tokenGen },
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

      const newUserId = await newUserIdGen();
      const getRoleId = await roleModel.findOne({ roleName: "STUDENT" });
      let newPassword =  randomPassword().join("").toString();
        let newUser = new userModel({
          userInfo: {
            ...req.body,
            dob:new Date(req.body.dob),
            roleId: getRoleId._id.toString(),
            userId: newUserId,
            password: passwordEncryptAES(newPassword)
          },
          isActive:isAdminRegistration? true: false,
          isApproved: isAdminRegistration? true: false,
        });
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
          const sms = await sendSms(sendSMSandEmaildata);
          //const sms= true
       
          if (!sms) {
            let userData = await newUser.save();
            return res.status(200).json({
              success: true,
              message: "Registration successful.",
            });
          } else {
            return res.status(200).json({
              success: false,
              message: "Mobile mumber is not valid",
            });
          }
    } catch (err) {
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
};

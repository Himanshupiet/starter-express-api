const moment = require("moment-timezone");
const fast2sms = require("fast-two-sms");
const mongoose = require("mongoose");
const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const URL = process.env.MONGO_LOCAL_CONN_URL;
const { userModel } = require("../../models/user");
const { examModel } = require("../../models/exam");
const {roleModel} = require("../../models/role")
const { cronjobModel } = require("../../models/cronjob");
const { FundingSource } = require("../../models/fundingSource");
const { AuthToken } = require("../../models/authtoken");
const { ObjectId } = require("mongodb");
const {s3upload, passwordEncryptAES} = require('../../util/helper')
const {
  getAllActiveRoi,
  withDrawalBalance,
  
} = require("../../util/income");
const { resultModel } = require("../../models/result");
const { resultEntryPerModel } = require("../../models/resutlEntryPer");


const authorization = process.env.SMS_API;
const classList=["1 A","1 B","2 A","2 B","3 A","3 B","4","5","6","7","8","9","10","UKG A","UKG B","LKG A","LKG B","NUR A","NUR B","PREP"]
const examList =['UNIT TEST-I', 'UNIT TEST-II', 'HALF YEARLY EXAM', 'ANNUAL EXAM']
const yearList =['2022-23', '2023-24', '2024-25', '2025-26']
const subjectList =['HINDI', 'ENGLISH', 'MATH','SCIENCE','SST','COMPUTER','HINDI NOTES','ENGLISH NOTES','MATH NOTES','SCIENCE NOTES','SST NOTES','HINDI RHYMES','ENGLISH RHYMES','DRAWING','GK','MV']

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

      const users = await userModel.find({
        $and: [ { deleted: false },searchParam,classParam,roleParam]
      });
      return res.status(200).json({
        success: true,
        users,
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "User not found.",
        error: err.message,
      });
    }
  },
  getAllStudents: async (req, res) => {
    try {
      const searchStr= req.body.searchStr
      let searchParam={}
      let classParam={}
       let docFilterParam={}
      let dataFilterParam={}
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
      }

      if(req.body.selectedClass){
        classParam={'userInfo.class':req.body.selectedClass}
      }
      if(req.body.docFilter){
        docFilterParam={[`document.${req.body.docFilter}`]:{$exists:true}}
      }
      const condParam={
        $and: [
          { deleted: false },
          {
            'userInfo.roleName':'STUDENT'
          },
          searchParam,
          classParam,
          docFilterParam
        ],
      }
      //console.log("condParammmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm", JSON.stringify(condParam))
      const users = await userModel.find(condParam,dataFilterParam);
    
      return res.status(200).json({
        success: true,
        users,
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Student not found.",
        error: err.message,
      });
    }
  },
  deleteUser: async (req, res) => {
    try {
     await userModel.findOneAndUpdate({_id:req.params.id},{deleted: true, modified:new Date()});
      return res.status(200).json({
        success: true,
        message: "Deleted successfully."
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "user not found.",
        error: err.message,
      });
    }
  },

  updateUserById: async (req, res) => {
    try {
      if(req.body.roleUpdate){
          const newRoleName = req.body.newRoleName
          delete req.body.updateRole
          delete req.body.newRoleName
          const getNewRoleData= await roleModel.findOne({$and:[{roleName:newRoleName},{ roleName:{$nin:['TOPADMIN','ADMIN']}}]})
          if(getNewRoleData){
            req.body.roleName = getNewRoleData.roleName
            req.body.roleId = getNewRoleData._id.toString()
          }
      }
      let user =  await userModel.findOne({_id:req.params.id});
      if(!user){
        return res.status(400).json({
          success: false,
          message: "user not found.",
          error: err.message,
        });
      }
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
      return res.status(200).json({
        success: true,
        message: "Updated successfully.",
        data:updatedUser
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "Error while update user.",
        error: err.message,
      });
    }
  },
  uploadDocumentS3:(req, res, next)=>{
    console.log("userIdddddddddddddddddddddddd",req.body.userId)
    console.log("imagefileeeeeeeeeeeeee", req.files.document)
    const userId =req.body.userId
    //const fileName= `${req.body.userId}_${req.body.fileName.split('_')[1]}`
    const fileName=req.body.fileName
    console.log("fileNameeeeeeeeeeeee", fileName)
    const file= req.files.document
    s3upload(userId,fileName, file)

  },

  updateStatus:  (req, res, next) => {
      try{
      const userId = req.body.userId;
      let datatoUpdate={}
      if(req.body.recover){
        datatoUpdate={
          isActive:true,
          isApproved: true,
          modified: new Date(),
          deleted:false
        }
      }else{
        datatoUpdate={
          isActive: req.body.isActive && req.body.isActive==="true"? true:false,
          isApproved: req.body.isApproved && req.body.isApproved==="true"? true:false,
          modified: new Date(),
        }
      }

       userModel.findOneAndUpdate({ 'userInfo.userId': userId },datatoUpdate,(err, response) => {
        if (err) {
          next(err);
        }else{
          return res.status(200).json({
            success: true,
            message: "Update status successfully.",
          });
        }
      })
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "Error while update status",
        error: err.message,
      });
    }
  },
  getSmsData: async (req, res) => {
    try {
      const { wallet } = await fast2sms.getWalletBalance(authorization);
      // const smsData = await smsModel.find();
       if (wallet) {
        return res.status(200).json({
          success: true,
          message: "SMS data get Successfully",
          // data: smsData,
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
        message: "Something went wrong",
        error: err.response,
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
              resultEntryFound.subjects[subjectName]=it.marks
      
             await resultModel.findOneAndUpdate(resultParam,resultEntryFound )
            }else{
                let result={
                    subjects:{}
                  }
                  result.subjects[subjectName]=it.marks
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
        message: "Something went wrong",
        error: err.response,
      });
    }
  },

  getResult: async (req, res) => {
    try {
      //console.log("req", req.body)
    const resultQuery= req.body
     const userData =  await userModel.find({$and:[{'userInfo.class':resultQuery.selectedClass},{'userInfo.roleName':'STUDENT'},{deleted: false}]});
      if(resultQuery.resultPermissionData.action==='ENTRY'){
          let subjectName=  resultQuery.selectedSubject && resultQuery.selectedSubject.toLowerCase().trim()
          subjectName = subjectName.includes(' ')?subjectName.split(' ').join('_'):subjectName
          let subjectPermissionParam={
            userId:1,
            subjects:{}
          }
          subjectPermissionParam.subjects[subjectName]=1
 
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
    
      }else if(resultQuery.resultPermissionData.role==='ADMIN'){
     
        const resultParam={
          $and:[
          {resultYear:resultQuery.resultPermissionData.resultYear},
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
             
                const newResultData={
                  ...data.userInfo,
                  studentResult:found,
                  total:total
                  }
                  return newResultData
              }else{
                const newResultData={
                  ...data.userInfo,
                  total:0
                  }
                  return newResultData
                //return data.userInfo
              }
          })
        
        const sortResultData =  newResultData.slice().sort((a,b) => b.total - a.total);
        const actualResult = newResultData.map(originalData=> {
          const sortDataIndex = sortResultData.findIndex((sortdata)=> originalData.userId === sortdata.userId)
                const ddd= {
                  ...originalData,
                  rank:sortDataIndex +1
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
      }else{
        return res.status(200).json({
          success: false,
          message: "Result not found.",
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
      return res.status(200).json({
        success: true,
        users,
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "User not found.",
        error: err.message,
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
        message: "user not found.",
        error: err.message,
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

   const reportCount= await userModel.find(queryParam).count();


    return res.status(200).json({
      success: true,
      message: "Report Data get successfully.",
      reportData:repodata,
      reportCount:reportCount,
    });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "user not found.",
        error: err.message,
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
        message: "Error while creating exam.",
        error: err.message,
      });
    }
  },

  updateExam: async (req, res) => {
    try {
      let newUpdate=null
      if(req.body.key==='primary'){
        newUpdate= await examModel.findOneAndUpdate({_id:req.body.examId},{primary:req.body.value, modified: new Date()});
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
        message: "Error while exam update.",
        error: err.message,
      });
    }
  },

  deleteExam: async (req, res) => {
    try {
     await examModel.findOneAndUpdate({_id:req.params.id},{deleted:true});
      return res.status(200).json({
        success: true,
        message: "Deleted successfully."
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Error while get exam.",
        error: err.message,
      });
    }
  },
  getExam:async(req, res)=>{
    try{
      const getExamsData= await examModel.find({})
      const getResultEntryPerData = await resultEntryPerModel.find({});
      const getTeacherData= await userModel.find({$and:[{deleted:false, 'userInfo.roleName':'TEACHER'}]})
      const sendData={
        examsData:getExamsData,
        teacherData:getTeacherData,
        resultEntryPerData:getResultEntryPerData
      }

        return res.status(200).json({
          success: true,
          message: "Exam data get successfully.",
          data: sendData
        })

    }catch(err){
      console.log(err)
      return res.status(400).json({
        success:false,
        message:"Error while get exam "
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
        success:false,
        message:"Error while get exam"
      })
    }
  },
  createResultEntryPermission: async(req, res)=>{
    try{
      const checkAlreadyExist = await resultEntryPerModel.findOne({userId:req.body.teacherId});
      if(!checkAlreadyExist){
        const resultEntryPerData= new resultEntryPerModel({
          userId:req.body.teacherId,
          subjectsAllowed:req.body.subjectsAllowed,
          classAllowed:req.body.classAllowed
        })
        const newResultEntryPer = await resultEntryPerData.save();
        return res.status(200).json({
          success: true,
          message: "created successfully.",
        })
      }else{
        return res.status(200).json({
          success: false,
          message: "Already Result Entry Permission created.",
        })
      }
   
    }catch(err){
      console.log(err)
      return res.status(400).json({
        success:false,
        message:'Error whille create new result entry permission.'
      })
    }
  },
  getResultEntryPermission: async(req, res)=>{
    try{
      const getResultEntryPerData = await resultEntryPerModel.find({});
      return res.status(200).json({
        success: true,
        message: "created successfully.",
        data:getResultEntryPerData
      })
    }catch(err){
      return res.status(400).json({
        success:false,
        message:'Error whille create new result entry permission.'
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
        const updateData={
          classAllowed:req.body.classAllowed,
          subjectsAllowed:req.body.subjectsAllowed, 
          modified: new Date
        }
       newUpdate= await resultEntryPerModel.findOneAndUpdate({$and:[{_id:req.body.resultEntryPerId},{userId:req.body.selectTeacher}]},updateData);
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
          error: err.message,
        });
      }

     
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Error while update.",
        error: err.message,
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
        success:false,
        message:'Error whille deleting result entry permission.'
      })
    }
  },
  getAdminDashboardData:async(req, res)=>{
    try{
      let dashBoardData={}
      const todayDate = req.query.todayDate
      //console.log("todayDateeeeeeeeeeeeeeeee",  todayDate)
      const totalStudent= await userModel.find({$and:[{deleted:false}, {'userInfo.roleName': 'STUDENT'}]}).count()
      const totalTeacher= await userModel.find({$and:[{deleted:false}, {'userInfo.roleName': 'TEACHER'}]}).count()
      const userFound= await userModel.find({$and:[{deleted:false}, {'userInfo.dob': todayDate}]})
      //console.log("userFoundddddddddddddd",  userFound)
      dashBoardData={
        totalStudent:totalStudent,
        totalTeacher:totalTeacher,
        todayBirthday:userFound
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
        message: "Error while get dashboard data.",
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
      return res.status(500).json({
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

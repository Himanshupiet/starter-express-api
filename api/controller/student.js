const { paymentModel } = require('../../models/payment');
const {userModel} = require('../../models/user')
const { getCurrentSession} = require('../../util/helper')

const activeParam = {$and:[{deleted: false},{isActive: true},{isApproved:true}]}
const invalidPhoneNumbers=['0000000000','0000000001','1234567890']

module.exports={
    getStudentDashboard:async(req, res, next)=>{
        try {
            const CURRENTSESSION = getCurrentSession();
            let studentList = [req.user];
            let phoneNo1 = req.user.userInfo.phoneNumber1;
            let phoneNo2 = req.user.userInfo.phoneNumber2;

            // Remove invalid numbers
            if (invalidPhoneNumbers.includes(phoneNo1)) {
                phoneNo1 = '';
            }
            if (invalidPhoneNumbers.includes(phoneNo2)) {
                phoneNo2 = '';
            }

            let queryParam = null;

            // Build query based on available phone numbers
            const phoneQuery = [];
            if (phoneNo1) {
                phoneQuery.push({'userInfo.phoneNumber1': phoneNo1});
                phoneQuery.push({'userInfo.phoneNumber2': phoneNo1});
            }
            if (phoneNo2) {
                phoneQuery.push({'userInfo.phoneNumber1': phoneNo2});
                phoneQuery.push({'userInfo.phoneNumber2': phoneNo2});
            }

            if (phoneQuery.length > 0) {
                queryParam = { $or: phoneQuery };
            }

            if (queryParam) {
                //console.log("queryParam", JSON.stringify(queryParam));
                const allSiblingStudent = await userModel.find({
                    $and: [
                        activeParam,
                        { 'userInfo.session': CURRENTSESSION },
                        queryParam,
                        { 'userInfo.userId': { $ne: req.user.userInfo.userId } }
                    ]
                });
                //console.log("allSiblingStudent", allSiblingStudent);
                studentList = [...studentList, ...allSiblingStudent];
            }

            res.status(200).send({
                message: 'Data get sucessfuly.',
                data: {
                    studentList
                },
                success: true
            })
            
        } catch (error) {
            res.status(500).send({
                message: error.message,
                success:false
            })
        }
    },
    getFeeReport:async(req, res, next)=>{
        try {
            const CURRENTSESSION = getCurrentSession();

            let {userId, reqSession}= req.query
            reqSession ='2024-25' || CURRENTSESSION
            const userData = await userModel.findOne(
                {
                  $and: [
                    activeParam,
                    { 'userInfo.userId': userId },
                    { 'userInfo.session': CURRENTSESSION }
                  ]
                },
                {
                  'userInfo.fullName': 1,
                  'userInfo.userId': 1,
                  'userInfo.class': 1
                }
              );
              
            const payDetail = await paymentModel.findOne({$and:[{'userId':userId},{session:reqSession}]})
            if(payDetail){
                res.status(200).send({
                    message: 'Fee report get Successfully',
                    data: {...JSON.parse(JSON.stringify(payDetail)), sData:userData},
                    success: true
                })
            }else{
                res.status(200).send({
                    message: 'Fee report not found.',
                    success: false
                })
            }
        } catch (error) {
            res.status(500).send({
                message: error.message,
                success: false
            })
        }
    }

};
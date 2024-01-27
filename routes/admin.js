const express = require("express");
const router = express.Router();
const admin = require("../api/controller/admin");
const { isAunthaticatedAdmin } = require("../middleware/auth");

router.get("/createBackup", admin.createBuckup)
// router with aunthenticate
router.use(isAunthaticatedAdmin)
router.post("/getAllUser",  admin.getAllUsers);
router.post("/getAllstudent",  admin.getAllStudents);
router.get("/deleteUser/:id", admin.deleteUser)
router.post("/updateUser/:id", admin.updateUserById)
router.post("/updateStatus",  admin.updateStatus);
router.get("/getSmsData",  admin.getSmsData);
router.post("/submitResult",  admin.submitResult);
router.post("/getResult",  admin.getResult);
router.post("/oldExamResult",  admin.oldExamResult)
router.post("/getDeletedUser",  admin.getDeletedUser);
router.delete("/permanentDeleteUser/:id",  admin.permanentDeleteUser);
router.post("/reportData",  admin.reportData);
router.post("/createExam",  admin.createExam);
router.get("/getExamData",  admin.getExam);
router.post("/updateExam",  admin.updateExam);
router.delete("/deleteExam",  admin.deleteExam);
router.get("/getExamPermission",  admin.getExamPermission);
router.post("/resultEntryPer", admin.createResultEntryPermission)
router.post("/updateResultEntryPer", admin.updateResultEntryPermission)
router.get("/adminDashboardData",  admin.getAdminDashboardData);
router.post("/uploadDocumentS3",  admin.uploadDocumentS3);
router.delete("/deleteExamPermission/:id",  admin.deleteResultEntryPermission);
router.get("/getExamDateAndSub",  admin.getExamDateAndSub);
router.post("/updateExamDateAndSub",  admin.updateExamDateAndSub);
router.post("/upgradeClass",  admin.upgradeClass)
router.post("/getAllTeacherAndStaff",  admin.getAllTeacherAndStaff)
router.post("/addList/:name",  admin.createList)
router.get("/getAllList",  admin.getAllList)
router.post("/updateList/:name/:id",  admin.updateList)
router.post("/addPayment",  admin.addPayment)
router.get("/gePaymentDetail",  admin.gePaymentDetail)
router.get("/getPaymentRecieverUser",  admin.getPaymentRecieverUser) 
router.post("/updatePaymentRecieverUser",  admin.updatePaymentRecieverUser)
router.get("/getAllInvoice",  admin.getAllInvoice)
router.get("/getInvoicesByUserId",  admin.getInvoicesByUserId)
router.post("/deleteTransaction",  admin.deleteTransaction)

// router for blog

router.post("/addBlogPost",  admin.createBlogPost)
router.post("/deleteBlogPost",  admin.deleteBlogPost)
router.post("/updateBlogPost",  admin.updateBlogPost)






// router.get("/getAllEmailData", isAunthaticatedAdmin, admin.getAllEmail);
// router.get("/getAllcronJobs", isAunthaticatedAdmin, admin.getAllcronJobs);
// router.post("/backupFund", isAunthaticatedAdmin, admin.backupFund);
// router.get("/getBackupFund", isAunthaticatedAdmin, admin.getBackupFund);
// router.post("/deleteBackupFund", isAunthaticatedAdmin, admin.deleteBackupFund);
// router.get("/genrateRoiIncome", isAunthaticatedAdmin, admin.genrateRoiIncome);
// router.get(
//   "/genrateRoiWithdrawal",
//   isAunthaticatedAdmin,
//   admin.genrateRoiWithdrawal
// );
// router.get("/getAllWithdrawals", isAunthaticatedAdmin, admin.getAllWithdrawals);

// router.post(
//   "/updateWithdrawalStatus/:id",
//   isAunthaticatedAdmin,
//   admin.updateWithdrawalStatus
// );

module.exports = router;

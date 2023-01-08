const express = require("express");
const router = express.Router();
const admin = require("../api/controller/admin");
const { isAunthaticatedAdmin } = require("../middleware/auth");

router.post("/getAllUser", isAunthaticatedAdmin, admin.getAllUsers);
router.post("/getAllstudent", isAunthaticatedAdmin, admin.getAllStudents);
router.get("/deleteUser/:id",isAunthaticatedAdmin, admin.deleteUser)
router.post("/updateUser/:id",isAunthaticatedAdmin, admin.updateUserById)
router.post("/updateStatus", isAunthaticatedAdmin, admin.updateStatus);
router.get("/getSmsData", isAunthaticatedAdmin, admin.getSmsData);
router.post("/submitResult", isAunthaticatedAdmin, admin.submitResult);
router.post("/getResult", isAunthaticatedAdmin, admin.getResult);
router.post("/getDeletedUser", isAunthaticatedAdmin, admin.getDeletedUser);
router.delete("/permanentDeleteUser/:id", isAunthaticatedAdmin, admin.permanentDeleteUser);
router.post("/reportData", isAunthaticatedAdmin, admin.reportData);
router.post("/createExam", isAunthaticatedAdmin, admin.createExam);
router.get("/getExamData", isAunthaticatedAdmin, admin.getExam);
router.post("/updateExam", isAunthaticatedAdmin, admin.updateExam);
router.delete("/deleteExam", isAunthaticatedAdmin, admin.deleteExam);
router.get("/getExamPermission", isAunthaticatedAdmin, admin.getExamPermission);
router.post("/resultEntryPer",isAunthaticatedAdmin, admin.createResultEntryPermission)
router.post("/updateResultEntryPer",isAunthaticatedAdmin, admin.updateResultEntryPermission)
router.get("/adminDashboardData", isAunthaticatedAdmin, admin.getAdminDashboardData);
router.post("/uploadDocumentS3", isAunthaticatedAdmin, admin.uploadDocumentS3);
router.delete("/deleteExamPermission/:id", isAunthaticatedAdmin, admin.deleteResultEntryPermission);






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

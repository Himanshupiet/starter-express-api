const express = require("express");
const router = express.Router();
const role = require("../api/controller/role");

router.get(`/getAllRoles`, role.getAllRoles);
router.get("/getRole/:id", role.getRoleById);
router.post("/", role.createRole);
router.put("/updateRole/:id", role.updateRoleById);
router.delete("/deleteRole/:id", role.deleteRoleById);

module.exports = router;

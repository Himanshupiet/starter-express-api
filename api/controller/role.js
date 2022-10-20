const { roleModel } = require("../../models/role");

module.exports = {
  getAllRoles: async (req, res) => {
    //console.log(req);
    try {
      const roleList = await roleModel.find({
        $and: [{ deleted: false }, { roleName: { $ne: "TOPADMIN" } }],
      });

      if (!roleList) {
        return res
          .status(500)
          .json({ success: false, message: "Somethimg went wrong" });
      } else {
        return res.status(200).send({
          success: true,
          message: "Role get successfully",
          data: roleList,
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Something went wrong",
        error: err.message,
      });
    }
  },

  getRoleById: async (req, res) => {
    const role = await roleModel.findById(req.params.id);
    if (!role) {
      return res
        .status(500)
        .json({ success: false, message: "The role was not found." });
    }
    return res.status(200).send({
      success: true,
      message: "The Role get successefully.",
      data: role,
    });
  },

  createRole: async (req, res) => {
    try {
      const getRole = await roleModel.findOne({
        roleName: req.body.roleName.toUpperCase(),
      });
      if (!getRole) {
        let role = new roleModel({
          roleName: req.body.roleName.toUpperCase(),
        });
        role = await role.save();

        if (!role) {
          return res
            .status(200)
            .json({ success: false, message: "The role cannot be created!" });
        } else {
          return res
            .status(200)
            .json({ success: false, message: "Role created successefully" });
        }
      } else {
        return res
          .status(200)
          .json({ success: false, message: "The role already created." });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Something went wrong",
        err: err.message,
      });
    }
  },

  updateRoleById: async (req, res) => {
    try {
      const adminRole = await roleModel.findOne({ roleName: "TOPADMIN" });
      if (adminRole._id === req.params.id) {
        return res
          .status(400)
          .json({ success: false, message: "The role cannot be updated." });
      } else {
        // const roleExist = await Role.findById(req.params.id);
        if (req.body.roleName.toUpperCase() !== "TOPADMIN") {
          const role = await roleModel.findByIdAndUpdate(req.params.id, {
            roleName: req.body.roleName.toUpperCase(),
            modified: Date.now(),
          });
          if (!role) {
            return res
              .status(400)
              .json({ success: false, message: "The role cannot be updated." });
          } else {
            return res.status(200).send({
              success: true,
              message: "The role updated successfully.",
            });
          }
        } else {
          res.status(400).json({
            success: false,
            message: "The role cannot be updated as ADMIN.",
          });
        }
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "something went wrong",
        error: err.message,
      });
    }
  },

  deleteRoleById: async (req, res) => {
    roleModel.findByIdAndUpdate(req.params.id, { deleted: true })
      .then((role) => {
        if (role) {
          return res
            .status(200)
            .json({ success: true, message: "Role deleted succssefully." });
        } else {
          return res
            .status(404)
            .json({ success: false, message: "Role not found." });
        }
      })
      .catch((err) => {
        return res.status(500).json({
          success: false,
          message: "Something went wrong",
          error: err,
        });
      });
  },
};

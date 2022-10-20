const { Securitylog } = require("../../models/securitylog");

module.exports = {
  securitylog: async (req, res) => {
    try {
      let logs = new Securitylog(req.body);
      logs = await logs.save();
      if (logs) {
        return res
          .status(200)
          .send({ success: true, message: "Security logs saved." });
      } else {
        return res.status(400).json({
          success: false,
          message: "Security logs not saved.",
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Security logs not saved.",
        error: err.message,
      });
    }
  },
  getAllSecuritylogs: async (req, res) => {
    try {
      const SecuritylogData = await Securitylog.find({});
      if (SecuritylogData) {
        return res.status(200).json({
          success: true,
          message: "Security logs get successfully",
          data: SecuritylogData,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Security logs not get",
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Something went wrong",
        error: err.message,
      });
    }
  },
};

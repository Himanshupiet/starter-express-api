const { AuthToken } = require("../../models/authtoken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv/config");

module.exports = {
  logout: async (req, res) => {
    const token = req.headers.authorization?req.headers.authorization.includes('"')?req.headers.authorization:JSON.stringify(req.headers.authorization):null;
    // console.log("tokennnnnn", token)
    // const decode2 = jwt.verify(JSON.parse(token), SECRET);
    // console.log("decode2", decode2)
    jwt.verify(JSON.parse(token), SECRET,async function (err, decoded) {
      if (err) {
          res.status(403).json({success: false, message: err.message});
      } else {
          const userId= decoded.userId
          const resData = await AuthToken.deleteMany({userId});
          if (resData) {
            return res
              .status(200)
              .send({ success: true, message: "Logout Successfully."});
          } else {
            return res
              .status(200)
              .send({ success: false, message: "Session Expired."});
          }
        }
    })
  }
}

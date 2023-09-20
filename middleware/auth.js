const { userModel } = require("../models/user");
const { AuthToken } = require("../models/authtoken");
const jwt = require("jsonwebtoken");
require("dotenv/config");
const secret = process.env.secret;

exports.isAunthaticatedAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({
        message: "Header token not found.",
      });
    }
    const tokenFound = await AuthToken.findOne({ token: JSON.parse(token) });
    if(tokenFound){
      jwt.verify(JSON.parse(token), secret, async function(err, decoded) {
          if (err) {
              //jwt expired // invalid token
              return res.status(401).json({
                message: "Not Authorized",
              });
          }
          else {
              if (decoded && decoded.isAdmin && decoded.userId ) {
                const userData = await userModel.findOne({ _id: decoded.userId });
                if (userData) {
                  req.user = userData;
                  req.setCompanyId = userData.userInfo.companyId;
                  next();
                } else {
                  return res.status(401).json({
                    message: "Not Authorized",
                  });
                }
              } else {
                return res.status(401).json({
                  message: "Not Authorized",
                });
              }
          }
      });
    }else{
        return res.status(401).json({
          message: "LOGOUT",
        });
    }
  } catch (error) {
    console.log("errrror", error)
    return res.status(401).json({
        message: "Token verification error",
      });
  }
};
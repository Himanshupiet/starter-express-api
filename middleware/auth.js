const { userModel } = require("../models/user");
const { AuthToken } = require("../models/authtoken");
const jwt = require("jsonwebtoken");
require("dotenv/config");
const SECRET = process.env.SECRET;

module.exports={
  isAunthaticatedAdmin:async (req, res, next) => {
    try {
      const token = req.headers.authorization?req.headers.authorization.includes('"')?req.headers.authorization:JSON.stringify(req.headers.authorization):null;
      //console.log("tokentokentoken", token)
      if (!token) {
        return res.status(401).json({
          message: "Header token not found.",
        });
      }
      const tokenFound = await AuthToken.findOne({ token: JSON.parse(token) });
      if(tokenFound){
        jwt.verify(JSON.parse(token), SECRET, async function(err, decoded) {
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
                    // req.setCompanyId = userData.userInfo.companyId;
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
  },
  isAunthaticatedStudent:async(req, res, next) =>{
    try {
      const token = req.headers.authorization?req.headers.authorization.includes('"')?req.headers.authorization:JSON.stringify(req.headers.authorization):null;
      //console.log("tokentokentoken", token)
      if (!token) {
        return res.status(401).json({
          message: "Header token not found.",
        });
      }
      const tokenFound = await AuthToken.findOne({ token: JSON.parse(token) });
      if(tokenFound){
        jwt.verify(JSON.parse(token), SECRET, async function(err, decoded) {
            if (err) {
                //jwt expired // invalid token
                return res.status(401).json({
                  message: "Not Authorized",
                });
            }
            else {
                if (decoded && decoded.isStudent && decoded.userId ) {
                  const userData = await userModel.findOne({ _id: decoded.userId });
                  if (userData) {
                    req.user = userData;
                    // req.setCompanyId = userData.userInfo.companyId;
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
  }

}
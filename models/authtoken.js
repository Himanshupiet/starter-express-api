const mongoose = require("mongoose");

const authTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  userId:{
    type:String,
    requred:true,
  },
  created: {
    type: Date,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});
exports.AuthToken = mongoose.model("AuthToken", authTokenSchema);
exports.authTokenSchema = authTokenSchema;

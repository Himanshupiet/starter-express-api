const mongoose = require("mongoose");

const exam = new mongoose.Schema({
  examYear: {
    type: String,
    required: true,
  },
  examType:{
    type:String,
    requred:true,
  },
  primary:{
    type:Boolean,
    default:false
  },
  adminAllowed:{
    type:Boolean,
    default:false
  },
  fullAttendance:{
    type:Number,
    //requred:true,
    default:0
  },
  created: {
    type: Date,
  },
  modified: {
    type: Date,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});
exports.examModel = mongoose.model("Exam", exam);
exports.exam = exam;

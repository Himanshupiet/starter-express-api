const mongoose = require("mongoose");

const ExamDateAndSub = new mongoose.Schema({
  examYear: {
    type: String,
    required: true,
  },
  examType:{
    type:String,
    requred:true,
  },
  examDateAndSub: {
    type: JSON,
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
exports.examDateAndSubModel = mongoose.model("ExamDateAndSub", ExamDateAndSub);
exports.ExamDateAndSub = ExamDateAndSub;

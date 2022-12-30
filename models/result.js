const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  resultYear: {
    type: String,
    required: true,
    trim: true
  },
  examType: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  subjects: {
    type: JSON,
  },
  attendance1: {
    type: Number,
    default: 0,
  },
  attendance2: {
    type: Number,
    default: 0,
  },
});

resultSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

resultSchema.set("toJSON", {
  virtuals: true,
});

resultSchema.pre("save", function (next) {
  now = new Date();
  this.modified = now;
  if (!this.created) {
    this.created = now;
  }
  next();
});

exports.resultModel = mongoose.model("result", resultSchema);
exports.resultSchema = resultSchema;

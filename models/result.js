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
  hindi: {
    type: Number,
    default: 0,
  },
  english: {
    type: Number,
    default: 0,
  },
  science: {
    type: Number,
    default: 0,
  },
  math: {
    type: Number,
    default: 0,
  },
  sst: {
    type: Number,
    default: 0,
  },
  computer: {
    type: Number,
    default: 0,
  },
  gk: {
    type: Number,
    default: 0,
  },
  drawing: {
    type: Number,
    default: 0,
  },
  moralValue: {
    type: Number,
    default: 0,
  },
  hindiNote: {
    type: Number,
    default: 0,
  },
  englishNote: {
    type: Number,
    default: 0,
  },
  mathNote: {
    type: Number,
    default: 0,
  },
  scienceNote: {
    type: Number,
    default: 0,
  },
  sstNote: {
    type: Number,
    default: 0,
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

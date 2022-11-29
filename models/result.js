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
    type: String,
    default: 0,
  },
  english: {
    type: String,
    default: 0,
  },
  science: {
    type: String,
    default: 0,
  },
  math: {
    type: String,
    default: 0,
  },
  sst: {
    type: String,
    default: 0,
  },
  computer: {
    type: String,
    default: 0,
  },
  gk: {
    type: String,
    default: 0,
  },
  drawing: {
    type: String,
    default: 0,
  },
  moralScience: {
    type: String,
    default: 0,
  },
  hindiNote: {
    type: String,
    default: 0,
  },
  englishNote: {
    type: String,
    default: 0,
  },
  mathNote: {
    type: String,
    default: 0,
  },
  scienceNote: {
    type: String,
    default: 0,
  },
  sstNote: {
    type: String,
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

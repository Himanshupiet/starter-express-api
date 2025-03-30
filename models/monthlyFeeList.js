const mongoose = require("mongoose");

const monthlyFeeListSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
    trim: true
  },
  monthlyFee: {
    type: Number,
    required: true,
  },
  annualExamFee: {
    type: Number,
    required: false,
  },
  halfExamFee: {
    type: Number,
    required: false,
  },
  // delete after update this
  examFee: {
    type: Number,
    required: false,
  },
  session: {
    type: String,
    required: true,
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

monthlyFeeListSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

monthlyFeeListSchema.set("toJSON", {
  virtuals: true,
});

monthlyFeeListSchema.pre("save", function (next) {
  now = new Date();
  this.modified = now;
  if (!this.created) {
    this.created = now;
  }
  next();
});

exports.monthlyFeeListModel = mongoose.model("monthlyFeeList", monthlyFeeListSchema);
exports.monthlyFeeListSchema = monthlyFeeListSchema;

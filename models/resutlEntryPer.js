const mongoose = require("mongoose");

const resultEntryPerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true
  },
  subjectsAllowed: {
    type: Array,
  },
  classAllowed: {
    type: Array,
  },
  entry:{
    type: Boolean,
    default: false,
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

resultEntryPerSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

resultEntryPerSchema.set("toJSON", {
  virtuals: true,
});

resultEntryPerSchema.pre("save", function (next) {
  now = new Date();
  this.modified = now;
  if (!this.created) {
    this.created = now;
  }
  next();
});

exports.resultEntryPerModel = mongoose.model("resultEntryPer", resultEntryPerSchema);
exports.resultEntryPerSchema = resultEntryPerSchema;

const mongoose = require("mongoose");

const cronjobSchema = new mongoose.Schema({
  jobPerform: {
    type: String,
    required: true,
  },
  cronJobTime: {
    type: String,
    required: true,
  },
  indiaCronjontime: {
    type: String,
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

cronjobSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

cronjobSchema.set("toJSON", {
  virtuals: true,
});

cronjobSchema.pre("save", function (next) {
  now = new Date();
  this.modified = now;
  if (!this.created) {
    this.created = now;
  }
  next();
});

exports.cronjobModel = mongoose.model("Cronjob", cronjobSchema);
exports.cronjobSchema = cronjobSchema;

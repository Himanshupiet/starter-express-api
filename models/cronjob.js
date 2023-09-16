const mongoose = require("mongoose");

const cronjobSchema = new mongoose.Schema({
  jobPerform: {
    type: String,
    required: true,
  },
  detail: {
    type: String,
    required: true,
  },
  scheduleTime: {
    type: String,
  },
  status: {
    type: String,
  },
  created: {
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

const mongoose = require("mongoose");

const securitylogSchema = new mongoose.Schema({
  eventName: {
    type: String,
  },
  eventDetail: {
    type: String,
  },
  userId: {
    type: String,
  },
  roleId: {
    type: String,
  },
  roleName: {
    type: String,
  },
  emailId: {
    type: String,
  },
  userName: {
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

securitylogSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

securitylogSchema.set("toJSON", {
  virtuals: true,
});

securitylogSchema.pre("save", function (next) {
  now = new Date();
  this.modified = now;
  if (!this.created) {
    this.created = now;
  }
  next();
});

exports.Securitylog = mongoose.model("Securitylog", securitylogSchema);
exports.securitylogSchema = securitylogSchema;

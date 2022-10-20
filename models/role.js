const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  roleName: {
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

roleSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

roleSchema.set("toJSON", {
  virtuals: true,
});

roleSchema.pre("save", function (next) {
  now = new Date();
  this.modified = now;
  if (!this.created) {
    this.created = now;
  }
  next();
});

exports.roleModel = mongoose.model("Role", roleSchema);
exports.roleSchema = roleSchema;

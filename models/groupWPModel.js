const mongoose = require("mongoose");

const wAppGroupSchema = new mongoose.Schema({
  groupId: { type: String, unique: true },
  name: String,
  inviteLink: String,
  created: Date,
  modified: Date,
});

wAppGroupSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

wAppGroupSchema.set("toJSON", {
  virtuals: true,
});

wAppGroupSchema.pre("save", function (next) {
  const now = new Date();
  this.modified = now;
  if (!this.created) {
    this.created = now;
  }
  next();
});

exports.wAppGroupModel = mongoose.model("WAppGroup", wAppGroupSchema);
exports.wAppGroupSchema = wAppGroupSchema;

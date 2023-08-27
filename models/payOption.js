const mongoose = require("mongoose");

const payOptionSchema = new mongoose.Schema({

  payOptionInfo: {
    type: JSON
  },
  payMethod:{
    type: String,
    required: true,
  }, 
  insertedBy: {
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

payOptionSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

payOptionSchema.set("toJSON", {
  virtuals: true,
});

payOptionSchema.pre("save", function (next) {
  now = new Date();
  this.modified = now;
  if (!this.created) {
    this.created = now;
  }
  next();
});

exports.payOptionModel = mongoose.model("payOption", payOptionSchema);
exports.payOptionSchema = payOptionSchema;



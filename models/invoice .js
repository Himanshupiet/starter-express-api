const mongoose = require("mongoose");


const invoiceSchema = new mongoose.Schema({
  invoiceInfo: {
    type: JSON,
  },
  invoiceType: {
    require: true,
    type: String,
  },
  paidStatus: {
    type: Boolean,
    default: true,
  },
  userId: {
    require: true,
    type: String,
  },
  invoiceId: {
    require: true,
    type: String,
  },
  insertedId: {
    require: true,
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

invoiceSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

invoiceSchema.set("toJSON", {
  virtuals: true,
});

invoiceSchema.pre("save", function (next) {
  const now = new Date();
  this.modified = now;
  if (!this.created) {
    this.created = now;
  }
  next();
});

exports.invoiceModel = mongoose.model("invoice", invoiceSchema);
exports.invoiceSchema = invoiceSchema;

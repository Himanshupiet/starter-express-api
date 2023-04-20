const mongoose = require("mongoose");
const payInfo={
  entryData: Date,
  paid: Boolean,
  due: Number,
  amountPay: Number,
  active: Boolean,
  amount:Number,
  concession: Number,
  fine: Number,
  paidDate: Date,
  recieverName:String
}

const paymentSchema = new mongoose.Schema({
  monthlyPay: {
    jan: payInfo,
    feb: payInfo,
    mar: payInfo,
    apr: payInfo,
    may: payInfo,
    jun: payInfo,
    jul: payInfo,
    aug: payInfo,
    sep: payInfo,
    oct: payInfo,
    nov: payInfo,
    dec: payInfo
  },
  busPay:{
    jan: payInfo,
    feb: payInfo,
    mar: payInfo,
    apr: payInfo,
    may: payInfo,
    jun: payInfo,
    jul: payInfo,
    aug: payInfo,
    sep: payInfo,
    oct: payInfo,
    nov: payInfo,
    dec: payInfo
  },
  other: {
    type: JSON,
  },
  oldSessionDue:{
    type: Number
  },
  feeConcession:{
    type:Number
  },
  monthlyFee:{
    type:Number
  },
  busFee:{
    type:Number
  },
  busFeeActive:{
    type:Boolean
  },
  userId: {
    type: String,
  },
  isActive: {
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

paymentSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

paymentSchema.set("toJSON", {
  virtuals: true,
});

paymentSchema.pre("save", function (next) {
  const now = new Date();
  this.modified = now;
  if (!this.created) {
    this.created = now;
  }
  next();
});

exports.paymentModel = mongoose.model("payement", paymentSchema);
exports.paymentSchema = paymentSchema;

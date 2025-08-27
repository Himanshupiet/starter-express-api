const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: String,  // e.g., "invoice_25"
  seq: { 
    type: Number, 
    default: 0 
  }
});


counterSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

counterSchema.set("toJSON", {
  virtuals: true,
});

// counterSchema.pre("save", function (next) {
//   now = new Date();
//   this.modified = now;
//   if (!this.created) {
//     this.created = now;
//   }
//   next();
// });

exports.counterModel = mongoose.model("counter", counterSchema);
exports.counterSchema = counterSchema;

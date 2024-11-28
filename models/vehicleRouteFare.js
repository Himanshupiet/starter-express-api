const mongoose = require("mongoose");

const vehicleRouteFareSchema = new mongoose.Schema({
  vehicleId: {
    type: String,
    required: true,
  },
  route: {
    type: String,
    required: true,
  },
  fare: {
    type: Number,
    required: true,
  },
  distance: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    //required: true,
  },
  session: {
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

vehicleRouteFareSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

vehicleRouteFareSchema.set("toJSON", {
  virtuals: true,
});

vehicleRouteFareSchema.pre("save", function (next) {
  now = new Date();
  this.modified = now;
  if (!this.created) {
    this.created = now;
  }
  next();
});

exports.vehicleRouteFareModel = mongoose.model("vehicleRouteFare", vehicleRouteFareSchema);
exports.vehicleRouteFareSchema = vehicleRouteFareSchema;

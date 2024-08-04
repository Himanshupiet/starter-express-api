const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  templateType: {
    type: String,
    required: true,
    default:'general'
  },
  recipientType: {
    type: String,
    required: true,
    default:'individual'
  },
  messageId:{
    type: String,
    required: true,
  },
  messageData:{
    type: JSON,
  },
  platform:{
    type: String,
    default: 'Whatsapp'
  },
  userId:{
    type:String
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

messageSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

messageSchema.set("toJSON", {
  virtuals: true,
});

messageSchema.pre("save", function (next) {
  now = new Date();
  this.modified = now;
  if (!this.created) {
    this.created = now;
  }
  next();
});

exports.messageModel = mongoose.model("message", messageSchema);
exports.messageSchema = messageSchema;

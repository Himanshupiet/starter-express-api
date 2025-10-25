// models/whatsappSession.js
const mongoose = require("mongoose");

const whatsappSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  data: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("WhatsappSession", whatsappSessionSchema);

const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  datetime: { type: Date, required: true },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Schedule", scheduleSchema);

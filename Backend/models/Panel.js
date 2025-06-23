const mongoose = require("mongoose");
const { Schema } = mongoose;

const PanelSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    companyName: { type: String, required: true },
    size: {
      width: { type: Number, required: true },
      height: { type: Number, required: true },
    },
    Model: { type: Number, required: true },
    installationDate: { type: Date },
    maxOutput: { type: Number },
    currentOutput: { type: Number },
    position: {
      row: { type: Number },
      column: { type: Number },
    },
    lastInspection: { type: Date, default: null },
    inspectionHistory: { type: Array, default: [] },
    currentFault: {
      description: { type: String, default: "No issues detected" },
      level: { type: String, default: "none" },
    },
    priority: { type: String, default: "low" },
    maintenanceSuggestion: { type: String, default: "No maintenance needed" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Panel", PanelSchema);

const mongoose = require("mongoose");
const { Schema } = mongoose;

const GridConfigSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    rows: { type: Number, required: true },
    columns: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GridConfig", GridConfigSchema);

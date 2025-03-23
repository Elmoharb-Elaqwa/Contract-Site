const mongoose = require("mongoose");

const BOQItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    subItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sub",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Main", BOQItemSchema);

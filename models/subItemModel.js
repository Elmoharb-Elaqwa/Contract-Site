const mongoose = require("mongoose");
const SubItemSchema = new mongoose.Schema({
  subItemName: { type: String, required: true },
  workItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Work",
      required: true,
    },
  ],
});

module.exports = mongoose.model("Sub", SubItemSchema);

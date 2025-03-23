const mongoose = require("mongoose");

const WorkItemSchema = new mongoose.Schema({
  workItemName: { type: String, required: true },
  workDetails: { type: Object },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
});

module.exports = mongoose.model("Work", WorkItemSchema);

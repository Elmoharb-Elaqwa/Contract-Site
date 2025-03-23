const mongoose = require("mongoose");

const AdditionSchema = new mongoose.Schema({
  additionName: { type: String, required: true },
  type: { type: String, enum: ["Amount", "Percentage %"], required: true },
  amount: { type: Number, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required:true, ref:'User' },
  workConfirmationId:{type:mongoose.Schema.Types.ObjectId,ref:'WorkConfirmation'}
});

module.exports = mongoose.model("AdditionWorkConfirmation", AdditionSchema);

const mongoose = require("mongoose");

const DeductionSchema = new mongoose.Schema({
  deductionName: { type: String, required: true },
  type: { type: String, enum: ["Amount", "Percentage %"], required: true },
  amount: { type: Number, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId,ref:'User', required: true },
  workConfirmationId:{type:mongoose.Schema.Types.ObjectId,ref:'WorkConfirmation'}
});

module.exports = mongoose.model("DeductionWorkConfirmation", DeductionSchema);

const mongoose = require("mongoose");

const DeductionSchema = new mongoose.Schema({
  deductionName: { type: String, required: true },
  type: { type: String, enum: ["Amount", "Percentage %"], required: true },
  amount: { type: Number, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId,ref:'User', required: true },
  contractId:{type:mongoose.Schema.Types.ObjectId,ref:'Contract'}
});

module.exports = mongoose.model("Deduction", DeductionSchema);

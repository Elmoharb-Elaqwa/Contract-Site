const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema({
  taxValue: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  code: { type: String, unique: true, required: true },
  name: { type: String },
  downPaymentValue: { type: Number, default: 0 },
  downPaymentRate: { type: Number, default: 0 },
  downPaymentType: {
    type: String,
    enum: ["Amount", "Percentage"],
  },
  contractType: {
    type: String,
    required: true,
    enum: ["Owner", "Sub-contractor"],
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Partner",
    required: true,
  },
  consultant: { type: mongoose.Schema.Types.ObjectId, ref: "Partner" },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  typeOfProgress: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ["Estimation", "Approved"],
    default: "Estimation",
  },

  description: { type: String },
  mainId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Main" }],
  // userId: { type: mongoose.Schema.Types.ObjectId,ref:'User', required: true },
  total: { type: Number, default: 0 },
  totalContractValue: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  totalDeduction: { type: Number, default: 0 },
  totalAddition: { type: Number, default: 0 },
});

const Contract = mongoose.model("Contract", contractSchema);

module.exports = Contract;

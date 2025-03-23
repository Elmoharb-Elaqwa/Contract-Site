const mongoose = require("mongoose");

const EstimatorSchema = new mongoose.Schema({
  projectName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
  },
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contract",
  },
  applyOn: { type: String, enum: ["Whole BOQ", "BOQ Lines"], required: true },
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  totalMaterialCost: { type: Number, default: 0 },
  totalLaborCost: { type: Number, default: 0 },
  totalEquipmentCost: { type: Number, default: 0 },
  totalOtherCost: { type: Number, default: 0 },
  overallTotal: { type: Number, default: 0 },
  riskFactor: { type: Number, default: 0 },
},{
  timestamps: true,
});

module.exports = mongoose.model("Estimator", EstimatorSchema);

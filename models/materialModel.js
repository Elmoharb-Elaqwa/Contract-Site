const mongoose = require("mongoose");
const materialCostSchema = new mongoose.Schema(
  {
    projectName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
    },
    estimatorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Estimator",
    },
    applyOn: { type: String, enum: ["Whole BOQ", "BOQ Lines"], required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    boqLineItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Work",
    },
    category: {
      type: String,
      required: true,
      enum: ["Material", "Labor", "Equipment", "OtherCost"],
    },
    materialName: { type:mongoose.Schema.Types.Mixed, ref: "Product" },
    unitOfMeasure: { type: String, required: true },
    quantity: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    includeTax: { type: Boolean, default: false },
    showSales: { type: Boolean, default: false },
    taxValue: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 },
    taxDeductedValue: { type: Number, default: 0 },
    profitValue: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Material", materialCostSchema);

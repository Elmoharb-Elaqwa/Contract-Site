const mongoose = require("mongoose");

// نموذج EstimatorTemplate
const estimatorTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  tags: [{ type: String }], 
  category: { type: String, required: true }, 
  materials: [
    {
      materialName: { type: String, required: true },
      unitOfMeasure: { type: String, required: true },
      quantity: { type: Number, default: 0 },
      cost: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      includeTax: { type: Boolean, default: false },
      taxValue: { type: Number, default: 0 },
      profitMargin: { type: Number, default: 0 },
      category: {
        type: String,
        required: true,
        enum: ["Material", "Labor", "Equipment", "OtherCost"],
      },
    },
  ], 
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
},{
  timestamps: true,
});

module.exports = mongoose.model("EstimatorTemplate", estimatorTemplateSchema);

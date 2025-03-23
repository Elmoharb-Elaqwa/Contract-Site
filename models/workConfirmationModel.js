const mongoose = require("mongoose");

const workConfirmationSchema = new mongoose.Schema(
  {
    withContract: { type: Boolean, default: false },
    numberWithSpecificContract: { type: Number, default: 1 },
    contractId: { type: mongoose.Schema.Types.ObjectId, ref: "Contract" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    contractType: { type: String, required: true },
    projectName:{ type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    partner: { type: mongoose.Schema.Types.ObjectId, ref: "Partner" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    workConfirmationType: { type: String, required: true },
    typeOfProgress: {
      type: String,
      enum: [
        "Percentage per Line",
        "Quantity per Line",
        "Milestone-Based Confirmation",
      ],
    },
    status: { type: String, required: true, default: "Estimation" },
    activateInvoicingByPercentage: { type: Boolean, default: false },
    completionPercentage: { type: Boolean, default: false },
    workItems: [
      {
        workItemId: { type: mongoose.Schema.Types.ObjectId, ref: "Work" },
        previousQuantity: { type: Number, default: 0 },
        currentQuantity: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        totalQuantity: { type: Number, default: 0 },
        netAmount: { type: Number, default: 0 },
        dueAmount: { type: Number, default: 0 },
        invoicing: { type: Number },
        completion: { type: Number },
        isCalculated: { type: Boolean, default: false },
      },
    ],
    totalAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    totalDeduction: { type: Number, default: 0 },
    totalAddition: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WorkConfirmation", workConfirmationSchema);

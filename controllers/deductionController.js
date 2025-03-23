const Contract = require("../models/contractModel");
const Deduction = require("../models/deductionModel");


const addDeduction = async (req, res) => {
  const { contractId } = req.params;
  const { _id: userId } = req.user;

  try {
    const { deductionName, type, amount } = req.body;

    if (!deductionName || !type || !amount || !contractId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    let finalDeductionAmount;
    if (type === "Percentage %") {
      finalDeductionAmount = (contract.total * amount) / 100;
    } else {
      finalDeductionAmount = amount;
    }

    const newDeduction = new Deduction({
      deductionName,
      type,
      amount: finalDeductionAmount,
      userId,
      contractId,
    });
    await newDeduction.save();

    //const updatedTotal = contract.total - finalDeductionAmount;
    //const taxValue = (updatedTotal * contract.taxRate) / 100;
    // const downPaymentValue =
    //   ((updatedTotal + taxValue) * contract.downPaymentRate) / 100;
    // const totalContractValue = updatedTotal + taxValue;
    // const dueAmount = totalContractValue - downPaymentValue;

    const contractUpdated = await Contract.findByIdAndUpdate(
      contractId,
      {
        // total: updatedTotal,
        // taxValue,
        // downPaymentValue,
        // totalContractValue,
        // dueAmount,
        $inc: { totalDeduction: finalDeductionAmount },
      },
      { new: true }
    );

    res.status(201).json({
      message: "Deduction added and contract updated successfully!",
      data: newDeduction,
      updatedContract: contractUpdated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding deduction",
      error: error.message,
    });
  }
};

const getDeductions = async (req, res) => {
  const { contractId } = req.params;
  const { _id: userId } = req.user;

  try {
    const deductions = await Deduction.find({ contractId, userId })
      .select("deductionName type amount createdAt")
      .sort({ createdAt: -1 });
      console.log(deductions)
    res.status(200).json({
      message: "Deductions retrieved successfully",
      data: deductions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving deductions",
      error: error.message,
    });
  }
};
const deleteDeduction = async (req, res) => {
  const { deductionId } = req.params;
  const { _id: userId } = req.user;
  try {
    const deduction = await Deduction.findOne({ _id: deductionId, userId });
    if (!deduction) {
      return res.status(404).json({ message: "Deduction not found or access denied" });
    }
    const contractId = deduction.contractId;
    await Deduction.findByIdAndDelete(deductionId);
    const contractUpdated = await Contract.findByIdAndUpdate(
      contractId,
      { $inc: { totalDeduction: -deduction.amount } },
      { new: true }
    );

    res.status(200).json({
      message: "Deduction deleted and contract updated successfully!",
      deletedDeduction: deduction,
      updatedContract: contractUpdated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting deduction",
      error: error.message,
    });
  }
};

module.exports = {
  addDeduction,
  getDeductions,
  deleteDeduction
};

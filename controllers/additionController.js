const Addition = require("../models/additionModel");
const Contract = require("../models/contractModel");

const addAddition = async (req, res) => {
  const { contractId } = req.params;
  const { _id: userId } = req.user;

  try {
    const { additionName, type, amount } = req.body;

    if (!additionName || !type || !amount || !contractId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    let finalAdditionAmount;
    if (type === "Percentage %") {
      finalAdditionAmount = (contract.total * amount) / 100;
    } else {
      finalAdditionAmount = amount;
    }

    const newAddition = new Addition({
      additionName,
      type,
      amount: finalAdditionAmount,
      userId,
      contractId,
    });
    await newAddition.save();

    // const updatedTotal = contract.total + finalAdditionAmount;
    // const taxValue = (updatedTotal * contract.taxRate) / 100;
    // const downPaymentValue = ((updatedTotal + taxValue) * contract.downPaymentRate) / 100;
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
        $inc: { totalAddition: finalAdditionAmount },
      },
      { new: true }
    );

    res.status(201).json({
      message: "Addition added and contract updated successfully!",
      data: newAddition,
      updatedContract: contractUpdated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding Addition",
      error: error.message,
    });
  }
};

const getAdditions = async (req, res) => {
  const { contractId } = req.params;
  const { _id: userId } = req.user;

  try {
    const additions = await Addition.find({ contractId, userId })
      .select("additionName type amount createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Additions retrieved successfully",
      data: additions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving additions",
      error: error.message,
    });
  }
};
const deleteAddition = async (req, res) => {
  const { additionId } = req.params;
  const { _id: userId } = req.user;
  try {
    const addition = await Addition.findOne({ _id: additionId, userId });
    if (!addition) {
      return res
        .status(404)
        .json({ message: "Addition not found or access denied" });
    }
    const contractId = addition.contractId;
    await Addition.findByIdAndDelete(additionId);
    const contractUpdated = await Contract.findByIdAndUpdate(
      contractId,
      { $inc: { totalAddition: -addition.amount } },
      { new: true }
    );

    res.status(200).json({
      message: "Addition deleted and contract updated successfully!",
      deletedAddition: addition,
      updatedContract: contractUpdated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting Addition",
      error: error.message,
    });
  }
};

module.exports = {
  addAddition,
  getAdditions,
  deleteAddition,
};

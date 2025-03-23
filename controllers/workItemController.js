const subItemModel = require("../models/subItemModel");
const WorkItem = require("../models/workItemModel");
const fs = require("fs");
const path = require("path");
const excelToJson = require("convert-excel-to-json");
const mainItemModel = require("../models/mainItemModel");
const additionModel = require("../models/additionModel");
const deductionModel = require("../models/deductionModel");
const Contract = require("../models/contractModel");
const workConfirmationModel = require("../models/workConfirmationModel");
const materialModel = require("../models/materialModel");

const addWorkDetailsItem = async (req, res) => {
  const { userId } = req.params;
  try {
    const {
      subId,
      unitOfMeasure,
      assignedQuantity,
      previousQuantity,
      remainingQuantity,
      financialCategory,
      price,
      workItemName,
    } = req.body;

    const total = assignedQuantity * price;
    const subItem = await subItemModel.findById(subId);
    if (!subItem) {
      return res.status(404).json({ message: "workItem not found" });
    }
    const workItem1 = await WorkItem.create({
      workItemName,
      workDetails: {
        unitOfMeasure,
        assignedQuantity,
        previousQuantity,
        remainingQuantity,
        financialCategory,
        price,
        total,
      },
      userId,
    });
    const ww = await subItemModel.findByIdAndUpdate(
      subId,
      { workItems: [...subItem.workItems, workItem1] },
      { new: true }
    );

    res.status(201).json({
      message: "Work Details Item added and linked to Work Item successfully!",
      data: ww,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding Work Details Item",
      error: error.message,
    });
  }
};
const getAllWorkItems = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const workItems = await WorkItem.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("workDetails");
    const totalItems = await WorkItem.countDocuments({ userId });
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      totalItems,
      totalPages,
      currentPage: page,
      data: workItems,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getWorkItemTotals = async (req, res) => {
  const { userId } = req.params;
  try {
    const workItems = await WorkItem.find({ userId });
    const contract = await Contract.findOne({ userId });
    const additions = await additionModel.find({ userId });
    let totalAddition = 0;
    let percentageAddition = 0;

    for (let i = 0; i < additions.length; i++) {
      if (additions[i].type === "Amount") {
        totalAddition += additions[i].amount;
      } else if (additions[i].type === "Percentage %") {
        percentageAddition += additions[i].amount;
      }
    }

    const deductions = await deductionModel.find({ userId });
    let totalDeduction = 0;
    let percentageDeduction = 0;

    for (let i = 0; i < deductions.length; i++) {
      if (deductions[i].type === "Amount") {
        totalDeduction += deductions[i].amount;
      } else if (deductions[i].type === "Percentage %") {
        percentageDeduction += deductions[i].amount;
      }
    }

    let netTotal =
      contract.total +
      totalAddition +
      contract.total * (percentageAddition / 100);
    netTotal -= totalDeduction + contract.total * (percentageDeduction / 100);
    const updateContract = await Contract.findOneAndUpdate(
      { userId },
      { totalDeduction: totalDeduction, totalAddition: totalAddition },
      { new: true }
    );

    res.status(200).json({
      netTotal,
      additions,
      deductions,
      totalDeduction: totalDeduction,
      totalAddition: totalAddition,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving final total",
      error: error.message,
    });
  }
};

const getSingleWorkItem = async (req, res) => {
  try {
    const { id } = req.params;
    const workItem = await WorkItem.findById(id);

    if (!workItem) {
      return res.status(404).json({ message: "Wok Item not found" });
    }

    res.status(200).json({ data: workItem });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving Work Item",
      error: error.message,
    });
  }
};

const updateWorkItem = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await WorkItem.findById(id);
    if (!data) {
      return res.status(404).json({ message: "Work Item not found" });
    }

    const {
      unitOfMeasure,
      assignedQuantity,
      previousQuantity,
      remainingQuantity,
      financialCategory,
      price,
      workItemName,
    } = req.body;
    const newAssignedQuantity = assignedQuantity || data.workDetails.assignedQuantity;
    const newPrice = price || data.workDetails.price;

    const total = newAssignedQuantity && newPrice ? newAssignedQuantity * newPrice : data.workDetails.total;

    const updateWorkDetailsItem = await WorkItem.findByIdAndUpdate(
      id,
      {
        workItemName,
        workDetails: {
          unitOfMeasure: unitOfMeasure || data.workDetails.unitOfMeasure,
          assignedQuantity: newAssignedQuantity,
          previousQuantity: previousQuantity || data.workDetails.previousQuantity,
          remainingQuantity: remainingQuantity || data.workDetails.remainingQuantity,
          financialCategory: financialCategory || data.workDetails.financialCategory,
          price: newPrice,
          total, 
        },
      },
      {
        new: true,
      }
    );

    if (!updateWorkDetailsItem) {
      return res.status(404).json({ message: "Work Details Item not found" });
    }

    res.status(200).json({
      message: "Work Item updated successfully!",
      data: updateWorkDetailsItem,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating Work Item",
      error: error.message,
    });
  }
};


const deleteWork = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const workItem = await WorkItem.findById(id);
    if (!workItem) {
      return res.status(404).json({ message: "Work Item not found" });
    }
    if (
      req.user.role !== "admin" &&
      workItem.userId.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this Work Item" });
    }
    await workConfirmationModel.updateMany(
      { "workItems.workItemId": id },
      { $pull: { workItems: { workItemId: id } } }
    );
    await materialModel.deleteMany({ boqLineItem: id });
    await WorkItem.findByIdAndDelete(id);

    res.status(200).json({
      message: "Work Item deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
const insertSheet = async (req, res) => {
  const { contractId } = req.params;
  const { _id: userId } = req.user;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file found" });
    }

    const filePath = path.join(__dirname, "../excelFiles", req.file.filename);

    const excelData = excelToJson({
      sourceFile: filePath,
      header: { rows: 1 },
      columnToKey: {
        A: "itemName",
        B: "subItemName",
        C: "workItemName",
        D: "unitOfMeasure",
        E: "assignedQuantity",
        F: "previousQuantity",
        G: "remainingQuantity",
        H: "financialCategory",
        I: "price",
      },
    });

    const sheetName = Object.keys(excelData)[0];
    const sheetData = excelData[sheetName];
    if (!sheetData || sheetData.length === 0) {
      return res
        .status(400)
        .json({ message: "No data found in the Excel file" });
    }

    let totalOfTotal = 0;
    const mainItemIds = new Set();

    const contract = await Contract.findById(contractId).populate("mainId");
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    for (const row of sheetData) {
      const total = (row["assignedQuantity"] || 0) * (row["price"] || 0);
      totalOfTotal += total;

      const workDetails = {
        unitOfMeasure: row["unitOfMeasure"],
        assignedQuantity: row["assignedQuantity"] || 0,
        previousQuantity: row["previousQuantity"],
        remainingQuantity: row["remainingQuantity"],
        financialCategory: row["financialCategory"],
        price: row["price"] || 0,
        total,
      };

      let mainItem = await mainItemModel.findOne({
        itemName: row["itemName"],
        _id: { $in: contract.mainId },
      });

      if (!mainItem) {
        mainItem = await mainItemModel.create({ itemName: row["itemName"] });
        contract.mainId.push(mainItem._id);
        await contract.save();
      }

      mainItemIds.add(mainItem._id.toString());

      let subItem = await subItemModel.findOne({
        subItemName: row["subItemName"],
        _id: { $in: mainItem.subItems },
      });

      if (!subItem) {
        subItem = await subItemModel.create({
          subItemName: row["subItemName"],
          workItems: [],
        });
        mainItem.subItems.push(subItem._id);
        await mainItem.save();
      }

      const workItem = await WorkItem.create({
        workItemName: row["workItemName"],
        workDetails,
        userId,
      });

      subItem.workItems.push(workItem._id);
      await subItem.save();
    }

    const updatedTotal = contract.total + totalOfTotal;
    const taxValue = (updatedTotal * (contract.taxRate || 0)) / 100;
    const downPaymentValue =
      ((updatedTotal + taxValue) * (contract.downPaymentRate || 0)) / 100;

    const contractUpdated = await Contract.findByIdAndUpdate(
      contractId,
      {
        $inc: { total: totalOfTotal },
        taxValue,
        downPaymentValue,
        totalContractValue: updatedTotal + taxValue,
        dueAmount: updatedTotal + taxValue - downPaymentValue,
        $addToSet: { mainId: { $each: [...mainItemIds] } },
      },
      { new: true }
    );

    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    res.status(201).json({ message: "Success", totalOfTotal, contractUpdated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const addSingleBoq = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contractId } = req.params;
    let assignedQuantity = parseFloat(req.body.assignedQuantity) || 0;
    let price = parseFloat(req.body.price) || 0;

    const {
      workItemName,
      unitOfMeasure,
      previousQuantity,
      remainingQuantity,
      financialCategory,
      itemName,
      subItemName,
    } = req.body;

    let total = assignedQuantity * price;
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res
        .status(404)
        .json({ message: "Contract not found for the specified user." });
    }

    let mainItem = await mainItemModel.findOne({
      itemName,
      _id: { $in: contract.mainId },
    });
    if (!mainItem) {
      mainItem = await mainItemModel.create({ itemName });
      contract.mainId.push(mainItem._id);
      await contract.save();
    }

    let subItem = await subItemModel.findOne({
      subItemName,
      _id: { $in: mainItem.subItems },
    });
    if (!subItem) {
      subItem = await subItemModel.create({
        subItemName,
        workItems: [],
      });
      mainItem.subItems.push(subItem._id);
      await mainItem.save();
    }

    let workItem = await WorkItem.create({
      workItemName,
      workDetails: {
        unitOfMeasure,
        assignedQuantity,
        previousQuantity,
        remainingQuantity,
        financialCategory,
        price,
        total,
      },
      userId,
    });

    const updatedTotal = contract.total + total;
    const taxValue = (updatedTotal * (contract.taxRate || 0)) / 100;
    const downPaymentValue =
      ((updatedTotal + taxValue) * (contract.downPaymentRate || 0)) / 100;

    const contractUpdated = await Contract.findByIdAndUpdate(
      contractId,
      {
        $inc: { total: total },
        taxValue,
        downPaymentValue,
        totalContractValue: updatedTotal + taxValue,
        dueAmount: updatedTotal + taxValue - downPaymentValue,
      },
      { new: true }
    );

    subItem.workItems.push(workItem._id);
    await subItem.save();

    res
      .status(201)
      .json({ data: { mainItem, subItem, workItem, contractUpdated } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const getWorkItemsForContract = async (req, res) => {
  const { contractId } = req.params;
  try {
    const contract = await Contract.findById(contractId).populate({
      path: "mainId",
      populate: {
        path: "subItems",
      },
    });
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }
    let workItemss = [];
    contract.mainId.map((item) => {
      item.subItems.map((sub) => {
        sub.workItems.map(async (workId) => {
          workItemss.push(workId);
        });
      });
    });
    const workItemsss = await WorkItem.find({ _id: { $in: workItemss } });
    res.status(201).json({ data: workItemsss });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};
const getWorkItemsNameForContract = async (req, res) => {
  const { contractId } = req.params;
  try {
    const contract = await Contract.findById(contractId).populate({
      path: "mainId",
      populate: {
        path: "subItems",
      },
    });
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }
    let workItemss = [];
    contract.mainId.map((item) => {
      item.subItems.map((sub) => {
        sub.workItems.map(async (workId) => {
          workItemss.push(workId);
        });
      });
    });
    const workItemsss = await WorkItem.find({
      _id: { $in: workItemss },
    }).select("workItemName _id");
    res.status(201).json({ data: workItemsss });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};
module.exports = {
  addWorkDetailsItem,
  getAllWorkItems,
  getWorkItemTotals,
  getSingleWorkItem,
  updateWorkItem,
  deleteWork,
  insertSheet,
  addSingleBoq,
  getWorkItemsForContract,
  getWorkItemsNameForContract,
};

// const deleteBoq = async (req, res) => {
//   try {
//     const { contractId, mainItemId } = req.params;

//     if (!contractId || !mainItemId) {
//       return res.status(400).json({ message: "Contract ID and Main Item ID are required" });
//     }

//     const contract = await Contract.findById(contractId);
//     if (!contract) {
//       return res.status(404).json({ message: "Contract not found" });
//     }

//     const mainItem = await mainItemModel.findById(mainItemId).populate({
//       path: 'subItems',
//       populate: {
//         path: 'workItems',
//       },
//     });

//     if (!mainItem) {
//       return res.status(404).json({ message: "Main item not found" });
//     }

//     const totalToDeduct = mainItem.subItems.reduce((acc, subItem) => {
//       return acc + subItem.workItems.reduce((subAcc, workItem) => {
//         return subAcc + (workItem.workDetails.total || 0);
//       }, 0);
//     }, 0);

//     const updatedTotal = contract.total - totalToDeduct;
//     await Contract.findByIdAndUpdate(contractId, {
//       $set: { total: updatedTotal },
//       $pull: { mainId: mainItemId },
//     }, { new: true });

//     for (const subItem of mainItem.subItems) {
//       await WorkItem.deleteMany({ _id: { $in: subItem.workItems } });
//     }
//     await subItemModel.deleteMany({ _id: { $in: mainItem.subItems } });

//     await mainItemModel.findByIdAndDelete(mainItemId);

//     res.status(200).json({ message: "Main item and associated data deleted successfully", updatedTotal });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };

// const addSingleBoq = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { contractId } = req.params;
//     let assignedQuantity = parseFloat(req.body.assignedQuantity) || 0;
//     let price = parseFloat(req.body.price) || 0;

//     const {
//       workItemName,
//       unitOfMeasure,
//       previousQuantity,
//       remainingQuantity,
//       financialCategory,
//       itemName,
//       subItemName,
//     } = req.body;

//     console.log("Inputs:", req.body);
//     console.log("Assigned Quantity:", assignedQuantity);
//     console.log("Price:", price);

//     let total = assignedQuantity * price;
//     console.log("Calculated Total:", total);

//     let mainItem = await mainItemModel.findOne({ itemName });
//     if (!mainItem) {
//       mainItem = await mainItemModel.create({ itemName });
//     }

//     let subItem = await subItemModel.findOne({
//       subItemName,
//       _id: { $in: mainItem.subItems },
//     });
//     if (!subItem) {
//       subItem = await subItemModel.create({
//         subItemName,
//         workItems: [],
//       });
//       mainItem.subItems.push(subItem._id);
//       await mainItem.save();
//     }

//     let workItem = await WorkItem.create({
//       workItemName,
//       workDetails: {
//         unitOfMeasure,
//         assignedQuantity,
//         previousQuantity,
//         remainingQuantity,
//         financialCategory,
//         price,
//         total,
//       },
//       userId,
//     });

//     const updateContract = await Contract.findOne({ _id: contractId });
//     if (!updateContract) {
//       return res
//         .status(404)
//         .json({ message: "Contract not found for the specified user." });
//     }

//     const contractUpdated = await Contract.findOneAndUpdate(
//       { _id: contractId },
//       {

//         $inc: { total: total },
//         $addToSet: { mainId: mainItem._id },
//       },
//       { new: true }
//     );

//     subItem.workItems.push(workItem._id);
//     await subItem.save();

//     res.status(201).json({ data: { mainItem, subItem, workItem } });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };

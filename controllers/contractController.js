const Contract = require("../models/contractModel");
const workItemModel = require("../models/workItemModel");
const User = require("../models/userModel");
const mainItemModel = require("../models/mainItemModel");
const subItemModel = require("../models/subItemModel");
const Project = require("../models/projectModel");
const Partner = require("../models/partnerModel");

const createContract = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      code,
      name,
      contractType,
      projectId,
      partnerId,
      consultantId,
      startDate,
      endDate,
      typeOfProgress,
      status,
      description,
    } = req.body;
    if (!contractType || !startDate || !endDate || !typeOfProgress || !code) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }
    const newContract = new Contract({
      code,
      name,
      contractType,
      project: projectId,
      partner: partnerId,
      consultant: consultantId,
      startDate,
      endDate,
      typeOfProgress,
      status,
      description,
    });

    await newContract.save();
    const project = await Project.findByIdAndUpdate(
      projectId,
      { $push: { contracts: newContract._id } },
      { new: true }
    );
    const partner = await Partner.findByIdAndUpdate(
      partnerId,
      { $push: { contracts: newContract._id } },
      { new: true }
    );
    await User.findByIdAndUpdate(
      userId,
      { $push: { contracts: newContract._id } },
      { new: true }
    );

    res.status(201).json({ data: newContract });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getContracts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const contracts = await Contract.find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
    const totalContracts = await Contract.countDocuments();
    const totalPages = Math.ceil(totalContracts / limit);
    res.status(200).json({
      totalContracts,
      totalPages,
      currentPage: page,
      data: contracts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving contracts",
      error: error.message,
    });
  }
};

const getUserContracts = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    let contracts = [];
    let parentUser;
    let totalContracts;
    if (user.parentId == null) {
      user = await User.findById(userId).populate({
        path: "contracts",
        options: {
          skip: skip,
          limit: limit,
          sort: { createdAt: -1 },
        },
        populate: [
          { path: "project", select: "_id projectName" },
          { path: "partner", select: "_id partnerName" },
          { path: "consultant", select: "_id partnerName" },
        ],
      });
      totalContracts = await User.findById(userId)
        .populate("contracts")
        .then((user) => user.contracts.length);
    } else {
      parentUser = await User.findById(user.parentId);
      user = await User.findById(parentUser._id).populate({
        path: "contracts",
        options: {
          skip: skip,
          limit: limit,
          sort: { createdAt: -1 },
        },
        populate: [
          { path: "project", select: "_id projectName" },
          { path: "partner", select: "_id partnerName" },
          { path: "consultant", select: "_id partnerName" },
        ],
      });
      totalContracts = await User.findById(parentUser._id)
        .populate("contracts")
        .then((user) => user.contracts.length);
    }

    const totalPages = Math.ceil(totalContracts / limit);
    res.status(200).json({
      contracts: user.contracts,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { _id } = req.user;

    if (!contractId) {
      return res.status(400).json({ message: "Contract ID is required" });
    }

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const user = await User.findById(_id);
    if (!user.contracts.includes(contract._id) && user.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "You don't have permission to delete this" });
    }

    for (const idMain of contract.mainId) {
      const mainItem = await mainItemModel.findById(idMain);
      if (mainItem) {
        for (const subItemId of mainItem.subItems) {
          const subItem = await subItemModel.findById(subItemId);
          if (subItem) {
            for (const workId of subItem.workItems) {
              await workItemModel.findByIdAndDelete(workId);
            }

            await subItemModel.findByIdAndDelete(subItemId);
          }
        }

        await mainItemModel.findByIdAndDelete(idMain);
      }
    }

    await Contract.findByIdAndDelete(contractId);

    await User.findByIdAndUpdate(
      _id,
      { $pull: { contracts: contractId } },
      { new: true }
    );

    await Project.updateMany(
      { contracts: contractId },
      { $pull: { contracts: contractId } }
    );

    await Partner.updateMany(
      { contracts: contractId },
      { $pull: { contracts: contractId } }
    );
    res.status(200).json({ message: "Contract deleted successfully" });
  } catch (error) {
    console.error("Error deleting contract:", error);
    res.status(500).json({ message: error.message });
  }
};


const getSingleContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    console.log(contractId);
    if (!contractId) {
      return res.status(400).json({ message: "Contract ID is required" });
    }

    const contract = await Contract.findById(contractId)
    .populate({
      path: "mainId",
      sort: { createdAt: -1 },
      populate: {
        path: "subItems",
        populate: {
          path: "workItems",
        },
      },
    });
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }
    const uniqueMainItems = new Set(
      contract.mainId.map((item) => item._id.toString())
    );
    const totalMainItems = uniqueMainItems.size;

    res.status(200).json({ data: contract, totalMainItems: totalMainItems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getSingleContractAhmed = async (req, res) => {
  try {
    const { contractId } = req.params;

    if (!contractId) {
      return res.status(400).json({ message: "Contract ID is required" });
    }

    const contract = await Contract.findById(contractId).select(
      "-mainId -project -partner -typeOfProgress -status -description -consultant -contractType"
    );
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }
    res.status(200).json({ data: contract });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { _id } = req.user;

    if (!contractId) {
      return res.status(400).json({ message: "Contract ID is required" });
    }

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const user = await User.findById(_id);
    if (!user.contracts.includes(contract._id) && user.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "You don't have permission to update this contract" });
    }

    const updateData = {
      code: req.body.code || contract.code,
      name: req.body.name || contract.name,
      contractType: req.body.contractType || contract.contractType,
      startDate: req.body.startDate || contract.startDate,
      endDate: req.body.endDate || contract.endDate,
      typeOfProgress: req.body.typeOfProgress || contract.typeOfProgress,
      status: req.body.status || contract.status,
      description: req.body.description || contract.description,
      project: req.body.project || contract.project,
      partner: req.body.partner || contract.partner,
      consultant: req.body.consultant || contract.consultant,
    };

    const updatedContract = await Contract.findByIdAndUpdate(
      contractId,
      updateData,
      {
        new: true,
      }
    );

    res.status(200).json({ data: updatedContract });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const calculateTaxAndPayment = async (req, res) => {
  const userId = req.user._id;
  const { contractId } = req.params;
  const { downPaymentValue, taxValue } = req.body;

  try {
    let total = 0;
    const contract = await Contract.findById(contractId).populate({
      path: "mainId",
      sort: { createdAt: -1 },
      populate: {
        path: "subItems",
        populate: {
          path: "workItems",
        },
      },
    });

    console.log(contract);
    contract.mainId.forEach((mainItem) => {
      mainItem.subItems.forEach((subItem) => {
        subItem.workItems.forEach((workItem) => {
          total += workItem.workDetails.total;
          console.log(total);
        });
      });
    });
    console.log("Total before tax:", total);
    const finalTaxValue = taxValue || 0;
    const tax = (total * finalTaxValue) / 100;
    console.log("Calculated tax:", tax);

    const totalContractValue = total + tax;
    const payment = (totalContractValue * downPaymentValue) / 100;
    const dueAmount = totalContractValue - payment;
    const existingContract = await Contract.findById(contractId);
    if (!existingContract) {
      return res.status(404).json({ message: "Contract not found" });
    }
    const updatedContract = await Contract.findByIdAndUpdate(
      contractId,
      {
        taxValue: tax,
        taxRate: taxValue,
        downPaymentValue: payment,
        downPaymentRate: downPaymentValue,
        total,
        totalContractValue,
        dueAmount,
      },
      { new: true }
    );
    console.log(updatedContract);
    res.status(200).json({
      data: { tax, payment, totalContractValue, dueAmount, updatedContract },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPreviousItemNamesByUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate({
      path: "contracts",
      populate: {
        path: "mainId",
        populate: {
          path: "subItems",
        },
      },
    });
    const mainItemNames = new Set();
    const subItemNames = new Set();

    for (const contract of user.contracts) {
      for (const mainItem of contract.mainId) {
        if (mainItem.itemName) {
          mainItemNames.add(mainItem.itemName);
        }
        for (const subItem of mainItem.subItems || []) {
          if (subItem.subItemName) {
            subItemNames.add(subItem.subItemName);
          }
        }
      }
    }
    res.status(200).json({
      mainItemNames: [...mainItemNames],
      subItemNames: [...subItemNames],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving item names" });
  }
};

const getTenantContracts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "tenant not found" });
    }
    const parentUser = await User.findById(user.parentId).populate("contracts");

    res.status(200).json({
      contracts: parentUser.contracts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchContracts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { project, partner, status, contractType } = req.query;
    const orConditions = [];

    if (status) orConditions.push({ status: new RegExp(status, "i") });
    if (contractType)
      orConditions.push({ contractType: new RegExp(contractType, "i") });

    if (partner) {
      orConditions.push({ "partner.partnerName": new RegExp(partner, "i") });
    }
    if (project) {
      orConditions.push({ "project.projectName": new RegExp(project, "i") });
    }
    const userContracts = await User.findById(userId).populate({
      path: "contracts",
      populate: [
        { path: "project", select: "_id projectName" },
        { path: "partner", select: "_id partnerName" },
      ],
    });
    const filteredContracts = userContracts.contracts.filter((contract) => {
      return (
        contract.project.projectName.match(new RegExp(project, "i")) ||
        contract.partner.partnerName.match(new RegExp(partner, "i")) ||
        contract.status.match(new RegExp(status, "i")) ||
        contract.contractType.match(new RegExp(contractType, "i"))
      );
    });
    res.status(200).json({
      message: "Contracts fetched successfully",
      contracts: filteredContracts,
    });
  } catch (error) {
    console.error("Error searching contracts:", error);
    res.status(500).json({ message: "Error searching contracts" });
  }
};

const getUserContractsCode = async (req, res) => {
  try {
    const userId = req.user._id;

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    let parentUser;
    let totalContracts;
    if (user.parentId == null) {
      user = await User.findById(userId).populate({
        path: "contracts",
        select: "code name _id contractType partner project startDate endDate",
        populate: [
          { path: "project", select: "projectName" },
          { path: "partner", select: "partnerName" },
        ],
      });
      totalContracts = await User.findById(userId)
        .populate("contracts")
        .then((user) => user.contracts.length);
    } else {
      parentUser = await User.findById(user.parentId);
      user = await User.findById(parentUser._id).populate({
        path: "contracts",
        select: "code _id",
      });
      totalContracts = await User.findById(parentUser._id)
        .populate("contracts")
        .then((user) => user.contracts.length);
    }
    res.status(200).json({
      contracts: user.contracts,
      totalContracts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  createContract,
  getContracts,
  deleteContract,
  updateContract,
  getSingleContract,
  calculateTaxAndPayment,
  getUserContracts,
  getPreviousItemNamesByUser,
  getTenantContracts,
  searchContracts,
  getUserContractsCode,
  getSingleContractAhmed,
};

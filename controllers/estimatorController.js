const Contract = require("../models/contractModel");
const estimatorModel = require("../models/estimatorModel");
const materialModel = require("../models/materialModel");
const Project = require("../models/projectModel");

const createEstimator = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, projectName, contract, applyOn } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    const newEstimator = new estimatorModel({
      name,
      userId,
      projectName,
      contract,
      applyOn,
    });
    await newEstimator.save();
    res
      .status(201)
      .json({ message: "Estimator created successfully", data: newEstimator });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
const getAllEstimator = async (req, res) => {
  try {
    const userId = req.user._id;
    const estimators = await estimatorModel
      .find({ userId })
      .populate("projectName", "projectName")
      .populate("contract", "code name");
    res.status(200).json({ data: estimators });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getTotalFromMaterial = async (req, res) => {
  try {
    const userId = req.user._id;
    const { riskFactor } = req.body || 0;
    const { estimatorId } = req.params;
    let totalMaterialCost = 0;
    let totalLaborCost = 0;
    let totalEquipmentCost = 0;
    let totalOtherCost = 0;
    let overallTotal = 0;
    const materials = await materialModel.find({ estimatorId, userId });

    const allTotals = materials.map((material) => {
      if (material.category == "Material") {
        totalMaterialCost += material.total;
      } else if (material.category == "Labor") {
        totalLaborCost += material.total;
      } else if (material.category == "Equipment") {
        totalEquipmentCost += material.total;
      } else {
        totalOtherCost += material.total;
      }
    });
    if (riskFactor) {
      overallTotal =
        totalOtherCost +
        totalEquipmentCost +
        totalLaborCost +
        totalMaterialCost +
        ((totalOtherCost +
          totalEquipmentCost +
          totalLaborCost +
          totalMaterialCost) *
          riskFactor) /
          100;
    } else {
      overallTotal =
        totalOtherCost +
        totalEquipmentCost +
        totalLaborCost +
        totalMaterialCost;
    }
    const updateEstimator = await estimatorModel.findByIdAndUpdate(
      estimatorId,
      {
        totalMaterialCost,
        totalLaborCost,
        totalEquipmentCost,
        totalOtherCost,
        overallTotal,
        riskFactor,
      },
      { new: true }
    );
    res.status(200).json({ data: updateEstimator });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getRiskFactorByEstimatorId = async (req, res) => {
  try {
    const { estimatorId } = req.params;
    const estimator = await estimatorModel
      .findOne({ _id: estimatorId, userId: req.user._id })
      .select("riskFactor");
    return res.status(200).json({ riskFactor: estimator });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const getSingleEstimator = async (req, res) => {
  try {
    const { estimatorId } = req.params;
    const userId = req.user._id;
    const estimator = await estimatorModel
      .findById(estimatorId)
      .populate("projectName", "projectName")
      .populate("contract", "code name");
    if (!estimator) {
      return res.status(404).json({ message: "Estimator not found" });
    }
    if (estimator.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view this estimator" });
    }
    res.status(200).json({ data: estimator });
  } catch (error) {
    console.error("Error fetching estimator:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching the estimator" });
  }
};

const deleteEstimator = async (req, res) => {
  try {
    const { estimatorId } = req.params;
    const userId = req.user._id;
    const estimator = await estimatorModel.findById(estimatorId);

    if (!estimator) {
      return res.status(404).json({ message: "Estimator not found" });
    }
    if (estimator.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this estimator" });
    }
    await estimatorModel.findByIdAndDelete(estimatorId);

    res.status(200).json({ message: "Estimator deleted successfully" });
  } catch (error) {
    console.error("Error deleting estimator:", error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the estimator" });
  }
};

// const searchEstimators = async (req, res) => {
//   try {
//     const { projectName, contract, name } = req.query;

//     if (!req.user || !req.user._id) {
//       return res.status(401).json({ message: "Unauthorized. User ID is required." });
//     }

//     const orConditions = [];

//     // البحث بالـ name
//     if (name) {
//       orConditions.push({ name: { $regex: name, $options: "i" } });
//     }

//     // البحث بالـ contract code
//     if (contract) {
//       orConditions.push({ "contract.code": { $regex: contract, $options: "i" } });
//     }

//     // البحث بالـ projectName داخل Project
//     if (projectName) {
//       orConditions.push({ "projectName.projectName": { $regex: projectName, $options: "i" } });
//     }

//     // لو مفيش شروط
//     if (orConditions.length === 0) {
//       return res.status(400).json({ message: "Please provide at least one query parameter." });
//     }

//     const filter = {
//       userId: req.user._id,
//       $or: orConditions,
//     };

//     const estimators = await estimatorModel
//       .find(filter)
//       .populate({
//         path: "projectName",
//         select: "projectName",
//       })
//       .populate({
//         path: "contract",
//         select: "code name",
//       });

//     if (estimators.length === 0) {
//       return res.status(404).json({ data: [], message: "No matching estimators found." });
//     }

//     return res.status(200).json({ data: estimators });
//   } catch (error) {
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// };
const searchEstimators = async (req, res) => {
  try {
    const { projectName, contract, name } = req.query;

    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Unauthorized. User ID is required." });
    }

    const orConditions = [];
    if (name) {
      orConditions.push({ name: { $regex: name, $options: "i" } });
    }
    if (projectName) {
      const projects = await Project.find({
        projectName: { $regex: projectName, $options: "i" },
      });

      const projectIds = projects.map((project) => project._id);
      if (projectIds.length > 0) {
        orConditions.push({ projectName: { $in: projectIds } });
      }
    }
    if (contract) {
      const contracts = await Contract.find({
        code: { $regex: contract, $options: "i" },
      });

      const contractIds = contracts.map((contract) => contract._id);
      if (contractIds.length > 0) {
        orConditions.push({ contract: { $in: contractIds } });
      }
    }
    const filter = {
      userId: req.user._id,
      ...(orConditions.length > 0 && { $or: orConditions }),
    };

    const estimators = await estimatorModel
      .find(filter)
      .populate({ path: "projectName", select: "projectName" })
      .populate({ path: "contract", select: "code name" });
    return res.status(200).json({ data: estimators });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getShowSalesAndIncludeTaxByEstimatorId = async (req, res) => {
  try {
    const { estimatorId, category } = req.params;
    const findMaterial = await materialModel
      .findOne({
        estimatorId: estimatorId,
        userId: req.user._id,
        category: category,
      })
      .select("includeTax showSales taxValue profitMargin");
     const defaultMaterial = {
      includeTax: false,
      showSales: false,
      taxValue: 0,
      profitMargin: 0,
    };

    return res.status(200).json({ data: findMaterial || defaultMaterial });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
module.exports = {
  createEstimator,
  getAllEstimator,
  getTotalFromMaterial,
  getRiskFactorByEstimatorId,
  getShowSalesAndIncludeTaxByEstimatorId,
  deleteEstimator,
  getSingleEstimator,
  searchEstimators,
};

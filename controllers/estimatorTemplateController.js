const estimatorModel = require("../models/estimatorModel");
const estimatorTemplateModel = require("../models/estimatorTemplateModel");
const materialModel = require("../models/materialModel");

const saveAsTemplate = async (req, res) => {
  try {
    const { estimatorId, name, description, tags, category } = req.body;
    if (!estimatorId || !name || !description || !category) {
      return res.status(400).json({
        message:
          "All required fields (estimatorId, name, description, category) must be provided.",
      });
    }
    const estimator = await estimatorModel.findById(estimatorId);
    if (!estimator) {
      return res.status(404).json({ message: "Estimator not found." });
    }
    const materials = await materialModel.find({ estimatorId });
    if (!materials || materials.length === 0) {
      return res.status(404).json({
        message: "No materials found for the provided estimatorId.",
      });
    }
    const template = new estimatorTemplateModel({
      name,
      description,
      tags,
      category,
      userId: estimator.userId,
      materials: materials.map((material) => ({
        materialName: material.materialName,
        unitOfMeasure: material.unitOfMeasure,
        quantity: material.quantity,
        cost: material.cost,
        total: material.total,
        includeTax: material.includeTax,
        showSales: material.showSales,
        taxValue: material.taxValue,
        profitMargin: material.profitMargin,
        taxDeductedValue: material.taxDeductedValue,
        profitValue: material.profitValue,
        category: material.category,
      })),
    });
    await template.save();
    res.status(201).json({
      message: "Estimator Template saved successfully.",
      template,
    });
  } catch (error) {
    console.error("Error saving template:", error);
    res.status(500).json({
      message: "Failed to save template. Please try again later.",
      error: error.message,
    });
  }
};

const getAllEstimatorTemplates = async (req, res) => {
  try {
    const userId = req.user._id;
    const templates = await estimatorTemplateModel.find({ userId }).select('-materials');
    res
      .status(200)
      .json({ message: "Templates retrieved successfully.", templates });
  } catch (error) {
    console.error("Error retrieving templates:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve templates.", error: error.message });
  }
};
const getSingleEstimatorTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    if (!templateId) {
      return res.status(400).json({ message: "Template ID is required." });
    }
    const template = await estimatorTemplateModel.findById(templateId);

    if (!template) {
      return res.status(404).json({ message: "Template not found." });
    }
    res
      .status(200)
      .json({ message: "Template retrieved successfully.", template });
  } catch (error) {
    console.error("Error retrieving template:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve template.", error: error.message });
  }
};
const deleteEstimatorTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user._id;
    if (!templateId) {
      return res.status(400).json({ message: "Template ID is required." });
    }
    const template = await estimatorTemplateModel.findById(templateId);

    if (!template) {
      return res.status(404).json({ message: "Template not found." });
    }
    if (template.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this template." });
    }
    await estimatorTemplateModel.findByIdAndDelete(templateId);
    res.status(200).json({ message: "Template deleted successfully." });
  } catch (error) {
    console.error("Error deleting template:", error);
    res
      .status(500)
      .json({ message: "Failed to delete template.", error: error.message });
  }
};
const getEstimatorTemplateCategories = async (req, res) => {
  try {
    const estimatorTemplates = await estimatorTemplateModel.find(
      { userId: req.user._id },
      "category"
    );
    res.status(200).json({
      message: "Template categories fetched successfully",
      data: estimatorTemplates,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching template names",
      error: error.message,
    });
  }
};
const getEstimatorTemplateNames = async (req, res) => {
  try {
    const estimatorTemplates = await estimatorTemplateModel.find(
      { userId: req.user._id },
      "name"
    );
    res.status(200).json({
      message: "Template names fetched successfully",
      data: estimatorTemplates,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching template names",
      error: error.message,
    });
  }
};
module.exports = {
  saveAsTemplate,
  getAllEstimatorTemplates,
  getSingleEstimatorTemplate,
  deleteEstimatorTemplate,
  getEstimatorTemplateCategories,
  getEstimatorTemplateNames
};

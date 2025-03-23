const Template = require("../models/templateModel");
const Contract = require("../models/contractModel");

const saveTemplate = async (req, res) => {
  try {
    const { contractId, name, description, category, tags } = req.body;

    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Unauthorized, please login first!" });
    }
    const contract = await Contract.findById(contractId);

    if (!contract) {
      return res.status(404).json({ message: "Contract not found!" });
    }
    const existingTemplate = await Template.findOne({
      name,
      mainId: { $all: contract.mainId },
    });

    if (existingTemplate) {
      return res.status(400).json({
        message: "Template with the same name and mainId already exists!",
      });
    }
    const newTemplate = new Template({
      name,
      description,
      category,
      tags,
      mainId: contract.mainId,
      createdBy: req.user._id,
    });
    await newTemplate.save();
    res.status(201).json({
      message: "Template created successfully!",
      template: newTemplate,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create template!",
      error: error.message,
    });
  }
};
const unSaveTemplate = async (req, res) => {
  const { templateId } = req.params;
  const userId = req.user._id;
  try {
    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: "Template not found!" });
    }
    if (template.createdBy.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this template!" });
    }
    await Template.findByIdAndDelete(templateId);
    res.status(200).json({
      message: "Template removed successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to remove template!",
      error: error.message,
    });
  }
};

const getTemplates = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized. Please login." });
    }
    const templates = await Template.find({ createdBy: req.user._id });

    res.status(200).json({ data: templates });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fetch templates!", error: error.message });
  }
};
const getSingleTemplate = async (req, res) => {
  const { templateId } = req.params;
  const userId = req.user._id;
  try {
    const template = await Template.findOne({
      _id: templateId,
      createdBy: userId,
    }).populate({
      path: "mainId",
      sort: { createdAt: -1 },
      populate: {
        path: "subItems",
        populate: {
          path: "workItems",
        },
      },
    });
    const uniqueMainItems = new Set(
      template.mainId.map((item) => item._id.toString())
    );
    const totalMainItems = uniqueMainItems.size;
    res
      .status(200)
      .json({
        message: "Template found",
        data: template,
        totalMainItems: totalMainItems,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching template", error: error.message });
  }
};
const deleteTemplate = async (req, res) => {
  const { templateId } = req.params;
  const userId = req.user._id;

  try {
    const deletedTemplate = await Template.findOneAndDelete({
      _id: templateId,
      createdBy: userId,
    });

    if (!deletedTemplate) {
      return res
        .status(404)
        .json({ message: "Template not found or access denied" });
    }

    res.status(200).json({
      message: "Template deleted successfully",
      data: deletedTemplate,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting template", error: error.message });
  }
};
const updateTemplate = async (req, res) => {
  const { templateId } = req.params;
  const userId = req.user._id;
  const { name, description, tags, category } = req.body;
  try {
    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    if (template.createdBy.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this template" });
    }
    const updatedData = {};
    if (name) updatedData.name = name;
    if (description) updatedData.description = description;
    if (tags) updatedData.tags = tags;
    if (category) updatedData.category = category;
    const updatedTemplate = await Template.findByIdAndUpdate(
      templateId,
      updatedData,
      { new: true }
    );

    res.status(200).json({
      message: "Template updated successfully",
      data: updatedTemplate,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating template",
      error: error.message,
    });
  }
};

const searchTemplates = async (req, res) => {
  const { name, description, category } = req.query;
  const userId = req.user._id;
  try {
    const filter = {
      createdBy: userId,
    };

    const searchConditions = [];

    if (name) {
      searchConditions.push({ name: { $regex: name, $options: "i" } });
    }
    if (description) {
      searchConditions.push({
        description: { $regex: description, $options: "i" },
      });
    }
    if (category) {
      searchConditions.push({ category: { $regex: category, $options: "i" } });
    }
    if (searchConditions.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one search parameter is required" });
    }
    const templates = await Template.find({
      $and: [filter, { $or: searchConditions }],
    });

    // إذا كانت النتائج موجودة
    if (templates.length > 0) {
      res.status(200).json({ message: "Templates found", data: templates });
    } else {
      res.status(200).json({ message: "No templates found", data: [] });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error searching templates",
      error: error.message,
    });
  }
};
const getTemplateNames = async (req, res) => {
  try {
    const templates = await Template.find({ createdBy: req.user._id }, "name");
    if (templates.length > 0) {
      res.status(200).json({
        message: "Template names fetched successfully",
        data: templates,
      });
    } else {
      res.status(404).json({ message: "No templates found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching template names",
      error: error.message,
    });
  }
};
const getTemplateCategories = async (req, res) => {
  try {
    const templates = await Template.find(
      { createdBy: req.user._id },
      "category"
    );
    res.status(200).json({
      message: "Template names fetched successfully",
      data: templates,
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
  saveTemplate,
  unSaveTemplate,
  getTemplates,
  getSingleTemplate,
  deleteTemplate,
  updateTemplate,
  searchTemplates,
  getTemplateNames,
  getTemplateCategories,
};

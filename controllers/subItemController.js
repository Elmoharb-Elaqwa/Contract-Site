const mainItemModel = require("../models/mainItemModel");
const materialModel = require("../models/materialModel");
const SubItem = require("../models/subItemModel");
const workConfirmationModel = require("../models/workConfirmationModel");
const workItemModel = require("../models/workItemModel");

const addSubItem = async (req, res) => {
  try {
    const { mainId, subItemName } = req.body;

    const newSubItem = new SubItem({
      subItemName,
    });

    const savedSubItem = await newSubItem.save();
    console.log(savedSubItem);
    const mainItem = await mainItemModel.findById(mainId);
    if (!mainId) {
      return res.status(404).json({ message: "mainItem not found" });
    }
    mainItem.subItems.push(savedSubItem._id);
    await mainItem.save();

    res.status(201).json({
      message: "Sub Item added and linked to Main Item successfully!",
      data: savedSubItem,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding Work Item",
      error: error.message,
    });
  }
};
const getAllSubItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const subItems = await SubItem.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("workItems");
    const totalItems = await SubItem.countDocuments();
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      totalItems,
      totalPages,
      currentPage: page,
      data: subItems,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving Sub Items",
      error: error.message,
    });
  }
};

const getSingleSubItem = async (req, res) => {
  try {
    const { id } = req.params;
    const subItem = await SubItem.findById(id).populate("workItems");

    if (!subItem) {
      return res.status(404).json({ message: "Sub Item not found" });
    }

    res.status(200).json({ data: subItem });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving Sub Item",
      error: error.message,
    });
  }
};

const updateSubItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { subItemName } = req.body;
    const subItem = await SubItem.findById(id);
    if (!subItem) {
      return res.status(404).json({ message: "Sub Item not found" });
    }
    if (
      req.user.role !== "admin" &&
      subItem.userId.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this Sub Item" });
    }
    const updatedSubItem = await SubItem.findByIdAndUpdate(
      id,
      { subItemName },
      { new: true }
    );

    res.status(200).json({
      message: "Sub Item updated successfully!",
      data: updatedSubItem,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const deleteSub = async (req, res) => {
  try {
    const { id } = req.params;
    const subItem = await SubItem.findById(id).populate("workItems");
    if (!subItem) {
      return res.status(404).json({ message: "Sub Item not found" });
    }
    const workItemIds = subItem.workItems.map((workItem) => workItem._id);
    if (workItemIds.length > 0) {
      await workConfirmationModel.updateMany(
        { "workItems.workItemId": { $in: workItemIds } },
        { $pull: { workItems: { workItemId: { $in: workItemIds } } } }
      );
      await materialModel.deleteMany({ boqLineItem: { $in: workItemIds } });
      await workItemModel.deleteMany({ _id: { $in: workItemIds } });
    }
    await SubItem.findByIdAndDelete(id);

    res.status(200).json({
      message: "Sub Item and its associated Work Items deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting Sub Item",
      error: error.message,
    });
  }
};

module.exports = {
  addSubItem,
  getAllSubItems,
  getSingleSubItem,
  updateSubItem,
  deleteSub,
};

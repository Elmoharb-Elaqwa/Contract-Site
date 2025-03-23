const Partner = require("../models/partnerModel");
const User = require("../models/userModel");

const createPartner = async (req, res) => {
  try {
    const { _id } = req.user;
    const {
      partnerName,
      type,
      phone,
      email,
      address,
      taxNumber,
      commercialNumber,
    } = req.body;
    if (
      !partnerName ||
      !type ||
      !phone ||
      !email ||
      !address ||
      !taxNumber ||
      !commercialNumber
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const user = await User.findById(_id);
    const companyName = user.companyName;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const findEmailAndCompanyName = await Partner.findOne({
      email,
      companyName,
    });
    if (findEmailAndCompanyName) {
      return res.status(400).json({ message: "email already exist" });
    }
    let image = null;
    if (req.file) {
      image = req.file.filename;
    }
    const partner = await Partner.create({
      partnerName,
      type,
      phone,
      email,
      address,
      taxNumber,
      commercialNumber,
      image,
      companyName,
      userId: _id,
    });
    res
      .status(201)
      .json({ message: "Partner created successfully", data: partner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserPartner = async (req, res) => {
  try {
    const { _id } = req.user;
    const partners = await Partner.find({ userId: _id }).select(
      "partnerName id type"
    );
    if (!partners) {
      return res
        .status(404)
        .json({ message: "No partners found for this user" });
    }
    res.status(200).json({
      message: "Partners fetched successfully",
      partners,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching partners",
      error: error.message,
    });
  }
};

const getAllPartner = async (req, res) => {
  try {
    const { _id } = req.user;
    const partners = await Partner.find({ userId: _id });
    if (!partners) {
      return res
        .status(404)
        .json({ message: "No projects found for this user" });
    }
    res.status(200).json({
      message: "partners fetched successfully",
      partners,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching partners",
      error: error.message,
    });
  }
};

const deletePartner = async (req, res) => {
  const { partnerId } = req.params;
  const { _id } = req.user;

  try {
    const partner = await Partner.findOneAndDelete({
      _id: partnerId,
      userId: _id,
    });

    if (!partner) {
      return res.status(404).json({
        message: "Partner not found or you're not authorized to delete it",
      });
    }

    res.status(200).json({
      message: "Partner deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting partner",
      error: error.message,
    });
  }
};

const updatePartner = async (req, res) => {
  const { partnerId } = req.params;
  const { _id: userId } = req.user;
  try {
    const partner = await Partner.findOne({ _id: partnerId, userId });
    if (!partner) {
      return res.status(404).json({
        message: "Partner not found or you're not authorized to update it",
      });
    }
    const updatedFields = req.body;
    Object.keys(updatedFields).forEach((key) => {
      partner[key] = updatedFields[key];
    });

    if (req.file) {
      partner.image = req.file.filename;
    }

    await partner.save();

    res.status(200).json({
      message: "Partner updated successfully",
      partner,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating partner",
      error: error.message,
    });
  }
};

const getConsultantPartners = async (req, res) => {
  try {
    const { _id } = req.user;
    const consultants = await Partner.find({
      userId: _id,
      type: "Consultant",
    }).select("partnerName _id");

    if (!consultants.length) {
      return res
        .status(404)
        .json({ message: "No consultants found for this user" });
    }

    res.status(200).json({
      message: "Consultants fetched successfully",
      consultants,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching consultants",
      error: error.message,
    });
  }
};

module.exports = {
  createPartner,
  getUserPartner,
  getAllPartner,
  deletePartner,
  updatePartner,
  getConsultantPartners,
};

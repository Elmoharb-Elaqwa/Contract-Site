const mongoose = require("mongoose");
const validator = require("validator");
const partnerSchema = new mongoose.Schema({
  partnerName: { type: String, required: true },
  companyName: { type: String },
  type: {
    type: String,
    required: true,
    enum: ["Owner", "Sub-contractor", "Consultant"],
  },
  phone: { type: String, required: true },
  email: {
    type: String,
    required: true,
    validate: [validator.isEmail, "Invalid email"],
  },
  address: { type: String, required: true },
  taxNumber: { type: Number, required: true },
  commercialNumber: { type: Number, required: true },
  image: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  contracts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Contract" }],
});
partnerSchema.index({ email: 1, companyName: 1 }, { unique: true });

const Partner = mongoose.model("Partner", partnerSchema);

module.exports = Partner;

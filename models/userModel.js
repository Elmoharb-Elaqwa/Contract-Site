const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["Admin", "User"],
      required: true,
    },
    usersGroup: [{ type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    parentId:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
    firstName: { type: String },
    secondName: { type: String },
    companyName: { type: String,required: true},
    companySize: { type: String },
    companyType: { type: String, enum: ["Contractor", "Sub-Contractor"] },
    phone: { type: String },
    email: {
      type: String,
      unique: true,
      required: true,
      validate: [validator.isEmail, "Invalid email"],
    },
    password: { type: String, required: true, minlength: 6 },
    confirmPassword: { type: String },
    contracts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contract",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);

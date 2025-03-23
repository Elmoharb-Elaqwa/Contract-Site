const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    sku: {
      type: String,
      required: [true, "Sku is required"],
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    uom: {
      type: String,
      required: [true, "Uom is required"],
      trim: true,
    },
    // category: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   required: true,
    //   ref: "Category",
    // },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be a positive number"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },
    supplier: {
      type: String,
      required: [true, "Supplier is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

const ProductModel = mongoose.model("Product", productSchema);
module.exports = ProductModel;

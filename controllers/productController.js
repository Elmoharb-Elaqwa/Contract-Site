const Product = require("../models/productModel");
const slugify = require("slugify");
const mongoose = require("mongoose");
const CategoryModel = require("../models/categoryModel");

/**
 * @desc Get Products
 * @route GET api/v1/products
 * @access Public
 */
const getProducts = async (req, res, next) => {
  try {
    let filterQueries = { ...req.query };
    const userId = req.user._id;
    // Fields that should be excluded from the filter query
    const excludedQueries = ["page", "pages", "limit", "sort", "field"];
    excludedQueries.forEach((field) => delete filterQueries[field]);

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const skip = (page - 1) * limit;
    filterQueries.userId = userId;
    // Get the total number of products (to calculate results and pages)
    const totalProducts = await Product.countDocuments(filterQueries);

    // Fetch products with the filter query, pagination, and populating category
    const products = await Product.find(filterQueries)
      .skip(skip)
      .limit(limit)
      .populate("category");

    // Calculate total pages
    const totalPages = Math.round(totalProducts / limit);

    res.status(200).json({
      page,
      limit,
      skip,
      results: products.length, // Number of products in the current page
      pages: totalPages, // Total number of pages
      products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Create a Product
 * @route POST api/v1/products
 * @access Admin
 */
const postProduct = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { sku, name, category, price, quantity, supplier, description, uom } =
      req.body;

    if (
      !name ||
      !sku ||
      !category ||
      !price ||
      !quantity ||
      !supplier ||
      !description ||
      !uom
    ) {
      return next(new ApiError("All fields are required", 400));
    }
    // const findCategory = await CategoryModel.findOne({ name: category });
    // if (!findCategory) {
    //   return next(new ApiError("Category not found", 404));
    // }
    const product = await Product.create({
      sku,
      name,
      slug: slugify(name, { lower: true }),
      //category: findCategory._id,
      category,
      price,
      quantity,
      uom,
      supplier,
      description,
      userId,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Get a Product
 * @route GET api/v1/products/:id
 * @access Public
 */
const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError("Invalid product ID", 400));
    }

    const product = await Product.findById(id);

    if (!product) {
      return next(new ApiError("Product not found", 404));
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Update a Product
 * @route PUT api/v1/products/:id
 * @access Admin
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, price, quantity, supplier, description, uom } =
      req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError("Invalid product ID", 400));
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (category) updateFields.category = category;
    if (price) updateFields.price = price;
    if (quantity) updateFields.quantity = quantity;
    if (supplier) updateFields.supplier = supplier;
    if (uom) updateFields.uom = uom;
    if (description) updateFields.description = description;
    if (name) updateFields.slug = slugify(name, { lower: true });

    const product = await Product.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!product) {
      return next(new ApiError("Product not found", 404));
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Delete a Product
 * @route DELETE api/v1/products/:id
 * @access Admin
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError("Invalid product ID", 400));
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return next(new ApiError("Product not found", 404));
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductNames = async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id }).select(
      "name price uom"
    );
    // const productNames = products.map((product) => product.name);
    return res.status(200).json({ data: products });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
module.exports = {
  getProducts,
  postProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductNames,
};

const slugify = require("slugify");
const mongoose = require("mongoose");
const categoryModel = require("../models/categoryModel");


/**
 * @desc Get Categories
 * @route GET api/v1/categories
 * @access Public
 */
const getCategories = async (req, res, next) => {
  // Copy query parameters and remove pagination and sorting parameters
  try {
    let filterQueries = { ...req.query };
    const exutedQueries = ["page", "limit", "sort", "feild"];
    exutedQueries.forEach((field) => delete filterQueries[field]);

    // Get page, limit, and calculate skip value for pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 5;
    const skip = (page - 1) * limit;

    // Get the total number of categories based on filter queries
    const totalCategories = await categoryModel.countDocuments(filterQueries);

    // Fetch categories with pagination and filter queries applied
    const categories = await categoryModel
      .find(filterQueries)
      .skip(skip)
      .limit(limit);

    // Send response with pagination data and categories
    res.status(200).json({
      skip,
      limit,
      page,
      results: categories.length,
      pages: Math.ceil(totalCategories / limit), // Calculate total pages
      categories, // Return the fetched categories
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc Create a Category
 * @route POST api/v1/categories
 * @access Admin
 */
const postCategory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name } = req.body;

    const category = await categoryModel.create({
      userId,
      name,
      slug: slugify(name, { lower: true }),
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc Get a Category
 * @route GET api/v1/categories/:id
 * @access Public
 */
const getCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError("Invalid category ID", 400));
    }

    const category = await categoryModel.findById(id);

    if (!category) {
      return next(new ApiError("Category not found", 404));
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Update a Category
 * @route PUT api/v1/categories/:id
 * @access Admin
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError("Invalid category ID", 400));
    }

    const category = await categoryModel.findByIdAndUpdate(
      id,
      { name, slug: slugify(name, { lower: true }) },
      { new: true }
    );

    if (!category) {
      return next(new ApiError("Category not found", 404));
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Delete a Category
 * @route DELETE api/v1/categories/:id
 * @access Admin
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError("Invalid category ID", 400));
    }

    const category = await categoryModel.findByIdAndDelete(id);

    if (!category) {
      return next(new ApiError("Category not found", 404));
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  postCategory,
  getCategory,
  updateCategory,
  deleteCategory,
};

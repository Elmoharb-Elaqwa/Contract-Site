const express = require("express");
const {
  getCategories,
  postCategory,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { auth } = require("../middlewares/auth");
const router = express.Router();

router.route("/").get(auth,getCategories).post(auth,postCategory);
router
  .route("/:id")
  .get(getCategory)
  .put(updateCategory)
  .delete(deleteCategory);

module.exports = router;

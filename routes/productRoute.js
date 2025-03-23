const express = require("express");
const {
  getProducts,
  postProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductNames,
} = require("../controllers/productController");
const { auth } = require("../middlewares/auth");
const router = express.Router();

router.get("/",auth, getProducts);
router.post("/", auth, postProduct);
router.get("/names", auth, getProductNames);
router.get("/:id",getProduct)
router.put("/:id",updateProduct)
router.delete("/:id",deleteProduct);

module.exports = router;

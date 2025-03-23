const express = require("express");
const {
  addDeduction,
  getDeductions,
  deleteDeduction,
} = require("../controllers/deductionController");
const { auth, restrictTo } = require("../middlewares/auth.js");
const router = express.Router();

router.post("/:contractId", auth, addDeduction);
router.get("/:contractId", auth, getDeductions);
router.delete("/:deductionId", auth, deleteDeduction);
module.exports = router;

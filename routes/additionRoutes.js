const express = require("express");
const {
  addAddition,
  getAdditions,
  deleteAddition,
} = require("../controllers/additionController");
const { auth } = require("../middlewares/auth.js");

const router = express.Router();

router.post("/:contractId",auth, addAddition);
router.get("/:contractId",auth, getAdditions);
router.delete("/:additionId", auth, deleteAddition);
module.exports = router;

const express = require("express");

const { auth } = require("../middlewares/auth.js");
const {
  deductionWorkConfirmation,
  getdeductionsWorkConfirmation,
  deleteDeductionWorkConfirmation,
} = require("../controllers/deductionWorkConfirmation.js");

const router = express.Router();

router.post("/:workConfirmationId", auth, deductionWorkConfirmation);
router.get("/:workConfirmationId", auth, getdeductionsWorkConfirmation);
router.delete("/:deductionId",auth, deleteDeductionWorkConfirmation);
module.exports = router;

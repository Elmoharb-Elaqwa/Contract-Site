const express = require("express");
const router = express.Router();
const {
  createWorkConfirmation,
  getAllWorkConfirmation,
  getSingleWorkConfirmation,
  deleteWorkConfirmation,
  updateWorkConfirmation,
  updateWorkConfirmationBaseOnWorkItem,
  searchByWorkItemName,
  searchWorkConfirmation,
} = require("../controllers/workConfirmationController");
const { auth } = require("../middlewares/auth");

router.post("/create", auth, createWorkConfirmation);
router.get("/", auth, getAllWorkConfirmation);
router.get("/search/:workConfirmationId", auth, searchByWorkItemName);
router.get("/search/find", auth, searchWorkConfirmation);
router.get("/:id", auth, getSingleWorkConfirmation);
router.delete("/:id", auth, deleteWorkConfirmation);
router.put("/:id", auth, updateWorkConfirmation);
router.put(
  "/workConfirmation/:workConfirmationId/:id",
  auth,
  updateWorkConfirmationBaseOnWorkItem
);
module.exports = router;

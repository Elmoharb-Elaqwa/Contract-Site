const express = require("express");
const {
  addSubItem,
  getAllSubItems,
  searchSubItem,
  getSingleSubItem,
  updateSubItem,
  deleteSub,
} = require("../controllers/subItemController");
const { auth } = require("../middlewares/auth");
const router = express.Router();

router.post("/", addSubItem);
router.get("/",auth, getAllSubItems);
router.get("/:id", getSingleSubItem);
router.put("/:id", updateSubItem);
router.delete("/:id",auth, deleteSub);

module.exports = router;

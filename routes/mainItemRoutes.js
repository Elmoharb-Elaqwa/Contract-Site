const express = require("express");
const {
  addMainItem,
  getAllMainItems,
  getSingleMainItem,
  updateMainItem,
  deleteMain,
  searchMainItemOrSubItem,
} = require("../controllers/mainItemController");

const router = express.Router();

router.post("/", addMainItem);
router.get("/", getAllMainItems);
router.get("/search", searchMainItemOrSubItem);

router.get("/:id", getSingleMainItem);
router.put("/:id", updateMainItem);
router.delete("/:id", deleteMain);

module.exports = router;

const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const {
  addWorkDetailsItem,
  getAllWorkItems,
  getSingleWorkItem,
  updateWorkItem,
  deleteWork,
  insertSheet,
  getWorkItemTotals,
  addSingleBoq,
  getWorkItemsForContract,
  getWorkItemsNameForContract,
} = require("../controllers/workItemController");
const { auth } = require("../middlewares/auth");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../excelFiles");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
  },
});
const upload = multer({ storage: storage });
const router = express.Router();

router.post("/boq/:contractId", auth, addSingleBoq);
router.post("/:userId", addWorkDetailsItem);
router.post("/sheet/:contractId", auth, upload.single("file"), insertSheet);
router.get("/",auth, getAllWorkItems);
router.get("/:contractId", auth, getWorkItemsForContract);
router.get("/names/:contractId", auth, getWorkItemsNameForContract);
router.get("/total/:userId", getWorkItemTotals);
router.get("/:id", getSingleWorkItem);
router.put("/:id", updateWorkItem);
router.delete("/:id",auth, deleteWork);
//router.delete("/boq/:contractId/:mainItemId", auth, deleteBoq);

module.exports = router;

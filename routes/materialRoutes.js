const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { auth } = require("../middlewares/auth");
const {
  addMaterial,
  getAllMaterials,
  getSingleMaterial,
  deleteMaterial,
  calculateSalesAndTax,
  getAllByCategory,
  insertMaterial,
  getAllByCategoryNames,
} = require("../controllers/materialController");
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

router.post("/", auth, addMaterial);
router.post("/calculate/:estimatorId", auth, calculateSalesAndTax);
router.post("/:estimatorId", auth, upload.single("file"), insertMaterial);
router.get("/:estimatorId", auth, getAllMaterials);
router.get("/:category/:estimatorId", auth, getAllByCategory);
router.get("/single/:materialId", auth, getSingleMaterial);
router.get("/names/:category/:estimatorId", auth, getAllByCategoryNames);
router.delete("/:materialId", auth, deleteMaterial);


module.exports = router;

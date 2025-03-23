const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { auth } = require("../middlewares/auth");
const {
  saveAsTemplate,
  getAllEstimatorTemplates,
  getSingleEstimatorTemplate,
  deleteEstimatorTemplate,
  getEstimatorTemplateCategories,
  getEstimatorTemplateNames,
} = require("../controllers/estimatorTemplateController");
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

router.post("/save", auth, saveAsTemplate);
router.get("/", auth, getAllEstimatorTemplates);
router.get("/categories",auth, getEstimatorTemplateCategories);
router.get("/names",auth, getEstimatorTemplateNames);
router.get("/:templateId", auth, getSingleEstimatorTemplate);
router.delete("/:templateId", auth, deleteEstimatorTemplate);
module.exports = router;

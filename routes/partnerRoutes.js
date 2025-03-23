const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { auth } = require("../middlewares/auth.js");
const {
  createPartner,
  getUserPartner,
  getAllPartner,
  deletePartner,
  updatePartner,
  getConsultantPartners,
} = require("../controllers/partnerController.js");

//upload image
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../partnerImages");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

const router = express.Router();

//create partner
router.post("/create", auth, upload.single("image"), createPartner);
//get partners for user
router.get("/", auth, getUserPartner);
//get consultant for user
router.get("/consultants", auth, getConsultantPartners);
//get all partners
router.get("/all", auth, getAllPartner);
//delete partner
router.delete("/:partnerId", auth, deletePartner);
//update partner
router.put("/:partnerId", auth, upload.single("image"), updatePartner);
module.exports = router;

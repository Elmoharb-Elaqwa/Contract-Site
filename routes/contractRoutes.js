const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const {
  createContract,
  getContracts,
  deleteContract,
  updateContract,
  getSingleContract,
  calculateTaxAndPayment,
  getUserContracts,
  getPreviousItemNamesByUser,
  getTenantContracts,
  searchContracts,
  getUserContractsCode,
  getSingleContractAhmed,
} = require("../controllers/contractController");
const { auth } = require("../middlewares/auth");
const router = express.Router();
//upload image
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../contractImages");

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
router.get("/",auth, getContracts);
router.get("/user",auth, getUserContracts);
router.get("/code",auth, getUserContractsCode);
router.get("/tenant",auth, getTenantContracts);
router.get("/search", auth, searchContracts);
router.get("/:contractId",auth, getSingleContract);
router.get("/ahmed/:contractId", auth, getSingleContractAhmed);
router.get('/user/previous-item-names', auth, getPreviousItemNamesByUser);
router.post("/",auth, createContract);
router.post("/calculate/:contractId",auth, calculateTaxAndPayment);
router.put("/:contractId",auth, updateContract);
router.delete("/:contractId",auth, deleteContract);

module.exports = router;

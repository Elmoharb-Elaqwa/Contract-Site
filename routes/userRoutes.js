const {
  login,
  register,
  logout,
  getAllUsers,
  profile,
  deleteUser,
  getSingleUser,
  updateUser,
  googleAuth,
  addToUserGroup,
  checkExpireToken,
} = require("../controllers/userController.js");

const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { auth, restrictTo } = require("../middlewares/auth.js");


//upload image
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../userImages");
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

//register
router.post("/register", register);
// add to user group
router.post("/addTenantToGroup", auth, addToUserGroup);
//login
router.post("/login", login);
//logout
router.post("/logout", logout);
// check expiration token
router.get("/checkToken", checkExpireToken);
//login with google
router.post("/googleLogin", googleAuth);
//get all users
router.get("/users", auth, restrictTo("Admin"), getAllUsers);
//profile
router.get("/profile", auth, profile);
//get single user
router.get("/:userId", auth, getSingleUser);
//delete user
router.delete("/:id", auth, restrictTo("Admin"), deleteUser);
//update user
router.put("/:id", auth, updateUser);
module.exports = router;

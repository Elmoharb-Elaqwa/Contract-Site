const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { auth } = require("../middlewares/auth.js");
const {
  createProject,
  getUserProjects,
  deleteProject,
  getAllProjects,
  getSingleProject,
  updateProject,
  getUserGroupsOfNames,
  getProjectStatusSummary,
  searchProjects,
  duplicateProject,
  getProjectContracts,
  getUserProjectNames,
} = require("../controllers/projectController.js");

//upload image
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../projectImages");
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
//create project
router.post("/create", auth, upload.array("documents", 10), createProject);
//duplicate project
router.post('/duplicate/:projectId', auth, duplicateProject);
//get projects for user
router.get("/", auth, getUserProjects);
//get all projects (names) for user
router.get("/names", auth, getUserProjectNames);
//get all projects
router.get("/all", auth, getAllProjects);
//get Project Status Summary
router.get("/status", auth, getProjectStatusSummary);
// search by project name or project manager or status
router.get("/search", auth, searchProjects);
//get names of userGroup
router.get("/groups/names", auth, getUserGroupsOfNames);
// get all contracts for project
router.get("/contracts/:projectId", auth, getProjectContracts);
//get single project
router.get("/:projectId",auth, getSingleProject);
//delete project
router.delete("/:projectId", auth, deleteProject);
//update project
router.put('/:projectId', auth,upload.array("documents", 10), updateProject);

module.exports = router;

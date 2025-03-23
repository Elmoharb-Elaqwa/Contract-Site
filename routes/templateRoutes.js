const express = require("express");
const {
  saveTemplate,
  getTemplates,
  searchTemplates,
  deleteTemplate,
  getSingleTemplate,
  updateTemplate,
  unSaveTemplate,
  getTemplateNames,
  getTemplateCategories,
} = require("../controllers/templateController");
const { auth } = require("../middlewares/auth");
const router = express.Router();
router.post("/save", auth, saveTemplate);
router.post("/unsave/:templateId", auth, unSaveTemplate);
router.get("/",auth, getTemplates);
router.get("/names",auth, getTemplateNames);
router.get("/categories",auth, getTemplateCategories);
router.get("/search",auth, searchTemplates);
router.get("/:templateId",auth, getSingleTemplate);
router.delete("/:templateId",auth, deleteTemplate);
router.put("/:templateId",auth, updateTemplate);
module.exports = router;

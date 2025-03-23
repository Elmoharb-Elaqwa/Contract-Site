const Contract = require("../models/contractModel");
const estimatorModel = require("../models/estimatorModel");
const Material = require("../models/materialModel");
const fs = require("fs");
const path = require("path");
const excelToJson = require("convert-excel-to-json");
const Project = require("../models/projectModel");
const workItemModel = require("../models/workItemModel");
const ProductModel = require("../models/productModel");
const mongoose = require("mongoose");
const addMaterial = async (req, res) => {
  try {
    const {
      estimatorId,
      projectName,
      contract,
      applyOn,
      category,
      boqLineItem,
      materialName,
      unitOfMeasure,
      quantity,
      cost,
    } = req.body;
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User ID is missing." });
    }
    const userId = req.user._id;
    if (!projectName || !contract || !applyOn) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    if (applyOn === "BOQ Line" && !boqLineItem) {
      return res
        .status(400)
        .json({ error: "BOQ Line is required when applyOn is 'BOQ Line'." });
    }
    if (applyOn === "BOQ Lines") {
      const contractDetails = await Contract.findOne({
        _id: contract,
      }).populate({
        path: "mainId",
        populate: {
          path: "subItems",
          populate: {
            path: "workItems",
            model: "Work",
          },
        },
      });

      if (!contractDetails) {
        return res.status(400).json({ error: "Contract not found." });
      }

      const isBoqLineValid = contractDetails.mainId.some((mainItem) =>
        mainItem.subItems.some((subItem) =>
          subItem.workItems.some(
            (workItem) => workItem._id.toString() === boqLineItem
          )
        )
      );

      if (!isBoqLineValid) {
        return res.status(400).json({
          error:
            "The selected BOQ line is not associated with the given contract.",
        });
      }
    }
    const existingMaterial = await Material.findOne({ category, estimatorId });
    const includeTax = existingMaterial?.includeTax === true;
    const showSales = existingMaterial?.showSales === true;
    const total = quantity * cost;
    const newMaterial = new Material({
      estimatorId,
      projectName,
      contract,
      applyOn,
      category,
      userId,
      boqLineItem: applyOn === "BOQ Lines" ? boqLineItem : null,
      materialName,
      unitOfMeasure,
      quantity,
      cost,
      total,
      includeTax,
      showSales,
    });

    await newMaterial.save();
    res.status(201).json({
      message: "added successfully!",
      newMaterial,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
const getAllMaterials = async (req, res) => {
  try {
    const { estimatorId } = req.params;
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User not logged in." });
    }
    const materials = await Material.find({
      estimatorId,
      userId: req.user._id,
      category: "Material",
    })
      .populate("projectName", "projectName")
      .populate("contract", "code name")
      .populate("boqLineItem", "workItemName")
      .populate("materialName", "name");
    const materialss = await Material.find({
      estimatorId,
      userId: req.user._id,
      category: { $in: ["Labor", "Equipment", "OtherCost"] },
    })
      .populate("projectName", "projectName")
      .populate("contract", "code name")
      .populate("boqLineItem", "workItemName");
    res.status(200).json({ material: materials, other: materialss });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
const getSingleMaterial = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User not logged in." });
    }

    const { materialId } = req.params;

    if (!materialId) {
      return res.status(400).json({ error: "Material ID is required." });
    }

    const material = await Material.findOne({
      _id: materialId,
      userId: req.user._id,
    })
      .populate("projectName", "projectName")
      .populate("contract", "code name")
      .populate("boqLineItem", "workItemName");
    res.status(200).json({ data: material });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
const deleteMaterial = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User not logged in." });
    }
    const { materialId } = req.params;
    if (!materialId) {
      return res.status(400).json({ error: "Material ID is required." });
    }
    const material = await Material.findOne({
      _id: materialId,
      userId: req.user._id,
    });

    if (!material) {
      return res.status(404).json({ message: "Material not found." });
    }
    await Material.findByIdAndDelete(materialId);

    res.status(200).json({ message: "Material deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
const calculateSalesAndTax = async (req, res) => {
  try {
    const { estimatorId } = req.params;
    const { showSales, includeTax, taxValue, profitMargin, category } =
      req.body;

    // التحقق من المدخلات
    if (typeof showSales !== "boolean" || typeof includeTax !== "boolean") {
      return res
        .status(400)
        .json({ message: "Invalid or missing showSales/includeTax" });
    }
    if (showSales && (isNaN(profitMargin) || profitMargin < 0)) {
      return res
        .status(400)
        .json({ message: "Invalid or missing profitMargin" });
    }
    if (includeTax && (isNaN(taxValue) || taxValue < 0)) {
      return res.status(400).json({ message: "Invalid or missing taxValue" });
    }

    // جلب المواد من قاعدة البيانات
    const materials = await Material.find({
      category: category,
      estimatorId: estimatorId,
    });
    // تجهيز عمليات التحديث
    const bulkOperations = materials.map((material) => {
      const updates = {};

      if (showSales && profitMargin > 0) {
        updates.profitValue =
          material.total + (material.total * profitMargin) / 100;
      }

      if (includeTax && taxValue > 0) {
        updates.taxDeductedValue =
          material.total - (material.total * taxValue) / 100;
      }

      return {
        updateOne: {
          filter: { _id: material._id },
          update: {
            $set: {
              showSales,
              includeTax,
              profitMargin,
              taxValue,
              ...updates,
            },
          },
        },
      };
    });

    // تنفيذ التحديثات دفعة واحدة
    await Material.bulkWrite(bulkOperations);

    // تجهيز الرد مع إظهار كل من الـ ID والبيانات
    const updatedData = materials.map((material) => ({
      id: material._id,
      showSales,
      includeTax,
      profitMargin,
      taxValue,
      profitValue:
        showSales && profitMargin > 0
          ? material.total + (material.total * profitMargin) / 100
          : undefined,
      taxDeductedValue:
        includeTax && taxValue > 0
          ? material.total - (material.total * taxValue) / 100
          : undefined,
    }));

    // إرجاع النتائج
    return res.status(200).json({
      message: "Calculation applied and data updated successfully.",
      data: updatedData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
const getAllByCategory = async (req, res) => {
  try {
    const { category, estimatorId } = req.params;
    const validCategories = ["Material", "Labor", "Equipment", "OtherCost"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid category provided." });
    }

    // جلب البيانات الأساسية
    const materials = await Material.find({
      category,
      userId: req.user._id,
      estimatorId,
    })
      .populate("projectName", "projectName")
      .populate("contract", "code name")
      .populate("boqLineItem", "workItemName")
      .populate("estimatorId", "name");

    // التحقق من materialName
    const updatedMaterials = await Promise.all(
      materials.map(async (material) => {
        if (mongoose.Types.ObjectId.isValid(material.materialName)) {
          // إذا كانت materialName عبارة عن ObjectId، قم بعمل populate
          const populatedMaterial = await Material.findById(
            material._id
          ).populate("materialName", "name");
          return populatedMaterial;
        }
        // إذا لم تكن ObjectId، أعد المادة كما هي
        return material;
      })
    );

    res.status(200).json({ data: updatedMaterials });
  } catch (error) {
    console.error("Error fetching materials by category:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch materials by category.", error });
  }
};
// const insertMaterial = async (req, res) => {
//   const { estimatorId } = req.params;
//   const { category, applyOn } = req.body;
//   const { _id: userId } = req.user;

//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No file found" });
//     }

//     const filePath = path.join(__dirname, "../excelFiles", req.file.filename);

//     const excelData = excelToJson({
//       sourceFile: filePath,
//       header: { rows: 1 },
//       columnToKey: {
//         A: "materialName",
//         B: "unitOfMeasure",
//         C: "quantity",
//         D: "cost",
//       },
//     });

//     const sheetName = Object.keys(excelData)[0];
//     const sheetData = excelData[sheetName];
//     if (!sheetData || sheetData.length === 0) {
//       return res.status(400).json({ message: "No data found in the Excel file" });
//     }

//     const estimator = await estimatorModel.findById(estimatorId);
//     if (!estimator) {
//       return res.status(404).json({ message: "Estimator not found" });
//     }

//     const existingMaterial = await Material.findOne({ category, estimatorId });
//     const includeTax = existingMaterial?.includeTax === true;
//     const showSales = existingMaterial?.showSales === true;

//     const materialPromises = sheetData.map(async (row) => {
//       const product = await ProductModel.findOne({ name: row["materialName"] });
//       if (!product) {
//         throw new Error(`Product not found for name: ${row["materialName"]}`);
//       }

//       const total = (row["quantity"] || 0) * (row["cost"] || 0);

//       const materialDetails = {
//         applyOn,
//         category,
//         materialName: category == "Material" ? product._id : row["materialName"],
//         unitOfMeasure: row["unitOfMeasure"],
//         quantity: row["quantity"],
//         cost: row["cost"],
//         total,
//         includeTax,
//         showSales,
//       };

//       const newMaterial = new Material({
//         userId,
//         estimatorId,
//         ...materialDetails,
//       });

//       return newMaterial.save();
//     });

//     await Promise.all(materialPromises);

//     fs.unlink(filePath, (err) => {
//       if (err) console.error("Error deleting file:", err);
//     });

//     res.status(201).json({ message: "Materials inserted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
const insertMaterial = async (req, res) => {
  const { estimatorId } = req.params;
  const { category, applyOn } = req.body;
  const { _id: userId } = req.user;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file found" });
    }

    const filePath = path.join(__dirname, "../excelFiles", req.file.filename);

    const excelData = excelToJson({
      sourceFile: filePath,
      header: { rows: 1 },
      columnToKey: {
        A: "materialName",
        B: "unitOfMeasure",
        C: "quantity",
        D: "cost",
      },
    });

    const sheetName = Object.keys(excelData)[0];
    const sheetData = excelData[sheetName];
    if (!sheetData || sheetData.length === 0) {
      return res
        .status(400)
        .json({ message: "No data found in the Excel file" });
    }

    const estimator = await estimatorModel.findById(estimatorId);
    if (!estimator) {
      return res.status(404).json({ message: "Estimator not found" });
    }

    const existingMaterial = await Material.findOne({ category, estimatorId });
    const includeTax = existingMaterial?.includeTax === true;
    const showSales = existingMaterial?.showSales === true;

    const materialPromises = sheetData.map(async (row) => {
      let productId = row["materialName"];
      if (category === "Material") {
        const product = await ProductModel.findOne({
          name: row["materialName"],
        });
        if (!product) {
          throw new Error(`Product not found for name: ${row["materialName"]}`);
        }
        productId = product._id;
      }

      const total = (row["quantity"] || 0) * (row["cost"] || 0);

      const materialDetails = {
        applyOn,
        category,
        materialName: productId,
        unitOfMeasure: row["unitOfMeasure"],
        quantity: row["quantity"],
        cost: row["cost"],
        total,
        includeTax,
        showSales,
      };

      const newMaterial = new Material({
        userId,
        estimatorId,
        ...materialDetails,
      });

      return newMaterial.save();
    });

    await Promise.all(materialPromises);

    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    res.status(201).json({ message: "Materials inserted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllByCategoryNames = async (req, res) => {
  try {
    const { category, estimatorId } = req.params;
    const materials = await Material.find({
      category,
      estimatorId,
      userId: req.user._id,
    }).select("materialName");

    res.status(200).json({ data: materials });
  } catch (error) {
    console.error("Error fetching materials by category:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch materials by category.", error });
  }
};
module.exports = {
  addMaterial,
  getAllMaterials,
  getSingleMaterial,
  deleteMaterial,
  calculateSalesAndTax,
  getAllByCategory,
  insertMaterial,
  getAllByCategoryNames,
};

const Contract = require("../models/contractModel");
const workConfirmationModel = require("../models/workConfirmationModel");
const WorkConfirmation = require("../models/workConfirmationModel");
const workItemModel = require("../models/workItemModel");

const getWorkItemsForSpecificContract = async (contractId) => {
  const contract = await Contract.findById(contractId).populate({
    path: "mainId",
    populate: {
      path: "subItems",
    },
  });
  if (!contract) {
    return [];
  }
  let workItemss = [];
  contract.mainId.map((item) => {
    item.subItems.map((sub) => {
      sub.workItems.map(async (workId) => {
        workItemss.push({ workItemId: workId });
      });
    });
  });
  // const workItemsss = await workItemModel.find({ _id: { $in: workItemss } });
  return workItemss;
};
const createWorkConfirmation = async (req, res) => {
  const userId = req.user._id;
  try {
    const {
      withContract,
      contractId,
      contractType,
      startDate,
      endDate,
      workConfirmationType,
      completionPercentage,
      activateInvoicingByPercentage,
      status,
      projectName,
      partner,
      typeOfProgress,
    } = req.body;
    const lastWorkConfirmationCount = await WorkConfirmation.find({
      contractId,
    }).countDocuments();

    const workItemsForContract = await getWorkItemsForSpecificContract(
      contractId
    );

    if (lastWorkConfirmationCount > 0) {
      const lastWorkConfirmation = await WorkConfirmation.findOne({
        contractId,
      })
        .sort({ createdAt: -1 })
        .lean();
      workItemsForContract.forEach((item) => {
        const matchingItem = lastWorkConfirmation.workItems.find(
          (lastItem) => String(lastItem.workItemId) === String(item.workItemId)
        );
        if (matchingItem) {
          item.previousQuantity = matchingItem.totalQuantity;
        }
      });
    }
    const newWorkConfirmation = new WorkConfirmation({
      contractId,
      numberWithSpecificContract: lastWorkConfirmationCount + 1,
      userId,
      withContract,
      contractType,
      startDate,
      endDate,
      workConfirmationType,
      completionPercentage,
      activateInvoicingByPercentage,
      status,
      projectName,
      partner,
      typeOfProgress,
      workItems: workItemsForContract,
    });

    await newWorkConfirmation.save();
    res.status(201).json({ data: newWorkConfirmation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllWorkConfirmation = async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  try {
    const workConfirmations = await WorkConfirmation.find({ userId })
      .populate({
        path: "contractId",
        select: "code",
      })
      .populate("projectName", "projectName")
      .populate("partner", " partnerName ")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
    const sortedWorkConfirmations = workConfirmations.sort((a, b) => {
      const codeA = a.contractId?.code || "";
      const codeB = b.contractId?.code || "";
      return codeA.localeCompare(codeB);
    });
    const totalWorkConfirmations = await WorkConfirmation.countDocuments({
      userId,
    });
    const totalPages = Math.ceil(totalWorkConfirmations / limit);
    res.status(200).json({
      totalWorkConfirmations,
      totalPages,
      currentPage: page,
      data: sortedWorkConfirmations,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching work confirmations", error });
  }
};

const getSingleWorkConfirmation = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  try {
    const workConfirmation = await WorkConfirmation.findOne({
      _id: id,
      userId,
    })
      .populate({
        path: "contractId",
        select: "code totalContractValue",
      })
      .populate({
        path: "workItems",
        populate: {
          path: "workItemId",
          select: "workDetails workItemName _id",
        },
      })
      .populate("projectName", "projectName")
      .populate("partner", "partnerName ");
    if (!workConfirmation) {
      return res
        .status(404)
        .json({ message: "Work confirmation not found or access denied" });
    }

    const totalItems = workConfirmation.workItems.length;
    const workItems = workConfirmation.workItems
      .map((item) => {
        const { workItemId } = item;

        if (!workItemId || !workItemId.workDetails) {
          return null;
        }
        const { workDetails } = workItemId;
        const {
          remainingQuantity,
          previousQuantity,
          financialCategory,
          total,
          ...filteredWorkDetails
        } = workDetails;

        return {
          ...item.toObject(),
          workItemId: {
            ...workItemId.toObject(),
            workDetails: filteredWorkDetails,
          },
        };
      })
      .filter(Boolean);
    const paginatedWorkItems = workItems.slice(skip, skip + limit);

    res.status(200).json({
      data: {
        ...workConfirmation.toObject(),
        workItems: paginatedWorkItems,
      },
      pagination: {
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        limit,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching the work confirmation", error });
  }
};

const deleteWorkConfirmation = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const workConfirmation = await WorkConfirmation.findOne({
      _id: id,
      userId,
    });

    if (!workConfirmation) {
      return res
        .status(404)
        .json({ message: "Work confirmation not found or access denied" });
    }
    await WorkConfirmation.deleteOne({ _id: id });

    res.status(200).json({ message: "Work confirmation deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting the work confirmation", error });
  }
};

const updateWorkConfirmation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      startDate,
      endDate,
      typeOfProgress,
      workConfirmationType,
      activateInvoicingByPercentage,
      completionPercentage,
    } = req.body;
    const userId = req.user._id;

    const workConfirmation = await WorkConfirmation.findById(id);
    if (!workConfirmation) {
      return res.status(404).json({ message: "WorkConfirmation not found!" });
    }

    if (String(workConfirmation.userId) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this WorkConfirmation!" });
    }

    const updatedWorkConfirmation = await WorkConfirmation.findByIdAndUpdate(
      id,
      {
        startDate,
        endDate,
        typeOfProgress,
        workConfirmationType,
        activateInvoicingByPercentage,
        completionPercentage,
      },
      { new: true }
    );

    res.status(200).json({
      message: "WorkConfirmation updated successfully!",
      data: updatedWorkConfirmation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating WorkConfirmation",
      error: error.message,
    });
  }
};

const updateWorkConfirmationBaseOnWorkItem = async (req, res) => {
  try {
    const { id, workConfirmationId } = req.params; // id: workItemId
    const { currentQuantity, invoicing, completion } = req.body;

    // Find the specific Work Item
    const existingWorkItem = await workItemModel.findById(id);
    if (!existingWorkItem) {
      return res.status(404).json({ message: "Work Item not found!" });
    }

    // Find the current Work Confirmation document
    const existingWorkConfirmation = await WorkConfirmation.findById(
      workConfirmationId
    );
    if (!existingWorkConfirmation) {
      return res.status(404).json({ message: "Work Confirmation not found!" });
    }

    // Locate the specific work item within the workItems array
    const workItemIndex = existingWorkConfirmation.workItems.findIndex(
      (item) => item.workItemId.toString() === id
    );

    if (workItemIndex === -1) {
      return res.status(404).json({
        message: "Work Item not associated with this Work Confirmation!",
      });
    }

    const currentWorkItem = existingWorkConfirmation.workItems[workItemIndex];

    // Check if already calculated
    if (currentWorkItem.isCalculated) {
      return res.status(400).json({
        message: "Work Item has already been calculated before!",
      });
    }

    // Calculate updated quantities
    const updatedTotalQuantity =
      currentWorkItem.previousQuantity + currentQuantity;

    if (updatedTotalQuantity > existingWorkItem.workDetails.assignedQuantity) {
      return res.status(400).json({
        message: `The total quantity (${updatedTotalQuantity}) exceeds the assigned contract quantity (${existingWorkItem.workDetails.assignedQuantity}).`,
      });
    }

    // Calculate total amount and net amount
    const totalAmount =
      updatedTotalQuantity * existingWorkItem.workDetails.price;
    const calculatedNetAmount =
      (invoicing / 100) * (completion / 100) * totalAmount;

    // Fetch the previous Work Confirmation to calculate due amount
    const previousWorkConfirmation = await WorkConfirmation.findOne({
      contractId: existingWorkConfirmation.contractId,
      numberWithSpecificContract:
        existingWorkConfirmation.numberWithSpecificContract - 1,
    });
    const nextWorkConfirmation = await WorkConfirmation.findOne({
      contractId: existingWorkConfirmation.contractId,
      numberWithSpecificContract:
        existingWorkConfirmation.numberWithSpecificContract + 1,
    });
    let previousNetAmount = 0;
    if (previousWorkConfirmation) {
      const previousWorkItemIndex =
        previousWorkConfirmation.workItems.findIndex(
          (item) => item.workItemId.toString() === id
        );

      if (previousWorkItemIndex !== -1) {
        previousNetAmount =
          previousWorkConfirmation.workItems[previousWorkItemIndex].netAmount ||
          0;
      }
    }
    if (nextWorkConfirmation) {
      const nextWorkItemIndex = nextWorkConfirmation.workItems.findIndex(
        (item) => item.workItemId.toString() === id
      );

      if (nextWorkItemIndex !== -1) {
        // Update the previousQuantity of the next Work Item
        nextWorkConfirmation.workItems[nextWorkItemIndex].previousQuantity =
          updatedTotalQuantity;

        // Save the updated next Work Confirmation
        await nextWorkConfirmation.save();
      }
    }
    const calculatedDueAmount = calculatedNetAmount - previousNetAmount;

    // Update the work item in the current Work Confirmation
    existingWorkConfirmation.workItems[workItemIndex].currentQuantity =
      currentQuantity;
    existingWorkConfirmation.workItems[workItemIndex].totalQuantity =
      updatedTotalQuantity;
    existingWorkConfirmation.workItems[workItemIndex].totalAmount = totalAmount;
    existingWorkConfirmation.workItems[workItemIndex].netAmount =
      calculatedNetAmount;
    existingWorkConfirmation.workItems[workItemIndex].dueAmount =
      calculatedDueAmount;
    existingWorkConfirmation.workItems[workItemIndex].isCalculated = true;
    existingWorkConfirmation.totalAmount += totalAmount;
    existingWorkConfirmation.dueAmount += calculatedDueAmount;
    // Save the updated Work Confirmation
    await existingWorkConfirmation.save();

    res.status(200).json({
      message: "Work Confirmation updated successfully!",
      data: existingWorkConfirmation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating Work Confirmation",
      error: error.message,
    });
  }
};

const searchByWorkItemName = async (req, res) => {
  try {
    const { workConfirmationId } = req.params;
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized. Please log in to perform this action.",
      });
    }

    const userId = req.user._id;
    const { workItemName, page = 1, limit = 10 } = req.query;

    if (!workItemName) {
      return res
        .status(400)
        .json({ message: "Please provide a workItemName to search for." });
    }

    const skip = (page - 1) * limit;
    const workConfirmation = await WorkConfirmation.findOne({
      userId: userId,
      _id: workConfirmationId,
    })
      .populate("contractId", "code")
      .populate("projectName", "projectName")
      .populate("partner", "partnerName")
      .populate({
        path: "workItems.workItemId",
        match: { workItemName: { $regex: workItemName, $options: "i" } },
        select: "workItemName workDetails",
      });

    if (!workConfirmation) {
      return res.status(404).json({
        message:
          "No work confirmation found containing the specified work item.",
      });
    }

    const totalItems = workConfirmation.workItems.length;

    const workItems = workConfirmation.workItems
      .filter((item) => item.workItemId)
      .map((item) => {
        const { workItemId } = item;

        if (!workItemId || !workItemId.workDetails) {
          return null;
        }

        const { workDetails } = workItemId;
        const {
          remainingQuantity,
          previousQuantity,
          financialCategory,
          total,
          ...filteredWorkDetails
        } = workDetails;

        return {
          ...item.toObject(),
          workItemId: {
            ...workItemId.toObject(),
            workDetails: filteredWorkDetails,
          },
        };
      })
      .filter(Boolean);

    const paginatedWorkItems = workItems.slice(skip, skip + limit);

    res.status(200).json({
      data: {
        ...workConfirmation.toObject(),
        workItems: paginatedWorkItems,
      },
      pagination: {
        totalItems,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error searching work confirmations:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while searching.", error });
  }
};

const searchWorkConfirmation = async (req, res) => {
  try {
    const { projectName, partnerName, status, contractId } = req.query;
    const userId = req.user._id;

    const pipeline = [
      {
        $lookup: {
          from: "projects",
          localField: "projectName",
          foreignField: "_id",
          as: "projectName",
        },
      },
      {
        $lookup: {
          from: "partners",
          localField: "partner",
          foreignField: "_id",
          as: "partner",
        },
      },
      {
        $lookup: {
          from: "contracts",
          localField: "contractId",
          foreignField: "_id",
          as: "contractId",
        },
      },
      {
        $unwind: {
          path: "$contractId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$projectName",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$partner",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          partner: {
            _id: 1,
            partnerName: 1,
          },
          projectName: {
            _id: 1,
            projectName: 1,
          },
          withContract: 1,
          numberWithSpecificContract: 1,
          contractId: {
            _id: 1,
            code: 1,
          },
          userId: 1,
          contractType: 1,
          startDate: 1,
          endDate: 1,
          workConfirmationType: 1,
          typeOfProgress: 1,
          status: 1,
          activateInvoicingByPercentage: 1,
          completionPercentage: 1,
          workItems: 1,
          totalAmount: 1,
          dueAmount: 1,
          totalDeduction: 1,
          totalAddition: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    const orConditions = [{ userId: userId }];

    if (projectName) {
      orConditions.push({
        "projectName.projectName": { $regex: projectName, $options: "i" },
      });
    }

    if (partnerName) {
      orConditions.push({
        "partner.partnerName": { $regex: partnerName, $options: "i" },
      });
    }

    if (contractId) {
      orConditions.push({
        "contractId.code": { $regex: contractId, $options: "i" },
      });
    }

    if (status) {
      orConditions.push({
        status: { $regex: status, $options: "i" },
      });
    }
    if (orConditions.length > 0) {
      pipeline.push({
        $match: {
          $or: orConditions,
        },
      });
    }

    const results = await WorkConfirmation.aggregate(pipeline);

    res.status(200).json({ data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// const searchWorkConfirmation = async (req, res) => {
//   try {
//     const { projectName, partnerName, status, contractId } = req.query;
//     const userId = req.user._id;  // الحصول على الـ userId من الـ req.user

//     const pipeline = [
//       {
//         $lookup: {
//           from: "projects",
//           localField: "projectName",
//           foreignField: "_id",
//           as: "projectName",
//         },
//       },
//       {
//         $lookup: {
//           from: "partners",
//           localField: "partner",
//           foreignField: "_id",
//           as: "partner",
//         },
//       },
//       {
//         $lookup: {
//           from: "contracts",
//           localField: "contractId",
//           foreignField: "_id",
//           as: "contractId",
//         },
//       },
//       {
//         $unwind: {
//           path: "$contractId",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $unwind: {
//           path: "$projectName",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $unwind: {
//           path: "$partner",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $project: {
//           partner: {
//             _id: 1,
//             partnerName: 1,
//           },
//           projectName: {
//             _id: 1,
//             projectName: 1,
//           },
//           withContract: 1,
//           numberWithSpecificContract: 1,
//           contractId: {
//             _id: 1,
//             code: 1,
//           },
//           userId: 1,
//           contractType: 1,
//           startDate: 1,
//           endDate: 1,
//           workConfirmationType: 1,
//           typeOfProgress: 1,
//           status: 1,
//           activateInvoicingByPercentage: 1,
//           completionPercentage: 1,
//           workItems: 1,
//           totalAmount: 1,
//           dueAmount: 1,
//           totalDeduction: 1,
//           totalAddition: 1,
//           createdAt: 1,
//           updatedAt: 1,
//         },
//       },
//     ];

//     const matchConditions = {
//       userId: userId,
//     };

//     if (projectName) {
//       matchConditions["projectName.projectName"] = { $regex: projectName, $options: "i" };
//     }

//     if (partnerName) {
//       matchConditions["partner.partnerName"] = { $regex: partnerName, $options: "i" };
//     }

//     if (contractId) {
//       matchConditions["contractId.code"] = { $regex: contractId, $options: "i" };
//     }

//     if (status) {
//       matchConditions["status"] = { $regex: status, $options: "i" };
//     }

//     pipeline.push({
//       $match: matchConditions,
//     });

//     const results = await WorkConfirmation.aggregate(pipeline);

//     res.status(200).json({ data: results });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

module.exports = {
  createWorkConfirmation,
  getAllWorkConfirmation,
  getSingleWorkConfirmation,
  deleteWorkConfirmation,
  updateWorkConfirmation,
  updateWorkConfirmationBaseOnWorkItem,
  searchByWorkItemName,
  searchWorkConfirmation,
};

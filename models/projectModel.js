const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  clientName: { type: String, required: true },
  projectLocation: { type: String, required: true },
  projectManger: { type: String, required: true },
  teamMember: [{ type: String, required: true }],
  description: { type: String },
  scopeOfWork: { type: String },
  budget: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  documents: [{ type: String }],
  mitigationStrategies: { type: String },
  impact: { type: String },
  potential: { type: String },
  taskTitleOne: { type: String },
  taskStartDate: { type: Date },
  taskEndDate: { type: Date },
  status: {
    type: String,
    required: true,
    enum: ["Completed", "Planning", "in Progress"],
    default: "in Progress",
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  contracts: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Contract"},
  ],
});

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;

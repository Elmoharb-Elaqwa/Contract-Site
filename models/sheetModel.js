
const mongoose = require("mongoose");
const workItemSchema = new mongoose.Schema({
  unitOfMeasure: String,
  assignedQuantity: {type:Number,default:0},
  previousQuantity: Number,
  remainingQuantity: Number,
  financialCategory: String,
  price: {type:Number,default:0},
  total: Number
});

workItemSchema.pre('save', function (next) {
  if (this.assignedQuantity && this.price) {
    this.total = this.assignedQuantity * this.price;
  } else {
    this.total = 0; 
  }
  next();
});

module.exports = mongoose.model("Sheet", workItemSchema);

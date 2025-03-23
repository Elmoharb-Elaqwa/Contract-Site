const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    name: {
        type: String,
        requried: [true, "Name is required"]
    },
    slug: {
        type: String,
        required: [true, "Slug is required"],
        unique: true
    },
}, { timestamps: true })

const CategoryModel = mongoose.model("Category", categorySchema)
module.exports = CategoryModel
const express = require("express");
const connectDB = require("./lib/db");
const dotenv = require("dotenv").config();
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const partnerRoutes = require("./routes/partnerRoutes");
const contractRoutes = require("./routes/contractRoutes");
const mainRoutes = require("./routes/mainItemRoutes");
const subRoutes = require("./routes/subItemRoutes");
const workRoutes = require("./routes/workItemRoutes");
const deductionRoutes = require("./routes/deductionRoutes");
const additionRoutes = require("./routes/additionRoutes");
const additionWorkConfirmationRoutes = require("./routes/additionWorkConfirmation");
const deductionWorkConfirmationRoutes = require("./routes/deductionWorkConfirmation");
const workConfirmationRoutes = require("./routes/workConfirmationRoutes");
const templateRoutes = require("./routes/templateRoutes");
const estimatorTemplateRoutes = require("./routes/estimatorTemplateRoutes");
const estimatorRoutes = require("./routes/estimatorRoutes");
const materialRoutes = require("./routes/materialRoutes");
const categoriesRoutes = require("./routes/categoriesRoute");
const productsRoutes = require("./routes/productRoute");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5001;
connectDB();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "https://whale-app-bpeim.ondigitalocean.app",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/auth", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/partners", partnerRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/main", mainRoutes);
app.use("/api/sub", subRoutes);
app.use("/api/work", workRoutes);
app.use("/api/deduction", deductionRoutes);
app.use("/api/addition", additionRoutes);
app.use("/api/additionWorkConfirmation", additionWorkConfirmationRoutes);
app.use("/api/deductionWorkConfirmation", deductionWorkConfirmationRoutes);
app.use("/api/workConfirmation", workConfirmationRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/estimatorTemplates", estimatorTemplateRoutes);
app.use("/api/estimators", estimatorRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/products", productsRoutes);
//statics
app.use("/excelFiles", express.static("excelFiles"));
app.use("/projectImages", express.static("projectImages"));
app.use("/partnerImages", express.static("partnerImages"));
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});

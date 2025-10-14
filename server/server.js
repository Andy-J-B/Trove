import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";

import categoryRoutes from "./routes/categories.js";
import productRoutes from "./routes/products.js";
import extractRoutes from "./routes/extract.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

// ✅ Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "TikTok Product Extractor API is running",
  });
});

// ✅ Register routes
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/extract", extractRoutes);

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

// ✅ Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/health`);
});

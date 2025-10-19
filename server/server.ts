import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";

// Import routers (TypeScript files, not JS)
import healthRouter from "./src/api/health";
import queueRouter from "./src/api/queue";
import categoriesRouter from "./src/api/categories";
import productsRouter from "./src/api/products";
import queueStatusRouter from "./src/api/health.js";
import shoppingRouter from "./src/api/shopping.js";

import { startQueueProcessor } from "./src/jobs/queueProcessor.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT);

// ✅ Middleware
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(helmet());
app.use(morgan("dev") as RequestHandler);

// ✅ Basic health check route
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "OK",
    message: "TikTok Product Extractor API is running",
  });
});

// ✅ Routers
app.use("/health", healthRouter);
app.use("/api/queue", queueRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/status", queueStatusRouter); // curl -X GET "http://localhost:3000/api/status/queue-status"
app.use("/api/shopping", shoppingRouter);

// ✅ Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction): void => {
  console.error("🔥 Unhandled error:", err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

// ✅ Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
  startQueueProcessor();
});

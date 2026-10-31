import express from "express";
import cors from "cors";
import quotationTemplateRoutes from "./modules/quotationTemplates/routes/quotationTemplateRoutes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Brightloop SMS API is running",
    module: "M5 - Quotation Template Management",
    environment: process.env.NODE_ENV || "development"
  });
});

// Quotation Template Routes
app.use("/api/quotation-templates", quotationTemplateRoutes);

// 404 & Centralized Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

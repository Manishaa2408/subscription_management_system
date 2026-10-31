import express from "express";
import cors from "cors";
import quotationTemplateRoutes from "./modules/quotationTemplates/routes/quotationTemplateRoutes.js";
import quotationRoutes from "./modules/quotations/routes/quotationRoutes.js";
import subscriptionRoutes from "./modules/subscriptions/routes/subscriptionRoutes.js";
import discountCampaignRoutes from "./modules/discounts/routes/discountCampaignRoutes.js";
import discountRoutes from "./modules/discounts/routes/discountRoutes.js";
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
    modules: [
      "M5 - Quotation Templates",
      "M6 - Quotation Management",
      "M7 - Subscription Lifecycle",
      "M8 - Discount Management"
    ],
    environment: process.env.NODE_ENV || "development"
  });
});

// Quotation Template Routes (M5)
app.use("/api/quotation-templates", quotationTemplateRoutes);

// Quotation Management Routes (M6)
app.use("/api/quotations", quotationRoutes);

// Subscription Lifecycle Management Routes (M7)
app.use("/api/subscriptions", subscriptionRoutes);

// Discount Management Routes (M8)
app.use("/api/discount-campaigns", discountCampaignRoutes);
app.use("/api/discounts", discountRoutes);

// 404 & Centralized Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

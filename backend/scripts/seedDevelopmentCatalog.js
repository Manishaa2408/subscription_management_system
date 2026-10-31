import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import QuotationTemplate from "../src/modules/quotationTemplates/models/QuotationTemplate.js";
import quotationTemplateService from "../src/modules/quotationTemplates/services/quotationTemplateService.js";

const seedData = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB for seeding...");

    // Remove old test templates
    const deleteResult = await QuotationTemplate.deleteMany({});
    console.log(`Cleaned up ${deleteResult.deletedCount} existing quotation templates.`);

    // Sample 1: Business Starter Package (Mix of Plan and Service Products)
    console.log("Seeding Template 1: Business Starter Package...");
    await quotationTemplateService.createTemplate({
      name: "Business Starter Package",
      code: "QT-001",
      description: "Complete starter package for small businesses and growing teams",
      validityDays: 15,
      status: "active",
      notes: "Recommended for teams up to 10 users transitioning from spreadsheets",
      items: [
        {
          itemType: "plan",
          itemId: "67246830a3f65e2a84b12003", // Starter Business Plan (Monthly)
          quantity: 1,
          unitPrice: 1999,
          taxRate: 18
        },
        {
          itemType: "product",
          itemId: "67246830a3f65e2a84b11001", // Implementation Service
          variantId: "VAR-STD", // Standard Setup
          quantity: 1,
          unitPrice: 3000,
          taxRate: 18
        },
        {
          itemType: "product",
          itemId: "67246830a3f65e2a84b11002", // Training Workshop
          variantId: "VAR-REMOTE",
          quantity: 1,
          unitPrice: 1000,
          taxRate: 18
        },
        {
          itemType: "product",
          itemId: "67246830a3f65e2a84b11003", // Support Add-on
          quantity: 1,
          unitPrice: 500,
          taxRate: 18
        }
      ]
    }, "67246830a3f65e2a84b12345");

    // Sample 2: Enterprise Digital Transformation Suite
    console.log("Seeding Template 2: Enterprise Digital Transformation Suite...");
    await quotationTemplateService.createTemplate({
      name: "Enterprise Digital Transformation Suite",
      code: "QT-002",
      description: "Annual full-scale ERP cloud deployment with high SLA and migration",
      validityDays: 30,
      status: "active",
      notes: "Corporate bundle including multi-company setup and bespoke workflow development",
      items: [
        {
          itemType: "plan",
          itemId: "67246830a3f65e2a84b12001", // Enterprise Cloud Subscription (Yearly)
          quantity: 1,
          unitPrice: 50000,
          taxRate: 18
        },
        {
          itemType: "product",
          itemId: "67246830a3f65e2a84b11001", // Implementation Service
          variantId: "VAR-ENT", // Enterprise Multi-Company Setup (3000 + 2000 = 5000)
          quantity: 1,
          unitPrice: 5000,
          taxRate: 18
        },
        {
          itemType: "product",
          itemId: "67246830a3f65e2a84b11004", // Data Migration
          variantId: "VAR-SQL", // SQL migration (1500 + 1200 = 2700)
          quantity: 1,
          unitPrice: 2700,
          taxRate: 18
        },
        {
          itemType: "product",
          itemId: "67246830a3f65e2a84b11005", // Custom Workflow Module
          quantity: 2,
          unitPrice: 4000,
          taxRate: 18
        }
      ]
    }, "67246830a3f65e2a84b12345");

    // Sample 3: Developer Sandbox & Rapid Prototyping (Weekly billing)
    console.log("Seeding Template 3: Developer Sandbox Rapid Prototyping...");
    await quotationTemplateService.createTemplate({
      name: "Developer Sandbox & Rapid Prototyping",
      code: "QT-003",
      description: "Fast spin-up sandbox for proof-of-concept testing",
      validityDays: 7,
      status: "active",
      notes: "Short-term pilot quotation template",
      items: [
        {
          itemType: "plan",
          itemId: "67246830a3f65e2a84b12004", // Developer Sandbox Tier (Weekly)
          quantity: 4,
          unitPrice: 600,
          taxRate: 18
        },
        {
          itemType: "product",
          itemId: "67246830a3f65e2a84b11003", // Support Add-on
          quantity: 1,
          unitPrice: 500,
          taxRate: 18
        }
      ]
    }, "67246830a3f65e2a84b12345");

    // Sample 4: Legacy Discontinued Package (Inactive)
    console.log("Seeding Template 4: Legacy On-Premises Migration (Inactive)...");
    await quotationTemplateService.createTemplate({
      name: "Legacy On-Premises Migration Archive",
      code: "QT-004",
      description: "Archived package for on-premises migrations - no longer sold",
      validityDays: 10,
      status: "inactive",
      notes: "Deactivated template kept for historical audit trail",
      items: [
        {
          itemType: "product",
          itemId: "67246830a3f65e2a84b11004",
          variantId: "VAR-CSV",
          quantity: 1,
          unitPrice: 1500,
          taxRate: 18
        }
      ]
    }, "67246830a3f65e2a84b12345");

    console.log("Successfully seeded 4 development quotation templates!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedData();

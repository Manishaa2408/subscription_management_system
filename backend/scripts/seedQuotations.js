import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB, { closeDB } from "../src/config/db.js";
import Quotation from "../src/modules/quotations/models/Quotation.js";
import QuotationCounter from "../src/modules/quotations/models/QuotationCounter.js";
import QuotationActivity from "../src/modules/quotations/models/QuotationActivity.js";
import quotationService from "../src/modules/quotations/services/quotationService.js";

const seedQuotations = async () => {
  try {
    console.log("Connecting to MongoDB for M6 Quotation seeding...");
    await connectDB();

    // Clean previous records
    await Quotation.deleteMany({});
    await QuotationCounter.deleteMany({});
    await QuotationActivity.deleteMany({});
    console.log("Cleared previous quotations, counters, and activity trails.");

    const staffUser = { id: "67246830a3f65e2a84b12345", role: "staff" };
    const customerUser = { id: "67246830a3f65e2a84b13004", email: "customer@brightloop.local", role: "customer" };

    // 1. DRAFT QUOTATION
    console.log("Creating Sample 1: Draft Quotation (ABC Technologies)...");
    const draftQuotation = await quotationService.createQuotation({
      customerId: "67246830a3f65e2a84b13001", // ABC Technologies
      currency: "INR",
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      lineItems: [
        {
          productId: "67246830a3f65e2a84b11001",
          variantId: "VAR-STD",
          productSnapshot: { name: "Odoo Implementation Service" },
          variantSnapshot: { variantId: "VAR-STD", name: "Standard Setup" },
          description: "Full ERP onboarding and database migration",
          quantity: 1,
          unitPrice: 3000,
          taxRate: 18,
          billingFrequency: "one_time"
        },
        {
          planId: "67246830a3f65e2a84b12003",
          planSnapshot: { name: "Starter Business Plan (Monthly)", price: 1999 },
          description: "Monthly SaaS user subscription",
          quantity: 3,
          unitPrice: 1999,
          taxRate: 18,
          billingFrequency: "monthly"
        }
      ],
      customerNotes: "Please review the proposed implementation plan and subscription details.",
      internalNotes: "Customer requested 3 monthly user licenses."
    }, staffUser);

    // 2. SENT QUOTATION (with discount WELCOME10)
    console.log("Creating Sample 2: Sent Quotation (BlueSky Digital Media / Test Customer)...");
    const sentQuotation = await quotationService.createQuotation({
      customerId: "67246830a3f65e2a84b13004", // Matches default test customer email!
      currency: "INR",
      discountCode: "WELCOME10",
      validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      lineItems: [
        {
          planId: "67246830a3f65e2a84b12002",
          planSnapshot: { name: "Enterprise Cloud Subscription (Monthly)", price: 5000 },
          description: "Monthly enterprise software tier with high availability",
          quantity: 2,
          unitPrice: 5000,
          taxRate: 18,
          billingFrequency: "monthly"
        },
        {
          productId: "67246830a3f65e2a84b11003",
          productSnapshot: { name: "Dedicated SLA Support Add-on" },
          description: "24/7 Priority support coverage",
          quantity: 1,
          unitPrice: 500,
          taxRate: 18,
          billingFrequency: "monthly"
        }
      ],
      customerNotes: "Includes 10% Welcome Discount voucher. Awaiting your approval.",
      internalNotes: "High-value digital marketing agency account."
    }, staffUser);

    // Send it
    await quotationService.sendQuotation(sentQuotation._id, staffUser);

    // 3. ACCEPTED QUOTATION (Ready for M7 conversion)
    console.log("Creating Sample 3: Accepted Quotation (Kochi Infotech Solutions)...");
    const acceptedQuotation = await quotationService.createQuotation({
      customerId: "67246830a3f65e2a84b13002",
      currency: "INR",
      discountCode: "STARTUP20",
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lineItems: [
        {
          planId: "67246830a3f65e2a84b12001",
          planSnapshot: { name: "Enterprise Cloud Subscription (Yearly)", price: 50000 },
          description: "Annual Enterprise Cloud Suite with automatic offsite backups",
          quantity: 1,
          unitPrice: 50000,
          taxRate: 18,
          billingFrequency: "yearly"
        }
      ]
    }, staffUser);

    await quotationService.sendQuotation(acceptedQuotation._id, staffUser);
    await quotationService.acceptQuotation(acceptedQuotation._id, {
      id: "67246830a3f65e2a84b13002",
      email: "billing@kochitech.example.com",
      role: "customer"
    });

    // 4. REJECTED QUOTATION
    console.log("Creating Sample 4: Rejected Quotation (Apex Logistics)...");
    const rejectedQuotation = await quotationService.createQuotation({
      customerId: "67246830a3f65e2a84b13003",
      currency: "INR",
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lineItems: [
        {
          productId: "67246830a3f65e2a84b11005",
          productSnapshot: { name: "Custom Workflow Module Development" },
          description: "Bespoke logistics tracking scripts",
          quantity: 1,
          unitPrice: 4000,
          taxRate: 18,
          billingFrequency: "one_time"
        }
      ]
    }, staffUser);

    await quotationService.sendQuotation(rejectedQuotation._id, staffUser);
    await quotationService.rejectQuotation(rejectedQuotation._id, "Budget allocated for Q2 instead of Q1.", {
      id: "67246830a3f65e2a84b13003",
      email: "accounts@apexlogistics.example.com",
      role: "customer"
    });

    // 5. EXPIRED QUOTATION
    console.log("Creating Sample 5: Expired Quotation (Historical Record)...");
    const pastDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000); // 20 days ago
    const pastValidUntil = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

    const expiredQuotation = await quotationService.createQuotation({
      customerId: "67246830a3f65e2a84b13001",
      currency: "INR",
      quotationDate: pastDate,
      validUntil: pastValidUntil,
      lineItems: [
        {
          planId: "67246830a3f65e2a84b12004",
          planSnapshot: { name: "Developer Sandbox Tier (Weekly)", price: 600 },
          description: "7-day pilot evaluation",
          quantity: 1,
          unitPrice: 600,
          taxRate: 18,
          billingFrequency: "weekly"
        }
      ]
    }, staffUser);

    expiredQuotation.status = "expired";
    expiredQuotation.expiredAt = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    await expiredQuotation.save();

    console.log("Successfully seeded 5 diverse quotations covering all lifecycle states!");
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    await closeDB();
    process.exit(1);
  }
};

seedQuotations();

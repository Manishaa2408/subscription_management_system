import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB, { closeDB } from "../src/config/db.js";
import pricingService from "../src/modules/quotationTemplates/services/pricingService.js";
import productCatalogAdapter from "../src/modules/quotationTemplates/adapters/productCatalogAdapter.js";
import planCatalogAdapter from "../src/modules/quotationTemplates/adapters/planCatalogAdapter.js";
import quotationTemplateService from "../src/modules/quotationTemplates/services/quotationTemplateService.js";
import QuotationTemplate from "../src/modules/quotationTemplates/models/QuotationTemplate.js";

const runTests = async () => {
  console.log("==================================================");
  console.log(" Brightloop Software - M5 Quotation Template Tests");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`[PASS] ${title}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title}`);
      failed++;
    }
  };

  try {
    await connectDB();
    await QuotationTemplate.deleteMany({});

    // TEST 1: Pricing Calculations Service
    console.log("\n--- TEST SUITE 1: Pricing Calculations ---");
    const line1 = pricingService.calculateLineItem(2, 1000, 18);
    assert(line1.lineSubtotal === 2000, "Subtotal: 2 * 1000 = 2000");
    assert(line1.taxAmount === 360, "Tax: 2000 * 18% = 360");
    assert(line1.lineTotal === 2360, "Line Total: 2000 + 360 = 2360");

    const line2 = pricingService.calculateLineItem(1, 500, 18);
    assert(line2.lineSubtotal === 500, "Subtotal: 1 * 500 = 500");
    assert(line2.taxAmount === 90, "Tax: 500 * 18% = 90");
    assert(line2.lineTotal === 590, "Line Total: 500 + 90 = 590");

    const templateTotals = pricingService.calculateTemplateTotals([line1, line2]);
    assert(templateTotals.subtotal === 2500, "Template Subtotal: 2000 + 500 = 2500");
    assert(templateTotals.taxTotal === 450, "Template Tax: 360 + 90 = 450");
    assert(templateTotals.grandTotal === 2950, "Template Grand Total: 2500 + 450 = 2950");

    // TEST 2: Product & Variant Catalog Adapter
    console.log("\n--- TEST SUITE 2: Product Catalog & Variant Pricing ---");
    const products = await productCatalogAdapter.getProducts();
    assert(products.length >= 3, `Retrieved ${products.length} products dynamically from adapter`);

    // Implementation service base is 3000, enterprise variant is +2000 -> 5000
    const variantPricing = await productCatalogAdapter.calculateVariantPrice("67246830a3f65e2a84b11001", "VAR-ENT");
    assert(variantPricing.basePrice === 3000, "Base price is 3000");
    assert(variantPricing.additionalPrice === 2000, "Variant additional price is 2000");
    assert(variantPricing.finalUnitPrice === 5000, "Final variant unit price = 3000 + 2000 = 5000");

    // TEST 3: Subscription Plan Catalog Adapter
    console.log("\n--- TEST SUITE 3: Subscription Plan Catalog ---");
    const plans = await planCatalogAdapter.getPlans();
    assert(plans.length >= 4, `Retrieved ${plans.length} subscription plans dynamically from adapter`);

    const yearlyPlan = await planCatalogAdapter.getPlanById("67246830a3f65e2a84b12001");
    assert(yearlyPlan.billingInterval === "yearly", "Verified yearly plan interval");
    assert(yearlyPlan.price === 50000, "Verified yearly plan price of 50000");

    // TEST 4: Template Creation with Mixed Line Items
    console.log("\n--- TEST SUITE 4: Template Creation & Persistence ---");
    const createdTemplate = await quotationTemplateService.createTemplate({
      name: "Enterprise Starter Bundle",
      validityDays: 15,
      description: "Complete ERP software and services package",
      items: [
        {
          itemType: "plan",
          itemId: "67246830a3f65e2a84b12002", // Monthly Enterprise Plan (5000)
          quantity: 1,
          unitPrice: 5000,
          taxRate: 18
        },
        {
          itemType: "product",
          itemId: "67246830a3f65e2a84b11001", // Implementation Service
          variantId: "VAR-STD",
          quantity: 1,
          unitPrice: 3000,
          taxRate: 18
        }
      ]
    }, "67246830a3f65e2a84b12345");

    assert(createdTemplate._id != null, "Template saved to MongoDB with ObjectId");
    assert(createdTemplate.code === "QT-001", `Auto-generated sequential code: ${createdTemplate.code}`);
    assert(createdTemplate.subtotal === 8000, "Persisted Subtotal: 5000 + 3000 = 8000");
    assert(createdTemplate.taxTotal === 1440, "Persisted Tax Total: 18% of 8000 = 1440");
    assert(createdTemplate.grandTotal === 9440, "Persisted Grand Total: 8000 + 1440 = 9440");
    assert(createdTemplate.items.length === 2, "Persisted both Product and Plan line items");

    // TEST 5: Querying, Searching & Filtering
    console.log("\n--- TEST SUITE 5: Querying, Searching & Filtering ---");
    const adminListing = await quotationTemplateService.getAllTemplates({}, "admin");
    assert(adminListing.templates.length === 1, "Admin retrieved 1 template");

    const searchResult = await quotationTemplateService.getAllTemplates({ search: "Enterprise" }, "admin");
    assert(searchResult.templates.length === 1, "Search by keyword 'Enterprise' matched");

    const noMatch = await quotationTemplateService.getAllTemplates({ search: "NonExistentName" }, "admin");
    assert(noMatch.templates.length === 0, "Non-matching search returned 0 items");

    // TEST 6: Status Management & Staff Visibility
    console.log("\n--- TEST SUITE 6: Status Management & Role Views ---");
    await quotationTemplateService.updateTemplateStatus(createdTemplate._id, "inactive");
    const updated = await quotationTemplateService.getTemplateById(createdTemplate._id, "admin");
    assert(updated.status === "inactive", "Admin successfully set status to inactive");

    // Staff only sees active templates
    const staffListing = await quotationTemplateService.getAllTemplates({}, "staff");
    assert(staffListing.templates.length === 0, "Staff does not see inactive templates in listing");

    // Reactivate for further tests
    await quotationTemplateService.updateTemplateStatus(createdTemplate._id, "active");

    // TEST 7: Template Preview & M6 Contract
    console.log("\n--- TEST SUITE 7: Preview & M6 Contract Consumption ---");
    const preview = await quotationTemplateService.getTemplatePreview(createdTemplate._id, "admin");
    assert(preview.company === "Brightloop Software", "Preview contains Brightloop Software branding");
    assert(preview.grandTotal === 9440, "Preview matches calculated grand total");

    const m6Data = await quotationTemplateService.getTemplateForQuotation(createdTemplate._id);
    assert(m6Data.templateId.toString() === createdTemplate._id.toString(), "M6 Contract exports valid templateId");
    assert(m6Data.validityDays === 15, "M6 Contract exports validityDays for quotation expiry calculation");
    assert(m6Data.items.length === 2, "M6 Contract exports all items with price snapshot");

    // TEST 8: Soft Delete
    console.log("\n--- TEST SUITE 8: Soft Deletion ---");
    const deleteResult = await quotationTemplateService.softDeleteTemplate(createdTemplate._id, "67246830a3f65e2a84b12345");
    assert(deleteResult.message.includes("deleted"), "Soft delete executed successfully");

    const activeList = await quotationTemplateService.getAllTemplates({}, "admin");
    assert(activeList.templates.length === 0, "Soft-deleted template excluded from normal listings");

    console.log("\n==================================================");
    console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================\n");

    await closeDB();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution error:", err);
    await closeDB();
    process.exit(1);
  }
};

runTests();

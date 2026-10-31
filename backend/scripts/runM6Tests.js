import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB, { closeDB } from "../src/config/db.js";
import Quotation from "../src/modules/quotations/models/Quotation.js";
import QuotationCounter from "../src/modules/quotations/models/QuotationCounter.js";
import QuotationActivity from "../src/modules/quotations/models/QuotationActivity.js";
import quotationNumberService from "../src/modules/quotations/services/quotationNumberService.js";
import quotationCalculationService from "../src/modules/quotations/services/quotationCalculationService.js";
import quotationService from "../src/modules/quotations/services/quotationService.js";
import quotationConversionService from "../src/modules/quotations/services/quotationConversionService.js";

const runTests = async () => {
  console.log("==================================================");
  console.log(" Brightloop Software - M6 Quotation Tests");
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
    await Quotation.deleteMany({});
    await QuotationCounter.deleteMany({});
    await QuotationActivity.deleteMany({});

    const staffUser = { id: "67246830a3f65e2a84b12345", role: "staff" };
    const customerUser = {
      id: "67246830a3f65e2a84b13001",
      email: "contact@abctech.example.com",
      role: "customer"
    };

    // TEST 1: Concurrency-Safe Quotation Number Generation
    console.log("\n--- TEST 1: Quotation Numbering ---");
    const num1 = await quotationNumberService.generateQuotationNumber();
    const num2 = await quotationNumberService.generateQuotationNumber();
    const year = new Date().getFullYear();
    assert(num1 === `QUO-${year}-0001`, `First quotation number is QUO-${year}-0001`);
    assert(num2 === `QUO-${year}-0002`, `Second quotation number is QUO-${year}-0002`);

    // TEST 2: Calculations with Discounts and Tax Breakdowns
    console.log("\n--- TEST 2: Quotation Calculations ---");
    // Items: 2 x 1000 = 2000
    // Discount: WELCOME10 (10% of 2000 = 200)
    // Taxable: 1800
    // Tax: 18% of 1800 = 324 (CGST 162 + SGST 162)
    // Grand Total: 1800 + 324 = 2124
    const testItems = [{ quantity: 2, unitPrice: 1000, taxRate: 18 }];
    const calc = await quotationCalculationService.calculateQuotationTotals(testItems, "WELCOME10");
    assert(calc.subtotal === 2000, "Subtotal: 2 * 1000 = 2000");
    assert(calc.discountAmount === 200, "Discount: 10% of 2000 = 200");
    assert(calc.taxableAmount === 1800, "Taxable Amount: 2000 - 200 = 1800");
    assert(calc.totalTax === 324, "Total Tax: 18% of 1800 = 324");
    assert(calc.grandTotal === 2124, "Grand Total: 1800 + 324 = 2124");
    assert(calc.taxBreakdown.length === 2, "Tax breakdown contains CGST and SGST");

    // TEST 3: Create Quotation in Draft Status
    console.log("\n--- TEST 3: Create Draft Quotation ---");
    const quotation = await quotationService.createQuotation({
      customerId: "67246830a3f65e2a84b13001",
      currency: "INR",
      discountCode: "WELCOME10",
      validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      lineItems: testItems
    }, staffUser);

    assert(quotation._id != null, "Quotation created with ObjectId");
    assert(quotation.status === "draft", "Initial status is 'draft'");
    assert(quotation.customerSnapshot.name === "ABC Technologies Pvt Ltd", "Customer snapshot captured correctly");
    assert(quotation.grandTotal === 2124, "Saved quotation grand total matches calculated total");

    // TEST 4: Draft Editing & Line Item Operations
    console.log("\n--- TEST 4: Line Item Operations on Draft ---");
    const updatedQuotation = await quotationService.addLineItem(quotation._id, {
      description: "Support Add-on",
      quantity: 1,
      unitPrice: 500,
      taxRate: 18,
      billingFrequency: "monthly"
    }, staffUser);

    assert(updatedQuotation.lineItems.length === 2, "Line item added to draft quotation");
    assert(updatedQuotation.subtotal === 2500, "New subtotal: 2000 + 500 = 2500");

    // TEST 5: Send Quotation (Draft -> Sent)
    console.log("\n--- TEST 5: Send Quotation ---");
    const sentQuotation = await quotationService.sendQuotation(quotation._id, staffUser);
    assert(sentQuotation.status === "sent", "Quotation status transitioned to 'sent'");
    assert(sentQuotation.sentAt != null, "sentAt timestamp recorded");

    // TEST 6: Prevent Editing Sent Quotation
    console.log("\n--- TEST 6: Draft Lock on Sent Quotation ---");
    let editFailed = false;
    try {
      await quotationService.updateQuotation(sentQuotation._id, { internalNotes: "Should fail" }, staffUser);
    } catch (err) {
      editFailed = true;
    }
    assert(editFailed, "Editing a sent quotation was rejected by draft lock");

    // TEST 7: Customer Acceptance (Sent -> Accepted)
    console.log("\n--- TEST 7: Customer Acceptance ---");
    const acceptedQuotation = await quotationService.acceptQuotation(sentQuotation._id, customerUser);
    assert(acceptedQuotation.status === "accepted", "Status transitioned to 'accepted'");
    assert(acceptedQuotation.acceptedAt != null, "acceptedAt timestamp recorded");

    // TEST 8: Conversion to M7 Subscription Contract
    console.log("\n--- TEST 8: Conversion to Subscription Contract ---");
    const conversionResult = await quotationConversionService.convertAcceptedQuotation(acceptedQuotation._id, staffUser);
    assert(conversionResult.success === true, "Accepted quotation converted successfully");
    assert(conversionResult.subscriptionId != null, "Returned valid subscriptionId for M7");

    // Duplicate conversion prevention
    let duplicateRejected = false;
    try {
      await quotationConversionService.convertAcceptedQuotation(acceptedQuotation._id, staffUser);
    } catch (err) {
      duplicateRejected = true;
    }
    assert(duplicateRejected, "Duplicate conversion request was strictly prevented");

    // TEST 9: Expired Quotation Acceptance Prevention
    console.log("\n--- TEST 9: Expired Quotation Protection ---");
    const pastQuotation = await quotationService.createQuotation({
      customerId: "67246830a3f65e2a84b13001",
      validUntil: new Date(Date.now() + 1000), // Very short validity
      lineItems: testItems
    }, staffUser);
    await quotationService.sendQuotation(pastQuotation._id, staffUser);

    // Manually push validUntil into past
    pastQuotation.validUntil = new Date(Date.now() - 5000);
    await pastQuotation.save();

    let acceptExpiredFailed = false;
    try {
      await quotationService.acceptQuotation(pastQuotation._id, customerUser);
    } catch (err) {
      acceptExpiredFailed = true;
    }
    assert(acceptExpiredFailed, "Expired quotation acceptance was rejected");

    // TEST 10: Audit Activity Logging
    console.log("\n--- TEST 10: Activity Trail ---");
    const activities = await quotationService.getQuotationActivity(quotation._id);
    assert(activities.length >= 4, `Quotation has ${activities.length} activity audit log records`);

    console.log("\n==================================================");
    console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================\n");

    await closeDB();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution failed:", err);
    await closeDB();
    process.exit(1);
  }
};

runTests();

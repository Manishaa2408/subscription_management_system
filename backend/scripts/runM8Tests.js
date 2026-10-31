import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB, { closeDB } from "../src/config/db.js";
import DiscountCampaign from "../src/modules/discounts/models/DiscountCampaign.js";
import Discount from "../src/modules/discounts/models/Discount.js";
import DiscountUsage from "../src/modules/discounts/models/DiscountUsage.js";
import DiscountActivity from "../src/modules/discounts/models/DiscountActivity.js";

import discountCampaignService from "../src/modules/discounts/services/discountCampaignService.js";
import discountService from "../src/modules/discounts/services/discountService.js";
import discountCalculationService from "../src/modules/discounts/services/discountCalculationService.js";
import discountValidationService from "../src/modules/discounts/services/discountValidationService.js";
import discountUsageService from "../src/modules/discounts/services/discountUsageService.js";

const runTests = async () => {
  console.log("==================================================");
  console.log(" Brightloop Software - M8 Discount Engine Tests");
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
    await DiscountCampaign.deleteMany({});
    await Discount.deleteMany({});
    await DiscountUsage.deleteMany({});
    await DiscountActivity.deleteMany({});

    const adminUser = { id: "67246830a3f65e2a84b11111", role: "admin" };
    const customer1 = "67246830a3f65e2a84b13001";
    const customer2 = "67246830a3f65e2a84b13002";

    // --- TEST 1: Campaign Creation & Uniqueness ---
    console.log("--- TEST 1: Campaign Management ---");
    const campaign = await discountCampaignService.createCampaign({
      name: "Welcome Festive Season 2026",
      campaignCode: "WELCOME_2026",
      description: "Introductory offers for Brightloop Software SaaS customers"
    }, adminUser);

    assert(campaign.campaignCode === "WELCOME_2026", "Campaign code generated & normalized");

    let duplicateCampaignFailed = false;
    try {
      await discountCampaignService.createCampaign({
        name: "Duplicate Campaign",
        campaignCode: "welcome_2026"
      }, adminUser);
    } catch (err) {
      duplicateCampaignFailed = true;
    }
    assert(duplicateCampaignFailed, "Duplicate campaign code prevented");

    // --- TEST 2: Discount Creation, Normalization & Uniqueness ---
    console.log("\n--- TEST 2: Discount Creation & Code Normalization ---");
    const discountWelcome = await discountService.createDiscount({
      name: "Welcome 20% Offer",
      code: "welcome20", // lowercase passed in
      campaignId: campaign._id,
      discountType: "percentage",
      discountValue: 20,
      maximumDiscount: 500,
      minimumPurchase: 999,
      usageLimits: {
        maximumTotalUsage: 100,
        maximumPerCustomer: 1
      },
      applicationType: "one_time"
    }, adminUser);

    assert(discountWelcome.code === "WELCOME20", "Discount code automatically normalized to uppercase");

    let duplicateDiscountFailed = false;
    try {
      await discountService.createDiscount({
        name: "Welcome Duplicate",
        code: "WELCOME20",
        discountType: "percentage",
        discountValue: 20
      }, adminUser);
    } catch (err) {
      duplicateDiscountFailed = true;
    }
    assert(duplicateDiscountFailed, "Duplicate discount code prevented");

    // --- TEST 3: Percentage Discount Calculation & Max Cap ---
    console.log("\n--- TEST 3: Percentage Calculation & Max Cap ---");
    // Order of 2000 -> 20% = 400 (under 500 cap)
    const calc1 = discountCalculationService.calculateDiscountAmount(discountWelcome, 2000);
    assert(calc1.finalDiscount === 400, "20% on ₹2,000 = ₹400");
    assert(calc1.maximumDiscountApplied === false, "Max cap not triggered when under limit");

    // Order of 5000 -> 20% = 1000, capped at 500
    const calc2 = discountCalculationService.calculateDiscountAmount(discountWelcome, 5000);
    assert(calc2.finalDiscount === 500, "20% on ₹5,000 capped at maximum ₹500");
    assert(calc2.maximumDiscountApplied === true, "Max cap flag correctly reported");

    // --- TEST 4: Fixed Amount Discount Calculation ---
    console.log("\n--- TEST 4: Fixed Discount Calculation ---");
    const discountFixed = await discountService.createDiscount({
      name: "Festive 500 Off",
      code: "FESTIVE500",
      discountType: "fixed",
      discountValue: 500,
      minimumPurchase: 2000
    }, adminUser);

    const calcFixed1 = discountCalculationService.calculateDiscountAmount(discountFixed, 2000);
    assert(calcFixed1.finalDiscount === 500, "Fixed discount of ₹500 applied on ₹2,000");

    // Fixed discount cannot exceed eligible amount
    const calcFixed2 = discountCalculationService.calculateDiscountAmount(discountFixed, 300);
    assert(calcFixed2.finalDiscount === 300, "Fixed discount clamped to eligible amount (cannot exceed order total)");

    // --- TEST 5: Minimum Purchase Requirement ---
    console.log("\n--- TEST 5: Minimum Purchase Requirement ---");
    const valUnderMin = await discountValidationService.validateDiscount("WELCOME20", {
      customerId: customer1,
      subtotal: 500
    });
    assert(valUnderMin.valid === false, "Validation fails when subtotal < minimum purchase");
    assert(valUnderMin.reasonCode === "MINIMUM_PURCHASE_NOT_MET", "Reason code is MINIMUM_PURCHASE_NOT_MET");

    const valOverMin = await discountValidationService.validateDiscount("WELCOME20", {
      customerId: customer1,
      subtotal: 1500
    });
    assert(valOverMin.valid === true, "Validation passes when subtotal >= minimum purchase");
    assert(valOverMin.data.discountAmount === 300, "Calculated discount is ₹300 (20% of 1500)");

    // --- TEST 6: Date Window & Expiry Checks ---
    console.log("\n--- TEST 6: Date Window & Expiry Validation ---");
    // Expired discount
    const expiredDiscount = await discountService.createDiscount({
      name: "Expired Flash Sale",
      code: "EXPIRED50",
      discountType: "percentage",
      discountValue: 50,
      startDate: new Date(Date.now() - 30 * 86400000),
      endDate: new Date(Date.now() - 5 * 86400000)
    }, adminUser);

    const valExpired = await discountValidationService.validateDiscount("EXPIRED50", { subtotal: 2000 });
    assert(valExpired.valid === false, "Expired discount fails validation");
    assert(valExpired.reasonCode === "DISCOUNT_EXPIRED", "Reason code is DISCOUNT_EXPIRED");

    // Future start discount
    const futureDiscount = await discountService.createDiscount({
      name: "New Year 2027",
      code: "NEWYEAR27",
      discountType: "percentage",
      discountValue: 15,
      startDate: new Date(Date.now() + 10 * 86400000),
      endDate: new Date(Date.now() + 40 * 86400000)
    }, adminUser);

    const valFuture = await discountValidationService.validateDiscount("NEWYEAR27", { subtotal: 2000 });
    assert(valFuture.valid === false, "Future start discount fails validation");
    assert(valFuture.reasonCode === "DISCOUNT_NOT_STARTED", "Reason code is DISCOUNT_NOT_STARTED");

    // --- TEST 7: Customer Eligibility Rules ---
    console.log("\n--- TEST 7: Customer Eligibility ---");
    const exclusiveDiscount = await discountService.createDiscount({
      name: "VIP Customer Exclusive",
      code: "VIPONLY",
      discountType: "fixed",
      discountValue: 1000,
      applicability: {
        customerIds: [customer1]
      }
    }, adminUser);

    const valCustomerPass = await discountValidationService.validateDiscount("VIPONLY", {
      customerId: customer1,
      subtotal: 3000
    });
    assert(valCustomerPass.valid === true, "Whitelisted customer validation passes");

    const valCustomerFail = await discountValidationService.validateDiscount("VIPONLY", {
      customerId: customer2,
      subtotal: 3000
    });
    assert(valCustomerFail.valid === false, "Non-whitelisted customer rejected");
    assert(valCustomerFail.reasonCode === "CUSTOMER_NOT_ELIGIBLE", "Reason code is CUSTOMER_NOT_ELIGIBLE");

    // --- TEST 8: Product & Plan Scope Filtering ---
    console.log("\n--- TEST 8: Product & Plan Scope Filtering ---");
    const planSpecificDiscount = await discountService.createDiscount({
      name: "Enterprise Plan Discount",
      code: "ENTERPRISE30",
      discountType: "percentage",
      discountValue: 30,
      applicability: {
        plans: ["67246830a3f65e2a84b12001"] // Enterprise Plan ID
      }
    }, adminUser);

    // Cart with 1 eligible Enterprise Plan (50000) and 1 ineligible Starter Plan (1999)
    const mixedCart = {
      customerId: customer1,
      subtotal: 51999,
      lineItems: [
        { planId: "67246830a3f65e2a84b12001", quantity: 1, unitPrice: 50000 },
        { planId: "67246830a3f65e2a84b12003", quantity: 1, unitPrice: 1999 }
      ]
    };

    const valPlan = await discountValidationService.validateDiscount("ENTERPRISE30", mixedCart);
    assert(valPlan.valid === true, "Validation passes for mixed cart with eligible plan");
    assert(valPlan.data.eligibleAmount === 50000, "Only the eligible plan amount (₹50,000) is counted in eligibleAmount");
    assert(valPlan.data.discountAmount === 15000, "Discount (30% of ₹50,000) = ₹15,000");

    // --- TEST 9: Usage Limits & Reservation Lifecycle ---
    console.log("\n--- TEST 9: Usage Reservation & Redemption ---");
    const limitedDiscount = await discountService.createDiscount({
      name: "Limited Single Use",
      code: "ONEONLY",
      discountType: "fixed",
      discountValue: 200,
      usageLimits: {
        maximumTotalUsage: 1,
        maximumPerCustomer: 1
      }
    }, adminUser);

    // 1. Reserve usage
    const reservation = await discountUsageService.reserveDiscountUsage(limitedDiscount._id, {
      customerId: customer1,
      subtotal: 1000,
      idempotencyKey: "test-order-res-001"
    });
    assert(reservation.usage.status === "reserved", "Discount usage reserved with 'reserved' status");
    assert(reservation.usage.discountAmount === 200, "Reserved discount amount matches");

    // 2. Confirm redemption
    const redemption = await discountUsageService.confirmDiscountRedemption(limitedDiscount._id, {
      reservationId: reservation.usage._id,
      idempotencyKey: "test-order-res-001"
    });
    assert(redemption.usage.status === "redeemed", "Reservation confirmed to 'redeemed'");
    assert(redemption.isDuplicate === false, "First redemption flagged as not duplicate");

    const refreshedDiscount = await Discount.findById(limitedDiscount._id);
    assert(refreshedDiscount.usageCount === 1, "Discount usageCount incremented to 1");

    // 3. Duplicate redemption check (idempotency)
    const duplicateRedemption = await discountUsageService.confirmDiscountRedemption(limitedDiscount._id, {
      reservationId: reservation.usage._id,
      idempotencyKey: "test-order-res-001"
    });
    assert(duplicateRedemption.isDuplicate === true, "Duplicate redemption prevented idempotently");
    const refreshedDiscountAfterDup = await Discount.findById(limitedDiscount._id);
    assert(refreshedDiscountAfterDup.usageCount === 1, "Usage count remains 1 after duplicate redemption retry");

    // 4. Usage limit exhaustion check
    const valLimitExhausted = await discountValidationService.validateDiscount("ONEONLY", {
      customerId: customer2,
      subtotal: 1000
    });
    assert(valLimitExhausted.valid === false, "Validation fails when total usage limit is reached");
    assert(valLimitExhausted.reasonCode === "USAGE_LIMIT_REACHED", "Reason code is USAGE_LIMIT_REACHED");

    // --- TEST 10: Reservation Release ---
    console.log("\n--- TEST 10: Reservation Release ---");
    const releaseableDiscount = await discountService.createDiscount({
      name: "Release Test",
      code: "RELEASE20",
      discountType: "fixed",
      discountValue: 100
    }, adminUser);

    const resForRelease = await discountUsageService.reserveDiscountUsage(releaseableDiscount._id, {
      customerId: customer2,
      subtotal: 500,
      idempotencyKey: "test-release-key"
    });

    const releaseResult = await discountUsageService.releaseDiscountReservation(
      resForRelease.usage._id,
      "Customer abandoned cart"
    );
    assert(releaseResult.usage.status === "released", "Reservation status transitioned to 'released'");
    assert(releaseResult.usage.releaseReason === "Customer abandoned cart", "Release reason recorded");

    // --- TEST 11: Audit Trail ---
    console.log("\n--- TEST 11: Audit Activity Trail ---");
    const activities = await discountUsageService.getDiscountActivityHistory(limitedDiscount._id);
    assert(activities.length >= 3, `Discount has ${activities.length} audit trail records logged`);

    console.log("\n==================================================");
    console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================\n");

    await closeDB();
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("Test execution failed:", error);
    await closeDB();
    process.exit(1);
  }
};

runTests();

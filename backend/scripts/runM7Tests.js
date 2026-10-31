import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB, { closeDB } from "../src/config/db.js";
import Subscription from "../src/modules/subscriptions/models/Subscription.js";
import SubscriptionActivity from "../src/modules/subscriptions/models/SubscriptionActivity.js";
import SubscriptionRenewal from "../src/modules/subscriptions/models/SubscriptionRenewal.js";
import SubscriptionPlanChange from "../src/modules/subscriptions/models/SubscriptionPlanChange.js";
import SubscriptionNumberCounter from "../src/modules/subscriptions/models/SubscriptionNumberCounter.js";
import Quotation from "../src/modules/quotations/models/Quotation.js";
import subscriptionNumberService from "../src/modules/subscriptions/services/subscriptionNumberService.js";
import subscriptionBillingDateService from "../src/modules/subscriptions/services/subscriptionBillingDateService.js";
import subscriptionLifecycleService from "../src/modules/subscriptions/services/subscriptionLifecycleService.js";
import subscriptionService from "../src/modules/subscriptions/services/subscriptionService.js";
import subscriptionConversionService from "../src/modules/subscriptions/services/subscriptionConversionService.js";
import subscriptionRenewalService from "../src/modules/subscriptions/services/subscriptionRenewalService.js";
import subscriptionPlanChangeService from "../src/modules/subscriptions/services/subscriptionPlanChangeService.js";
import subscriptionExpirationService from "../src/modules/subscriptions/services/subscriptionExpirationService.js";

const runTests = async () => {
  console.log("==================================================");
  console.log(" Brightloop Software - M7 Subscription Tests");
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
    await Subscription.deleteMany({});
    await SubscriptionActivity.deleteMany({});
    await SubscriptionRenewal.deleteMany({});
    await SubscriptionPlanChange.deleteMany({});
    await SubscriptionNumberCounter.deleteMany({});

    const staffUser = { id: "67246830a3f65e2a84b12345", role: "staff" };

    // TEST 1: Concurrency-Safe Subscription Numbering
    console.log("\n--- TEST 1: Subscription Numbering ---");
    const num1 = await subscriptionNumberService.generateSubscriptionNumber();
    const num2 = await subscriptionNumberService.generateSubscriptionNumber();
    const year = new Date().getFullYear();
    assert(num1 === `SUB-${year}-0001`, `First number is SUB-${year}-0001`);
    assert(num2 === `SUB-${year}-0002`, `Second number is SUB-${year}-0002`);

    // TEST 2: Billing Date Utility (Frequencies, Month-Ends & Leap Years)
    console.log("\n--- TEST 2: Billing Date Calculations ---");
    // Jan 31 + 1 month should land on Feb 28/29 (last day of Feb)
    const jan31 = new Date("2026-01-31T00:00:00Z");
    const febCycle = subscriptionBillingDateService.calculatePeriodDates(jan31, "monthly", 1, 31);
    assert(febCycle.periodEnd.getUTCMonth() === 1, "Feb period calculated correctly for Jan 31 anchor");

    // Quarterly calculation: Jan 1 + 1 quarter (3 months) -> April 1
    const jan1 = new Date("2026-01-01T00:00:00Z");
    const qCycle = subscriptionBillingDateService.calculatePeriodDates(jan1, "quarterly", 1);
    assert(qCycle.nextBillingDate.getUTCMonth() === 3, "Quarterly cycle advances 3 months to April");

    // TEST 3: Create Subscription from Accepted M6 Quotation
    console.log("\n--- TEST 3: Conversion from Accepted Quotation ---");
    // Create a temporary mock accepted quotation in DB
    const mockQuotation = await Quotation.create({
      quotationNumber: "QUO-2026-9999",
      customerId: "67246830a3f65e2a84b13001",
      customerSnapshot: {
        name: "ABC Technologies Pvt Ltd",
        email: "contact@abctech.example.com",
        companyName: "ABC Technologies Pvt Ltd"
      },
      quotationDate: new Date(),
      validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      currency: "INR",
      status: "accepted",
      acceptedAt: new Date(),
      lineItems: [
        {
          planId: "67246830a3f65e2a84b12002",
          planSnapshot: { name: "Enterprise Cloud Subscription (Monthly)", price: 5000 },
          description: "Enterprise tier",
          quantity: 1,
          unitPrice: 5000,
          taxRate: 18,
          billingFrequency: "monthly",
          billingInterval: 1,
          lineSubtotal: 5000,
          lineTotal: 5900
        }
      ],
      subtotal: 5000,
      taxableAmount: 5000,
      totalTax: 900,
      grandTotal: 5900
    });

    const convResult = await subscriptionConversionService.createSubscriptionFromQuotation(mockQuotation._id, staffUser);
    assert(convResult.isDuplicate === false, "Subscription created from accepted quotation");
    assert(convResult.subscription.status === "active", "Converted subscription initialized to 'active'");
    assert(convResult.subscription.subscriptionNumber != null, "Subscription number assigned");
    assert(convResult.subscription.billingIntegration.status === "registered", "M9 billing schedule registered");

    // Test duplicate conversion prevention
    const duplicateCheck = await subscriptionConversionService.createSubscriptionFromQuotation(mockQuotation._id, staffUser);
    assert(duplicateCheck.isDuplicate === true, "Duplicate quotation conversion prevented (idempotent)");

    // TEST 4: Manual Subscription Creation with Trial
    console.log("\n--- TEST 4: Manual Subscription Creation (Trial) ---");
    const trialSub = await subscriptionService.createManualSubscription({
      customerId: "67246830a3f65e2a84b13002",
      trialEnabled: true,
      trialDays: 14,
      startDate: new Date(),
      lineItems: [
        {
          planId: "67246830a3f65e2a84b12003",
          planSnapshot: { name: "Starter Business Plan (Monthly)", price: 1999 },
          description: "Starter Plan",
          quantity: 1,
          unitPrice: 1999,
          billingFrequency: "monthly",
          billingInterval: 1
        }
      ]
    }, staffUser);

    assert(trialSub.status === "trial", "Trial subscription created in 'trial' status");
    assert(trialSub.trialEndDate != null, "trialEndDate set to 14 days in future");

    // TEST 5: Renewal Workflow & Idempotency
    console.log("\n--- TEST 5: Subscription Renewal ---");
    const activeSub = convResult.subscription;
    const renewalResult = await subscriptionRenewalService.renewSubscription(activeSub, staffUser);
    assert(renewalResult.renewal.renewalNumber === 1, "Renewal cycle #1 recorded");
    assert(renewalResult.subscription.lastRenewalDate != null, "lastRenewalDate updated on subscription");

    // Duplicate renewal check
    let dupRenewalFailed = false;
    try {
      await subscriptionRenewalService.renewSubscription(renewalResult.subscription, staffUser);
    } catch (err) {
      dupRenewalFailed = true;
    }
    assert(dupRenewalFailed, "Duplicate renewal within same period strictly rejected");

    // TEST 6: Upgrade / Downgrade Plan Changes
    console.log("\n--- TEST 6: Plan Changes (Upgrade) ---");
    // Upgrade from monthly (5000) to yearly (50000)
    const planChangeResult = await subscriptionPlanChangeService.changeSubscriptionPlan(
      renewalResult.subscription,
      "67246830a3f65e2a84b12001", // Enterprise Yearly (50000)
      "Customer upgraded to annual license",
      staffUser
    );
    assert(planChangeResult.planChange.changeType === "upgrade", "Detected change type as 'upgrade'");
    assert(planChangeResult.planChange.priceDifference === 45000, "Price difference: 50000 - 5000 = 45000");
    assert(planChangeResult.subscription.totalAmount === 50000, "Subscription totalAmount updated to 50000");

    // TEST 7: Pause & Resume Workflow
    console.log("\n--- TEST 7: Pause & Resume ---");
    const pausedSub = await subscriptionService.pauseSubscription(
      activeSub._id,
      "Temporary project suspension",
      null,
      staffUser
    );
    assert(pausedSub.status === "paused", "Subscription status transitioned to 'paused'");
    assert(pausedSub.pause.pausedAt != null, "pausedAt timestamp recorded");

    const resumedSub = await subscriptionService.resumeSubscription(activeSub._id, staffUser);
    assert(resumedSub.status === "active", "Subscription status transitioned back to 'active'");

    // TEST 8: Cancellation (Immediate vs End-of-Period)
    console.log("\n--- TEST 8: Cancellation Management ---");
    const cancelledSub = await subscriptionService.cancelSubscription(
      trialSub._id,
      "immediate",
      "Trial evaluation complete, no purchase",
      staffUser
    );
    assert(cancelledSub.status === "cancelled", "Immediate cancellation status set to 'cancelled'");

    // TEST 9: State Machine Lifecycle Transition Protection
    console.log("\n--- TEST 9: Invalid Status Transition Rejection ---");
    let invalidTransitionFailed = false;
    try {
      subscriptionLifecycleService.validateStatusTransition("cancelled", "active");
    } catch (err) {
      invalidTransitionFailed = true;
    }
    assert(invalidTransitionFailed, "Re-activation of cancelled subscription rejected by lifecycle engine");

    // TEST 10: Expiration Service
    console.log("\n--- TEST 10: Expiration Processing ---");
    const expiringSub = await subscriptionService.createManualSubscription({
      customerId: "67246830a3f65e2a84b13003",
      status: "active",
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 1000), // Ended in past
      lineItems: [
        {
          planId: "67246830a3f65e2a84b12005",
          quantity: 1,
          unitPrice: 150,
          billingFrequency: "daily"
        }
      ]
    }, staffUser);

    const checkedExp = await subscriptionExpirationService.checkAndExpireSubscription(expiringSub);
    assert(checkedExp.status === "expired", "Subscription marked as 'expired' when endDate passed");

    // TEST 11: Audit Activity Log
    console.log("\n--- TEST 11: Activity Trail ---");
    const activities = await SubscriptionActivity.find({ subscriptionId: activeSub._id });
    assert(activities.length >= 4, `Subscription has ${activities.length} activity audit log records`);

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

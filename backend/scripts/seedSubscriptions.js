import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB, { closeDB } from "../src/config/db.js";
import Subscription from "../src/modules/subscriptions/models/Subscription.js";
import SubscriptionActivity from "../src/modules/subscriptions/models/SubscriptionActivity.js";
import SubscriptionRenewal from "../src/modules/subscriptions/models/SubscriptionRenewal.js";
import SubscriptionPlanChange from "../src/modules/subscriptions/models/SubscriptionPlanChange.js";
import SubscriptionNumberCounter from "../src/modules/subscriptions/models/SubscriptionNumberCounter.js";
import subscriptionService from "../src/modules/subscriptions/services/subscriptionService.js";
import subscriptionRenewalService from "../src/modules/subscriptions/services/subscriptionRenewalService.js";
import subscriptionPlanChangeService from "../src/modules/subscriptions/services/subscriptionPlanChangeService.js";

const seedSubscriptions = async () => {
  try {
    console.log("Connecting to MongoDB for M7 Subscription seeding...");
    await connectDB();

    // Clear previous subscription records
    await Subscription.deleteMany({});
    await SubscriptionActivity.deleteMany({});
    await SubscriptionRenewal.deleteMany({});
    await SubscriptionPlanChange.deleteMany({});
    await SubscriptionNumberCounter.deleteMany({});
    console.log("Cleared existing subscriptions, counters, renewals and plan changes.");

    const staffUser = { id: "67246830a3f65e2a84b12345", role: "staff" };

    // 1. ACTIVE SUBSCRIPTION (Monthly with renewal history)
    console.log("Creating Sample 1: Active Subscription (ABC Technologies)...");
    const sub1 = await subscriptionService.createManualSubscription({
      customerId: "67246830a3f65e2a84b13001",
      status: "active",
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Started 60 days ago
      lineItems: [
        {
          planId: "67246830a3f65e2a84b12002",
          planSnapshot: { name: "Enterprise Cloud Subscription (Monthly)", price: 5000 },
          description: "Monthly enterprise software tier with high availability",
          quantity: 2,
          unitPrice: 5000,
          billingFrequency: "monthly",
          billingInterval: 1
        }
      ]
    }, staffUser);

    // Simulate 2 previous renewals
    console.log("Recording renewal history for Subscription 1...");
    await subscriptionRenewalService.renewSubscription(sub1, staffUser);

    // 2. TRIAL SUBSCRIPTION (14-day trial)
    console.log("Creating Sample 2: Trial Subscription (Kochi Infotech)...");
    const sub2 = await subscriptionService.createManualSubscription({
      customerId: "67246830a3f65e2a84b13002",
      trialEnabled: true,
      trialDays: 14,
      startDate: new Date(),
      lineItems: [
        {
          planId: "67246830a3f65e2a84b12003",
          planSnapshot: { name: "Starter Business Plan (Monthly)", price: 1999 },
          description: "Monthly SaaS user subscription (Trial)",
          quantity: 1,
          unitPrice: 1999,
          billingFrequency: "monthly",
          billingInterval: 1
        }
      ]
    }, staffUser);

    // 3. PENDING SUBSCRIPTION (Scheduled for next month)
    console.log("Creating Sample 3: Pending Subscription (Apex Logistics)...");
    const sub3 = await subscriptionService.createManualSubscription({
      customerId: "67246830a3f65e2a84b13003",
      status: "pending",
      startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Starts in 15 days
      lineItems: [
        {
          planId: "67246830a3f65e2a84b12001",
          planSnapshot: { name: "Enterprise Cloud Subscription (Yearly)", price: 50000 },
          description: "Annual Enterprise Cloud Suite deployment",
          quantity: 1,
          unitPrice: 50000,
          billingFrequency: "yearly",
          billingInterval: 1
        }
      ]
    }, staffUser);

    // 4. PAUSED SUBSCRIPTION
    console.log("Creating Sample 4: Paused Subscription (BlueSky Digital Media / Customer Test Account)...");
    const sub4 = await subscriptionService.createManualSubscription({
      customerId: "67246830a3f65e2a84b13004", // customer@brightloop.local
      status: "active",
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lineItems: [
        {
          planId: "67246830a3f65e2a84b12003",
          planSnapshot: { name: "Starter Business Plan (Monthly)", price: 1999 },
          description: "Monthly subscription (Temporarily Paused)",
          quantity: 1,
          unitPrice: 1999,
          billingFrequency: "monthly",
          billingInterval: 1
        }
      ]
    }, staffUser);

    await subscriptionService.pauseSubscription(
      sub4._id,
      "Customer requested temporary freeze during seasonal restructuring",
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      staffUser
    );

    // 5. PAST-DUE SUBSCRIPTION
    console.log("Creating Sample 5: Past-Due Subscription (ABC Technologies)...");
    const sub5 = await subscriptionService.createManualSubscription({
      customerId: "67246830a3f65e2a84b13001",
      status: "active",
      startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      lineItems: [
        {
          planId: "67246830a3f65e2a84b12004",
          planSnapshot: { name: "Developer Sandbox Tier (Weekly)", price: 600 },
          description: "Fast spin-up sandbox environment",
          quantity: 2,
          unitPrice: 600,
          billingFrequency: "weekly",
          billingInterval: 1
        }
      ]
    }, staffUser);

    sub5.status = "past_due";
    sub5.billingIntegration.lastError = "Invoice #INV-2026-0042 overdue - bank payment declined";
    await sub5.save();

    // 6. CANCELLED SUBSCRIPTION
    console.log("Creating Sample 6: Cancelled Subscription...");
    const sub6 = await subscriptionService.createManualSubscription({
      customerId: "67246830a3f65e2a84b13002",
      status: "active",
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      lineItems: [
        {
          planId: "67246830a3f65e2a84b12002",
          planSnapshot: { name: "Enterprise Cloud Subscription (Monthly)", price: 5000 },
          description: "Enterprise tier",
          quantity: 1,
          unitPrice: 5000,
          billingFrequency: "monthly",
          billingInterval: 1
        }
      ]
    }, staffUser);

    await subscriptionService.cancelSubscription(
      sub6._id,
      "immediate",
      "Customer migrating to on-premises custom architecture",
      staffUser
    );

    // 7. EXPIRED SUBSCRIPTION
    console.log("Creating Sample 7: Expired Subscription (Historical)...");
    const sub7 = await subscriptionService.createManualSubscription({
      customerId: "67246830a3f65e2a84b13003",
      status: "active",
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
      endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Ended 30 days ago
      lineItems: [
        {
          planId: "67246830a3f65e2a84b12005",
          planSnapshot: { name: "High-Performance Compute Burst (Daily)", price: 150 },
          description: "Fixed term compute allocation",
          quantity: 1,
          unitPrice: 150,
          billingFrequency: "daily",
          billingInterval: 1
        }
      ]
    }, staffUser);

    sub7.status = "expired";
    await sub7.save();

    // 8. SUBSCRIPTION WITH PLAN UPGRADE HISTORY
    console.log("Recording plan upgrade on Subscription 1...");
    // Move from monthly (5000) to yearly (50000)
    await subscriptionPlanChangeService.changeSubscriptionPlan(
      sub1,
      "67246830a3f65e2a84b12001",
      "Customer opted for annual billing discount",
      staffUser
    );

    console.log("Successfully seeded 7 diverse subscriptions covering all lifecycle states, renewals and plan changes!");
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    await closeDB();
    process.exit(1);
  }
};

seedSubscriptions();

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB, { closeDB } from "../src/config/db.js";
import DiscountCampaign from "../src/modules/discounts/models/DiscountCampaign.js";
import Discount from "../src/modules/discounts/models/Discount.js";
import DiscountUsage from "../src/modules/discounts/models/DiscountUsage.js";
import DiscountActivity from "../src/modules/discounts/models/DiscountActivity.js";

const seedDiscounts = async () => {
  console.log("Connecting to MongoDB for M8 Discount seeding...");
  await connectDB();

  try {
    console.log("Clearing existing discount records...");
    await DiscountCampaign.deleteMany({});
    await Discount.deleteMany({});
    await DiscountUsage.deleteMany({});
    await DiscountActivity.deleteMany({});

    const adminId = "67246830a3f65e2a84b11111";
    const customer1 = "67246830a3f65e2a84b13001"; // ABC Tech
    const customer2 = "67246830a3f65e2a84b13002"; // Kochi Infotech
    const customer3 = "67246830a3f65e2a84b13003"; // Apex Logistics
    const customer4 = "67246830a3f65e2a84b13004"; // BlueSky (customer test role)

    // 1. Create Campaigns
    console.log("Creating Discount Campaigns...");
    const campWelcome = await DiscountCampaign.create({
      name: "Welcome Festive Season 2026",
      campaignCode: "WELCOME_2026",
      description: "Introductory offers for newly onboarding Brightloop Software customers",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      status: "active",
      createdBy: adminId
    });

    const campFestive = await DiscountCampaign.create({
      name: "Kochi Tech Fest Special",
      campaignCode: "KOCHI_TECHFEST",
      description: "Exclusive promotional coupons for Make-A-Ton hackathon attendees",
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-11-30"),
      status: "active",
      createdBy: adminId
    });

    const campEnterprise = await DiscountCampaign.create({
      name: "Enterprise Annual Expansion",
      campaignCode: "ENTERPRISE_ANNUAL",
      description: "Volume incentives for annual enterprise SaaS subscriptions",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      status: "active",
      createdBy: adminId
    });

    // 2. Create Diverse Discounts
    console.log("Creating Discounts...");

    // Sample 1: WELCOME20 (Percentage with cap & min purchase)
    const d1 = await Discount.create({
      name: "New Customer Welcome Offer",
      code: "WELCOME20",
      description: "20% off on your first quotation (max ₹500 discount)",
      campaignId: campWelcome._id,
      discountType: "percentage",
      discountValue: 20,
      maximumDiscount: 500,
      minimumPurchase: 999,
      usageLimits: {
        maximumTotalUsage: 500,
        maximumPerCustomer: 1
      },
      usageCount: 2,
      applicationType: "one_time",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      status: "active",
      createdBy: adminId
    });

    // Sample 2: FESTIVE500 (Fixed amount on ₹2,000 min order)
    const d2 = await Discount.create({
      name: "Festive Flat Discount",
      code: "FESTIVE500",
      description: "Flat ₹500 off on total orders above ₹2,000",
      campaignId: campFestive._id,
      discountType: "fixed",
      discountValue: 500,
      minimumPurchase: 2000,
      usageLimits: {
        maximumTotalUsage: 200,
        maximumPerCustomer: 2
      },
      usageCount: 1,
      applicationType: "one_time",
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-11-30"),
      status: "active",
      createdBy: adminId
    });

    // Sample 3: ANNUAL15 (Recurring percentage discount for 3 billing cycles)
    const d3 = await Discount.create({
      name: "Annual Plan 15% Incentive",
      code: "ANNUAL15",
      description: "15% discount applied across your first 3 monthly renewal cycles",
      campaignId: campEnterprise._id,
      discountType: "percentage",
      discountValue: 15,
      maximumDiscount: 1500,
      minimumPurchase: 5000,
      applicationType: "recurring",
      billingCycles: 3,
      usageLimits: {
        maximumTotalUsage: 100,
        maximumPerCustomer: 1
      },
      usageCount: 1,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      status: "active",
      createdBy: adminId
    });

    // Sample 4: STUDENT10 (Micro discount)
    const d4 = await Discount.create({
      name: "Student / Developer Starter",
      code: "STUDENT10",
      description: "10% off for verified developers & student accounts (max ₹300)",
      discountType: "percentage",
      discountValue: 10,
      maximumDiscount: 300,
      minimumPurchase: 499,
      applicationType: "one_time",
      usageLimits: {
        maximumTotalUsage: 1000,
        maximumPerCustomer: 3
      },
      usageCount: 0,
      status: "active",
      createdBy: adminId
    });

    // Sample 5: ENTERPRISE25 (Plan-Specific Discount)
    const d5 = await Discount.create({
      name: "Enterprise Cloud VIP Upgrade",
      code: "ENTERPRISE25",
      description: "25% discount exclusively applicable on the Enterprise Cloud Plan",
      campaignId: campEnterprise._id,
      discountType: "percentage",
      discountValue: 25,
      maximumDiscount: 15000,
      minimumPurchase: 25000,
      applicability: {
        plans: ["67246830a3f65e2a84b12001"] // Enterprise Plan ID
      },
      applicationType: "one_time",
      status: "active",
      createdBy: adminId
    });

    // Sample 6: NEWUSER100 (New Customers Only)
    const d6 = await Discount.create({
      name: "First Order Gift",
      code: "NEWUSER100",
      description: "Flat ₹100 off exclusively on customer's first purchase",
      discountType: "fixed",
      discountValue: 100,
      minimumPurchase: 500,
      applicability: {
        customerType: "new"
      },
      applicationType: "one_time",
      status: "active",
      createdBy: adminId
    });

    // Sample 7: EXPIRED50 (Expired coupon)
    const d7 = await Discount.create({
      name: "Diwali 2025 Flash Sale",
      code: "EXPIRED50",
      description: "Historical promotional coupon that has passed its validity window",
      discountType: "percentage",
      discountValue: 50,
      startDate: new Date("2025-10-01"),
      endDate: new Date("2025-11-15"),
      status: "expired",
      createdBy: adminId
    });

    // Sample 8: FUTURE2027 (Future-dated coupon)
    const d8 = await Discount.create({
      name: "New Year 2027 Launch",
      code: "FUTURE27",
      description: "Early-bird coupon valid from January 1, 2027",
      discountType: "percentage",
      discountValue: 20,
      startDate: new Date("2027-01-01"),
      endDate: new Date("2027-01-31"),
      status: "active",
      createdBy: adminId
    });

    // Sample 9: PAUSED15 (Inactive coupon)
    const d9 = await Discount.create({
      name: "Mid-Season Review Promo",
      code: "PAUSED15",
      description: "Temporarily deactivated while campaign parameters are under review",
      discountType: "percentage",
      discountValue: 15,
      status: "inactive",
      createdBy: adminId
    });

    // Sample 10: VIP1000 (Customer-Specific Coupon)
    const d10 = await Discount.create({
      name: "Strategic Account Bonus",
      code: "VIP1000",
      description: "Exclusive ₹1,000 voucher assigned to ABC Technologies",
      discountType: "fixed",
      discountValue: 1000,
      minimumPurchase: 3000,
      applicability: {
        customerIds: [customer1]
      },
      status: "active",
      createdBy: adminId
    });

    // 3. Seed Usage Redemptions
    console.log("Seeding sample redemption records...");
    await DiscountUsage.create([
      {
        discountId: d1._id,
        customerId: customer1,
        contextType: "quotation",
        idempotencyKey: `discount:${d1._id}:quotation:QUO-2026-0001`,
        discountAmount: 400,
        currency: "INR",
        status: "redeemed",
        reservedAt: new Date(Date.now() - 5 * 86400000),
        redeemedAt: new Date(Date.now() - 5 * 86400000),
        metadata: { code: "WELCOME20", quotationNumber: "QUO-2026-0001" }
      },
      {
        discountId: d1._id,
        customerId: customer2,
        contextType: "quotation",
        idempotencyKey: `discount:${d1._id}:quotation:QUO-2026-0002`,
        discountAmount: 500,
        currency: "INR",
        status: "redeemed",
        reservedAt: new Date(Date.now() - 2 * 86400000),
        redeemedAt: new Date(Date.now() - 2 * 86400000),
        metadata: { code: "WELCOME20", quotationNumber: "QUO-2026-0002" }
      },
      {
        discountId: d2._id,
        customerId: customer3,
        contextType: "quotation",
        idempotencyKey: `discount:${d2._id}:quotation:QUO-2026-0003`,
        discountAmount: 500,
        currency: "INR",
        status: "redeemed",
        reservedAt: new Date(Date.now() - 1 * 86400000),
        redeemedAt: new Date(Date.now() - 1 * 86400000),
        metadata: { code: "FESTIVE500", quotationNumber: "QUO-2026-0003" }
      },
      {
        discountId: d3._id,
        customerId: customer4,
        contextType: "subscription",
        idempotencyKey: `discount:${d3._id}:subscription:SUB-2026-0001`,
        discountAmount: 1500,
        currency: "INR",
        status: "redeemed",
        reservedAt: new Date(Date.now() - 12 * 86400000),
        redeemedAt: new Date(Date.now() - 12 * 86400000),
        metadata: { code: "ANNUAL15", subscriptionNumber: "SUB-2026-0001", cycle: 1 }
      }
    ]);

    // 4. Seed Audit Activity Logs
    console.log("Seeding sample activity records...");
    await DiscountActivity.create([
      {
        discountId: d1._id,
        campaignId: campWelcome._id,
        action: "discount_created",
        description: "Created percentage discount 'New Customer Welcome Offer' (WELCOME20)",
        performedByRole: "admin",
        createdAt: new Date(Date.now() - 10 * 86400000)
      },
      {
        discountId: d1._id,
        campaignId: campWelcome._id,
        action: "usage_redeemed",
        description: "Redeemed discount WELCOME20 for ₹400 on proposal QUO-2026-0001",
        performedByRole: "staff",
        createdAt: new Date(Date.now() - 5 * 86400000)
      },
      {
        discountId: d2._id,
        campaignId: campFestive._id,
        action: "discount_created",
        description: "Created fixed discount 'Festive Flat Discount' (FESTIVE500)",
        performedByRole: "admin",
        createdAt: new Date(Date.now() - 4 * 86400000)
      },
      {
        discountId: d3._id,
        campaignId: campEnterprise._id,
        action: "discount_created",
        description: "Created recurring discount 'Annual Plan 15% Incentive' (ANNUAL15)",
        performedByRole: "admin",
        createdAt: new Date(Date.now() - 15 * 86400000)
      }
    ]);

    console.log("Successfully seeded 3 campaigns, 10 diverse discounts, redemptions, and activity history!");
    await closeDB();
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    await closeDB();
    process.exit(1);
  }
};

seedDiscounts();

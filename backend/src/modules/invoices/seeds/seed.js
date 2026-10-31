require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../../../config/db');
const Invoice = require('../models/Invoice');
const InvoiceSequence = require('../models/InvoiceSequence');
const InvoiceAuditLog = require('../models/InvoiceAuditLog');
const { seedTaxConfigurations } = require('./taxSeed');
const { calculateInvoiceTotals } = require('../services/invoiceCalculationService');
const { SEED_CUSTOMERS } = require('../adapters/customerAdapter');

const seedDatabase = async () => {
  try {
    console.log('[Seed:M10] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed:M10] Seeding tax configurations...');
    await seedTaxConfigurations();

    // Reset sequences for clean dev testing if required
    await InvoiceSequence.findOneAndUpdate(
      { prefix: 'INV', year: 2026 },
      { $set: { sequence: 6 } },
      { upsert: true }
    );

    // Clear existing sample invoices to prevent duplicates
    await Invoice.deleteMany({ invoiceNumber: { $regex: /^INV-2026-/ } });
    await InvoiceAuditLog.deleteMany({});

    console.log('[Seed:M10] Creating realistic invoice scenarios...');

    const supplierState = 'Kerala';
    const c1 = SEED_CUSTOMERS[0]; // Kochi Tech Labs (Kerala - Intra-State GST)
    const c2 = SEED_CUSTOMERS[1]; // Bengaluru Cloud (Karnataka - Inter-State IGST)
    const c3 = SEED_CUSTOMERS[2]; // Chennai Retail (Tamil Nadu - Inter-State IGST)
    const c4 = SEED_CUSTOMERS[3]; // Arun Kumar (Kerala Consumer - Intra-State)

    // 1. DRAFT Invoice (Intra-state Kerala: CGST 9% + SGST 9%)
    const draftItems = [
      {
        itemName: 'Brightloop Starter SaaS Plan (Monthly)',
        description: 'Includes up to 5 user seats and essential automation tools',
        productId: 'prod_starter',
        quantity: 1,
        unitPrice: 2000,
        discountType: 'percentage',
        discountValue: 10, // ₹200 discount -> ₹1800 taxable
        taxCode: 'GST18',
        taxRate: 18
      },
      {
        itemName: 'Onboarding & Setup Assistance',
        description: 'One-time onboarding consultation',
        productId: 'prod_onboarding',
        quantity: 1,
        unitPrice: 1500,
        discountType: 'fixed',
        discountValue: 0,
        taxCode: 'GST18',
        taxRate: 18
      }
    ];
    const draftCalc = await calculateInvoiceTotals(draftItems, supplierState, c1.state);

    const draftInvoice = new Invoice({
      invoiceNumber: 'INV-2026-0001',
      customerId: c1.id,
      customerSnapshot: {
        name: c1.name,
        email: c1.email,
        phone: c1.phone,
        gstin: c1.gstin,
        state: c1.state,
        billingAddress: c1.billingAddress
      },
      supplierSnapshot: {
        name: 'Brightloop Software',
        gstin: '32AABCB1234D1Z8',
        state: supplierState,
        email: 'billing@brightloop.io',
        phone: '+91 484 290 8800',
        address: 'Infopark Kochi, Phase II, Kakkanad, Ernakulam, Kerala 682042'
      },
      subscriptionId: 'sub_bright_starter_01',
      issueDate: new Date('2026-10-25T10:00:00Z'),
      dueDate: new Date('2026-11-09T23:59:59Z'),
      items: draftCalc.items,
      subtotal: draftCalc.subtotal,
      discountTotal: draftCalc.discountTotal,
      taxableAmount: draftCalc.taxableAmount,
      taxBreakdown: draftCalc.taxBreakdown,
      taxTotal: draftCalc.taxTotal,
      grandTotal: draftCalc.grandTotal,
      amountPaid: 0,
      outstandingAmount: draftCalc.grandTotal,
      currency: 'INR',
      status: 'draft',
      notes: 'Initial quotation converted to draft invoice. Awaiting admin review.'
    });
    await draftInvoice.save();

    // 2. ISSUED Invoice (Inter-state Karnataka: IGST 18%)
    const issuedItems = [
      {
        itemName: 'Brightloop Professional Cloud Suite (Quarterly)',
        description: 'Quarterly billing plan with 20 user seats and API access',
        productId: 'prod_pro_suite',
        quantity: 1,
        unitPrice: 15000,
        discountType: 'percentage',
        discountValue: 5, // ₹750 discount -> ₹14,250 taxable
        taxCode: 'GST18',
        taxRate: 18
      }
    ];
    const issuedCalc = await calculateInvoiceTotals(issuedItems, supplierState, c2.state);

    const issuedInvoice = new Invoice({
      invoiceNumber: 'INV-2026-0002',
      customerId: c2.id,
      customerSnapshot: {
        name: c2.name,
        email: c2.email,
        phone: c2.phone,
        gstin: c2.gstin,
        state: c2.state,
        billingAddress: c2.billingAddress
      },
      supplierSnapshot: {
        name: 'Brightloop Software',
        gstin: '32AABCB1234D1Z8',
        state: supplierState,
        email: 'billing@brightloop.io',
        phone: '+91 484 290 8800',
        address: 'Infopark Kochi, Phase II, Kakkanad, Ernakulam, Kerala 682042'
      },
      subscriptionId: 'sub_bright_pro_02',
      issueDate: new Date('2026-10-20T09:00:00Z'),
      dueDate: new Date('2026-11-04T23:59:59Z'),
      items: issuedCalc.items,
      subtotal: issuedCalc.subtotal,
      discountTotal: issuedCalc.discountTotal,
      taxableAmount: issuedCalc.taxableAmount,
      taxBreakdown: issuedCalc.taxBreakdown,
      taxTotal: issuedCalc.taxTotal,
      grandTotal: issuedCalc.grandTotal,
      amountPaid: 0,
      outstandingAmount: issuedCalc.grandTotal,
      currency: 'INR',
      status: 'issued',
      issuedAt: new Date('2026-10-20T09:15:00Z'),
      notes: 'Payment net 15 days via NEFT / RTGS.'
    });
    await issuedInvoice.save();

    // 3. PARTIALLY PAID Invoice (Intra-state Kerala: CGST + SGST)
    const partialItems = [
      {
        itemName: 'Brightloop Enterprise Dedicated Instance (Monthly)',
        description: 'Single-tenant instance with custom SSO & SLA',
        productId: 'prod_enterprise_dedicated',
        quantity: 1,
        unitPrice: 30000,
        discountType: 'percentage',
        discountValue: 0,
        taxCode: 'GST18',
        taxRate: 18
      }
    ];
    const partialCalc = await calculateInvoiceTotals(partialItems, supplierState, c1.state);
    const partialPaid = 15000;

    const partialInvoice = new Invoice({
      invoiceNumber: 'INV-2026-0003',
      customerId: c1.id,
      customerSnapshot: {
        name: c1.name,
        email: c1.email,
        phone: c1.phone,
        gstin: c1.gstin,
        state: c1.state,
        billingAddress: c1.billingAddress
      },
      supplierSnapshot: {
        name: 'Brightloop Software',
        gstin: '32AABCB1234D1Z8',
        state: supplierState,
        email: 'billing@brightloop.io',
        phone: '+91 484 290 8800',
        address: 'Infopark Kochi, Phase II, Kakkanad, Ernakulam, Kerala 682042'
      },
      subscriptionId: 'sub_bright_ent_03',
      issueDate: new Date('2026-10-15T08:00:00Z'),
      dueDate: new Date('2026-10-30T23:59:59Z'),
      items: partialCalc.items,
      subtotal: partialCalc.subtotal,
      discountTotal: partialCalc.discountTotal,
      taxableAmount: partialCalc.taxableAmount,
      taxBreakdown: partialCalc.taxBreakdown,
      taxTotal: partialCalc.taxTotal,
      grandTotal: partialCalc.grandTotal,
      amountPaid: partialPaid,
      outstandingAmount: Math.round((partialCalc.grandTotal - partialPaid) * 100) / 100,
      currency: 'INR',
      status: 'partially_paid',
      issuedAt: new Date('2026-10-15T08:30:00Z'),
      notes: 'Advance installment received on 18 Oct 2026.'
    });
    await partialInvoice.save();

    // 4. PAID Invoice (Inter-state Tamil Nadu: IGST 18%)
    const paidItems = [
      {
        itemName: 'Brightloop Growth SaaS Plan (Annual)',
        description: '12-month advance subscription discount applied',
        productId: 'prod_growth_annual',
        quantity: 1,
        unitPrice: 45000,
        discountType: 'percentage',
        discountValue: 15, // 15% discount -> ₹38,250 taxable
        taxCode: 'GST18',
        taxRate: 18
      }
    ];
    const paidCalc = await calculateInvoiceTotals(paidItems, supplierState, c3.state);

    const paidInvoice = new Invoice({
      invoiceNumber: 'INV-2026-0004',
      customerId: c3.id,
      customerSnapshot: {
        name: c3.name,
        email: c3.email,
        phone: c3.phone,
        gstin: c3.gstin,
        state: c3.state,
        billingAddress: c3.billingAddress
      },
      supplierSnapshot: {
        name: 'Brightloop Software',
        gstin: '32AABCB1234D1Z8',
        state: supplierState,
        email: 'billing@brightloop.io',
        phone: '+91 484 290 8800',
        address: 'Infopark Kochi, Phase II, Kakkanad, Ernakulam, Kerala 682042'
      },
      subscriptionId: 'sub_bright_growth_04',
      issueDate: new Date('2026-10-01T10:00:00Z'),
      dueDate: new Date('2026-10-15T23:59:59Z'),
      items: paidCalc.items,
      subtotal: paidCalc.subtotal,
      discountTotal: paidCalc.discountTotal,
      taxableAmount: paidCalc.taxableAmount,
      taxBreakdown: paidCalc.taxBreakdown,
      taxTotal: paidCalc.taxTotal,
      grandTotal: paidCalc.grandTotal,
      amountPaid: paidCalc.grandTotal,
      outstandingAmount: 0,
      currency: 'INR',
      status: 'paid',
      issuedAt: new Date('2026-10-01T10:15:00Z'),
      notes: 'Paid in full via Razorpay gateway reference TXN-998822.'
    });
    await paidInvoice.save();

    // 5. OVERDUE Invoice (Intra-state Kerala consumer - Due date was 10 days ago)
    const overdueItems = [
      {
        itemName: 'Brightloop Basic User Seat (Monthly)',
        description: 'Single user subscription seat',
        productId: 'prod_basic',
        quantity: 1,
        unitPrice: 1200,
        discountType: 'percentage',
        discountValue: 0,
        taxCode: 'GST18',
        taxRate: 18
      }
    ];
    const overdueCalc = await calculateInvoiceTotals(overdueItems, supplierState, c4.state);

    const overdueInvoice = new Invoice({
      invoiceNumber: 'INV-2026-0005',
      customerId: c4.id,
      customerSnapshot: {
        name: c4.name,
        email: c4.email,
        phone: c4.phone,
        gstin: '',
        state: c4.state,
        billingAddress: c4.billingAddress
      },
      supplierSnapshot: {
        name: 'Brightloop Software',
        gstin: '32AABCB1234D1Z8',
        state: supplierState,
        email: 'billing@brightloop.io',
        phone: '+91 484 290 8800',
        address: 'Infopark Kochi, Phase II, Kakkanad, Ernakulam, Kerala 682042'
      },
      subscriptionId: 'sub_bright_basic_05',
      issueDate: new Date('2026-10-05T09:00:00Z'),
      dueDate: new Date('2026-10-20T23:59:59Z'), // Past due date!
      items: overdueCalc.items,
      subtotal: overdueCalc.subtotal,
      discountTotal: overdueCalc.discountTotal,
      taxableAmount: overdueCalc.taxableAmount,
      taxBreakdown: overdueCalc.taxBreakdown,
      taxTotal: overdueCalc.taxTotal,
      grandTotal: overdueCalc.grandTotal,
      amountPaid: 0,
      outstandingAmount: overdueCalc.grandTotal,
      currency: 'INR',
      status: 'overdue',
      issuedAt: new Date('2026-10-05T09:10:00Z'),
      notes: 'Reminder emails sent on 21 Oct and 26 Oct.'
    });
    await overdueInvoice.save();

    // 6. CANCELLED Invoice
    const cancelledItems = [
      {
        itemName: 'Trial Evaluation Conversion Pack',
        description: 'Abandoned conversion invoice',
        productId: 'prod_eval',
        quantity: 1,
        unitPrice: 4000,
        discountType: 'percentage',
        discountValue: 0,
        taxCode: 'GST18',
        taxRate: 18
      }
    ];
    const cancelledCalc = await calculateInvoiceTotals(cancelledItems, supplierState, c2.state);

    const cancelledInvoice = new Invoice({
      invoiceNumber: 'INV-2026-0006',
      customerId: c2.id,
      customerSnapshot: {
        name: c2.name,
        email: c2.email,
        phone: c2.phone,
        gstin: c2.gstin,
        state: c2.state,
        billingAddress: c2.billingAddress
      },
      supplierSnapshot: {
        name: 'Brightloop Software',
        gstin: '32AABCB1234D1Z8',
        state: supplierState,
        email: 'billing@brightloop.io',
        phone: '+91 484 290 8800',
        address: 'Infopark Kochi, Phase II, Kakkanad, Ernakulam, Kerala 682042'
      },
      subscriptionId: 'sub_bright_trial_06',
      issueDate: new Date('2026-10-12T10:00:00Z'),
      dueDate: new Date('2026-10-27T23:59:59Z'),
      items: cancelledCalc.items,
      subtotal: cancelledCalc.subtotal,
      discountTotal: cancelledCalc.discountTotal,
      taxableAmount: cancelledCalc.taxableAmount,
      taxBreakdown: cancelledCalc.taxBreakdown,
      taxTotal: cancelledCalc.taxTotal,
      grandTotal: cancelledCalc.grandTotal,
      amountPaid: 0,
      outstandingAmount: cancelledCalc.grandTotal,
      currency: 'INR',
      status: 'cancelled',
      cancellationReason: 'Customer opted out before service activation; replaced by custom quotation',
      cancelledAt: new Date('2026-10-14T11:20:00Z'),
      notes: 'Cancelled per customer support ticket #BL-8821.'
    });
    await cancelledInvoice.save();

    console.log('[Seed:M10] Successfully seeded 6 comprehensive invoices with all statuses:');
    console.log('  1. INV-2026-0001 (DRAFT - Intra-state Kerala: CGST 9% + SGST 9%)');
    console.log('  2. INV-2026-0002 (ISSUED - Inter-state Karnataka: IGST 18%)');
    console.log('  3. INV-2026-0003 (PARTIALLY PAID - Intra-state Kerala)');
    console.log('  4. INV-2026-0004 (PAID - Inter-state Tamil Nadu: IGST 18%)');
    console.log('  5. INV-2026-0005 (OVERDUE - Past due date)');
    console.log('  6. INV-2026-0006 (CANCELLED - Audit preserved)');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error] Failed to seed database:', err);
    process.exit(1);
  }
};

seedDatabase();

const mongoose = require('mongoose');

const unwrap = (mod) => (mod && mod.default ? mod.default : mod);

const autoSeedAll = async () => {
  try {
    console.log('[AutoSeed] Checking database collections...');

    // 1. Seed Invoices & Taxes
    try {
      const Invoice = unwrap(require('../modules/invoices/models/Invoice'));
      const invoiceCount = await Invoice.countDocuments();
      if (invoiceCount === 0) {
        console.log('[AutoSeed] Seeding sample Invoices & Tax configurations...');
        const { seedTaxConfigurations } = require('../modules/invoices/seeds/taxSeed');
        await seedTaxConfigurations();

        const { SEED_CUSTOMERS } = require('../modules/invoices/adapters/customerAdapter');
        const c1 = SEED_CUSTOMERS[0];
        const c2 = SEED_CUSTOMERS[1];

        await Invoice.create({
          invoiceNumber: 'INV-2026-0001',
          customerId: c1.id,
          customerSnapshot: {
            name: c1.name,
            companyName: c1.companyName,
            email: c1.email,
            state: c1.state,
            gstin: c1.gstin
          },
          status: 'issued',
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 15 * 86400000),
          items: [
            {
              itemName: 'Brightloop Professional SaaS (Monthly)',
              quantity: 1,
              unitPrice: 5000,
              grossAmount: 5000,
              discountType: 'percentage',
              discountValue: 10,
              discountAmount: 500,
              taxableAmount: 4500,
              taxCode: 'GST18',
              taxRate: 18,
              cgstRate: 9,
              cgstAmount: 405,
              sgstRate: 9,
              sgstAmount: 405,
              totalAmount: 5310
            }
          ],
          pricingSummary: {
            subtotal: 5000,
            totalDiscount: 500,
            taxableAmount: 4500,
            totalTax: 810,
            cgstTotal: 405,
            sgstTotal: 405,
            igstTotal: 0,
            roundOff: 0,
            grandTotal: 5310,
            amountPaid: 2000,
            amountDue: 3310
          },
          paymentStatus: 'partially_paid'
        });

        await Invoice.create({
          invoiceNumber: 'INV-2026-0002',
          customerId: c2.id,
          customerSnapshot: {
            name: c2.name,
            companyName: c2.companyName,
            email: c2.email,
            state: c2.state,
            gstin: c2.gstin
          },
          status: 'paid',
          invoiceDate: new Date(Date.now() - 5 * 86400000),
          dueDate: new Date(Date.now() + 10 * 86400000),
          items: [
            {
              itemName: 'Brightloop Enterprise Cloud (Yearly)',
              quantity: 1,
              unitPrice: 50000,
              grossAmount: 50000,
              discountType: 'percentage',
              discountValue: 0,
              discountAmount: 0,
              taxableAmount: 50000,
              taxCode: 'GST18',
              taxRate: 18,
              igstRate: 18,
              igstAmount: 9000,
              totalAmount: 59000
            }
          ],
          pricingSummary: {
            subtotal: 50000,
            totalDiscount: 0,
            taxableAmount: 50000,
            totalTax: 9000,
            cgstTotal: 0,
            sgstTotal: 0,
            igstTotal: 9000,
            roundOff: 0,
            grandTotal: 59000,
            amountPaid: 59000,
            amountDue: 0
          },
          paymentStatus: 'paid'
        });
        console.log('[AutoSeed] Invoices seeded successfully!');
      }
    } catch (e) {
      console.warn('[AutoSeed] Invoice seed warning:', e.message);
    }

    // 2. Seed Payments
    try {
      const Payment = unwrap(require('../modules/payments/models/Payment'));
      const paymentCount = await Payment.countDocuments();
      if (paymentCount === 0) {
        console.log('[AutoSeed] Seeding sample Payments...');
        await Payment.create({
          paymentReference: 'PAY-2026-0001',
          invoiceId: new mongoose.Types.ObjectId().toString(),
          invoiceReference: 'INV-2026-0001',
          customerId: 'cust_001_intra_kerala',
          customerSnapshot: {
            name: 'Kochi Tech Labs',
            email: 'finance@kochitechlabs.com',
            phone: '+91 98470 12345'
          },
          amount: 2000,
          currency: 'INR',
          paymentMethod: 'upi',
          paymentDate: new Date(),
          status: 'completed',
          gatewayTransactionId: 'UPI-TXN-984214',
          notes: 'Initial partial payment received via Google Pay UPI'
        });

        await Payment.create({
          paymentReference: 'PAY-2026-0002',
          invoiceId: new mongoose.Types.ObjectId().toString(),
          invoiceReference: 'INV-2026-0002',
          customerId: 'cust_002_inter_bengaluru',
          customerSnapshot: {
            name: 'Bengaluru Cloud',
            email: 'accounts@bengalurucloud.io',
            phone: '+91 80 4123 4567'
          },
          amount: 59000,
          currency: 'INR',
          paymentMethod: 'bank_transfer',
          paymentDate: new Date(Date.now() - 4 * 86400000),
          status: 'completed',
          gatewayTransactionId: 'NEFT-BLR-582910',
          notes: 'Full annual subscription payment received via NEFT'
        });
        console.log('[AutoSeed] Payments seeded successfully!');
      }
    } catch (e) {
      console.warn('[AutoSeed] Payment seed warning:', e.message);
    }

    // 3. Seed Quotations
    try {
      const Quotation = unwrap(require('../modules/quotations/models/Quotation'));
      const quotationCount = await Quotation.countDocuments();
      if (quotationCount === 0) {
        console.log('[AutoSeed] Seeding sample Quotations...');
        const custId = new mongoose.Types.ObjectId();
        await Quotation.create({
          quotationNumber: 'QT-2026-0001',
          customerId: custId,
          customerSnapshot: {
            name: 'Kochi Tech Labs',
            email: 'finance@kochitechlabs.com',
            companyName: 'Kochi Tech Labs Pvt Ltd',
            billingAddress: {
              street: 'Infopark Phase 2',
              city: 'Kochi',
              state: 'Kerala',
              postalCode: '682042',
              country: 'India'
            }
          },
          quotationDate: new Date(),
          validUntil: new Date(Date.now() + 30 * 86400000),
          status: 'sent',
          lineItems: [
            {
              description: 'Brightloop Enterprise Cloud Suite (Yearly)',
              quantity: 1,
              unitPrice: 50000,
              billingFrequency: 'yearly',
              billingInterval: 1,
              taxRate: 18,
              taxBreakdown: [{ name: 'GST', rate: 18, amount: 9000 }],
              lineSubtotal: 50000,
              lineTotal: 59000
            }
          ],
          subtotal: 50000,
          taxTotal: 9000,
          totalAmount: 59000,
          currency: 'INR'
        });

        await Quotation.create({
          quotationNumber: 'QT-2026-0002',
          customerId: new mongoose.Types.ObjectId(),
          customerSnapshot: {
            name: 'Bengaluru Cloud Innovations',
            email: 'accounts@bengalurucloud.io',
            companyName: 'Bengaluru Cloud Innovations Ltd',
            billingAddress: {
              street: 'Outer Ring Road',
              city: 'Bengaluru',
              state: 'Karnataka',
              postalCode: '560103',
              country: 'India'
            }
          },
          quotationDate: new Date(),
          validUntil: new Date(Date.now() + 15 * 86400000),
          status: 'accepted',
          lineItems: [
            {
              description: 'Brightloop Professional (Monthly)',
              quantity: 5,
              unitPrice: 3000,
              billingFrequency: 'monthly',
              billingInterval: 1,
              taxRate: 18,
              taxBreakdown: [{ name: 'GST', rate: 18, amount: 2700 }],
              lineSubtotal: 15000,
              lineTotal: 17700
            }
          ],
          subtotal: 15000,
          taxTotal: 2700,
          totalAmount: 17700,
          currency: 'INR'
        });
        console.log('[AutoSeed] Quotations seeded successfully!');
      }
    } catch (e) {
      console.warn('[AutoSeed] Quotation seed warning:', e.message);
    }

    // 4. Seed Discounts
    try {
      const Discount = unwrap(require('../modules/discounts/models/Discount'));
      const discountCount = await Discount.countDocuments();
      if (discountCount === 0) {
        console.log('[AutoSeed] Seeding sample Discounts...');
        const DiscountCampaign = unwrap(require('../modules/discounts/models/DiscountCampaign'));
        const camp = await DiscountCampaign.create({
          name: 'Hackathon 2026 Special Offer',
          campaignCode: 'HACK2026',
          description: 'Special promo discounts for Brightloop Hackathon evaluations',
          status: 'active',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31')
        });

        await Discount.create({
          code: 'BRIGHTLOOP20',
          name: '20% Welcome Discount',
          discountType: 'percentage',
          discountValue: 20,
          campaignId: camp._id,
          status: 'active',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          maximumDiscount: 5000,
          minimumPurchase: 1000
        });
        console.log('[AutoSeed] Discounts seeded successfully!');
      }
    } catch (e) {
      console.warn('[AutoSeed] Discount seed warning:', e.message);
    }

    console.log('[AutoSeed] Auto-seeding completed successfully.');
  } catch (err) {
    console.warn('[AutoSeed] Master seed error:', err.message);
  }
};

module.exports = { autoSeedAll };

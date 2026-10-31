const TaxConfiguration = require('../models/TaxConfiguration');

const SEED_TAXES = [
  {
    name: 'Zero Tax / Exempt (0%)',
    code: 'GST0',
    description: 'Zero-rated export or exempted software services',
    rate: 0,
    taxType: 'percentage',
    applicability: 'all',
    isActive: true
  },
  {
    name: 'GST Concessional (5%)',
    code: 'GST5',
    description: 'Concessional tax rate for designated digital resources',
    rate: 5,
    taxType: 'percentage',
    applicability: 'all',
    isActive: true
  },
  {
    name: 'GST Reduced (12%)',
    code: 'GST12',
    description: 'Specified IT hardware equipment and utilities',
    rate: 12,
    taxType: 'percentage',
    applicability: 'all',
    isActive: true
  },
  {
    name: 'Standard GST (18%)',
    code: 'GST18',
    description: 'Standard statutory rate for SaaS, Cloud Hosting, and Software Subscriptions in India',
    rate: 18,
    taxType: 'percentage',
    applicability: 'services',
    isActive: true
  },
  {
    name: 'Luxury / Special GST (28%)',
    code: 'GST28',
    description: 'Special tier services and high-end enterprise appliances',
    rate: 28,
    taxType: 'percentage',
    applicability: 'all',
    isActive: true
  }
];

const seedTaxConfigurations = async () => {
  for (const tax of SEED_TAXES) {
    await TaxConfiguration.findOneAndUpdate(
      { code: tax.code },
      { $set: tax },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`[Seed] Seeded ${SEED_TAXES.length} standard GST tax configurations`);
};

module.exports = {
  seedTaxConfigurations,
  SEED_TAXES
};

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const { connectDB, disconnectDB } = require('../../../config/db');
const Customer = require('../models/Customer');
const CustomerNote = require('../models/CustomerNote');
const CustomerActivity = require('../models/CustomerActivity');
const User = require('../../../models/User');

const seedCustomers = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Seed] Aborting seed: Cannot run seed script in production!');
    return;
  }

  console.log('[M2 Seed] Connecting to database...');
  await connectDB();

  // Clear existing M2 collections for a clean seed
  await Customer.deleteMany({});
  await CustomerNote.deleteMany({});
  await CustomerActivity.deleteMany({});
  console.log('[M2 Seed] Cleared existing M2 customer collections.');

  // Find or use admin and staff users
  const adminUser = (await User.findOne({ role: 'admin' })) || {
    _id: '660000000000000000000001',
    fullName: 'Brightloop Admin',
    email: 'admin@brightloop.com',
    role: 'admin'
  };

  // Find or create customer users for linkage
  let customerUser1 = await User.findOne({ email: 'rahul@example.com' });
  if (!customerUser1) {
    try {
      customerUser1 = await User.create({
        fullName: 'Rahul Kumar',
        email: 'rahul@example.com',
        password: 'Rahul@Password123',
        role: 'customer',
        isActive: true
      });
    } catch (_) {
      customerUser1 = { _id: '660000000000000000000010', fullName: 'Rahul Kumar', email: 'rahul@example.com' };
    }
  }

  let customerUser2 = await User.findOne({ email: 'neha@cloudworks.io' });
  if (!customerUser2) {
    try {
      customerUser2 = await User.create({
        fullName: 'Neha Sharma',
        email: 'neha@cloudworks.io',
        password: 'Neha@Password123',
        role: 'customer',
        isActive: true
      });
    } catch (_) {
      customerUser2 = { _id: '660000000000000000000011', fullName: 'Neha Sharma', email: 'neha@cloudworks.io' };
    }
  }

  const sampleCustomers = [
    {
      userId: customerUser1._id,
      customerCode: 'CUST-1001',
      customerType: 'individual',
      firstName: 'Rahul',
      lastName: 'Kumar',
      displayName: 'Rahul Kumar',
      email: 'rahul@example.com',
      phone: '+91 9876543210',
      alternatePhone: '+91 9876543211',
      billingAddress: {
        addressType: 'billing',
        addressLine1: '402 Sunrise Heights, MG Road',
        addressLine2: 'Kakkanad',
        city: 'Kochi',
        state: 'Kerala',
        postalCode: '682030',
        country: 'India',
        isDefault: true
      },
      shippingAddress: {
        addressType: 'shipping',
        addressLine1: 'Infopark Phase 2, Carnival Infopark',
        addressLine2: 'Edachira',
        city: 'Kochi',
        state: 'Kerala',
        postalCode: '682042',
        country: 'India',
        isDefault: true
      },
      addresses: [
        {
          addressType: 'billing',
          addressLine1: '402 Sunrise Heights, MG Road',
          addressLine2: 'Kakkanad',
          city: 'Kochi',
          state: 'Kerala',
          postalCode: '682030',
          country: 'India',
          isDefault: true
        },
        {
          addressType: 'shipping',
          addressLine1: 'Infopark Phase 2, Carnival Infopark',
          addressLine2: 'Edachira',
          city: 'Kochi',
          state: 'Kerala',
          postalCode: '682042',
          country: 'India',
          isDefault: true
        }
      ],
      status: 'active',
      description: 'Individual cloud developer subscriber since Q1 2026',
      createdBy: adminUser._id
    },
    {
      userId: customerUser2._id,
      customerCode: 'CUST-1002',
      customerType: 'business',
      firstName: 'Neha',
      lastName: 'Sharma',
      displayName: 'Cloudworks Technologies Pvt Ltd',
      companyName: 'Cloudworks Technologies Pvt Ltd',
      businessRegistrationNumber: 'U72200KL2020PTC061234',
      gstin: '32AAACC1234F1Z5',
      businessType: 'Private Limited',
      industry: 'Cloud Infrastructure & DevOps',
      website: 'https://cloudworks.io',
      email: 'neha@cloudworks.io',
      phone: '+91 9847012345',
      billingAddress: {
        addressType: 'both',
        addressLine1: 'Cyber Tower, 5th Floor',
        addressLine2: 'Vyttila Hub',
        city: 'Kochi',
        state: 'Kerala',
        postalCode: '682019',
        country: 'India',
        isDefault: true
      },
      shippingAddress: {
        addressType: 'both',
        addressLine1: 'Cyber Tower, 5th Floor',
        addressLine2: 'Vyttila Hub',
        city: 'Kochi',
        state: 'Kerala',
        postalCode: '682019',
        country: 'India',
        isDefault: true
      },
      addresses: [
        {
          addressType: 'both',
          addressLine1: 'Cyber Tower, 5th Floor',
          addressLine2: 'Vyttila Hub',
          city: 'Kochi',
          state: 'Kerala',
          postalCode: '682019',
          country: 'India',
          isDefault: true
        }
      ],
      status: 'active',
      description: 'Enterprise SaaS client on Annual Corporate Plan',
      createdBy: adminUser._id
    },
    {
      customerCode: 'CUST-1003',
      customerType: 'business',
      displayName: 'Apex Global Logistics Ltd',
      companyName: 'Apex Global Logistics Ltd',
      gstin: '27AABCA1234F1Z2',
      email: 'finance@apexlogistics.com',
      phone: '+91 9123456789',
      billingAddress: {
        addressType: 'billing',
        addressLine1: 'Port Area Gate 3',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        isDefault: true
      },
      addresses: [
        {
          addressType: 'billing',
          addressLine1: 'Port Area Gate 3',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
          isDefault: true
        }
      ],
      status: 'inactive',
      description: 'Pending document verification and account activation',
      createdBy: adminUser._id
    },
    {
      customerCode: 'CUST-1004',
      customerType: 'individual',
      firstName: 'Vikram',
      lastName: 'Menon',
      displayName: 'Vikram Menon',
      email: 'vikram.menon@freelance.org',
      phone: '+91 9988776655',
      billingAddress: {
        addressType: 'billing',
        addressLine1: 'Lakeview Apartment #12',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        isDefault: true
      },
      addresses: [
        {
          addressType: 'billing',
          addressLine1: 'Lakeview Apartment #12',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
          isDefault: true
        }
      ],
      status: 'suspended',
      description: 'Suspended due to overdue billing cycle dispute',
      createdBy: adminUser._id
    }
  ];

  const createdCustomers = await Customer.create(sampleCustomers);
  console.log(`[M2 Seed] Created ${createdCustomers.length} customer profiles.`);

  // Create Sample Internal Notes
  const sampleNotes = [
    {
      customerId: createdCustomers[0]._id,
      note: 'Customer requested quotation for 5 additional team seats under the Pro tier.',
      visibility: 'internal',
      authorName: 'Brightloop Admin',
      createdBy: adminUser._id
    },
    {
      customerId: createdCustomers[1]._id,
      note: 'Verified GSTIN certificate. Enterprise discount threshold approved at 15%.',
      visibility: 'internal',
      authorName: 'Support Staff',
      createdBy: adminUser._id
    }
  ];

  await CustomerNote.create(sampleNotes);
  console.log(`[M2 Seed] Created ${sampleNotes.length} customer internal notes.`);

  // Create Sample Activity Records
  const sampleActivities = [
    {
      customerId: createdCustomers[0]._id,
      action: 'CUSTOMER_CREATED',
      description: 'Customer profile CUST-1001 created by Admin',
      performedBy: { name: 'Brightloop Admin', role: 'admin' }
    },
    {
      customerId: createdCustomers[0]._id,
      action: 'ADDRESS_ADDED',
      description: 'Added shipping address in Infopark Kochi',
      performedBy: { name: 'Brightloop Admin', role: 'admin' }
    },
    {
      customerId: createdCustomers[1]._id,
      action: 'CUSTOMER_CREATED',
      description: 'Corporate client Cloudworks Technologies profile created',
      performedBy: { name: 'Brightloop Admin', role: 'admin' }
    },
    {
      customerId: createdCustomers[3]._id,
      action: 'STATUS_CHANGED',
      description: 'Account status updated from active to suspended',
      performedBy: { name: 'Brightloop Admin', role: 'admin' }
    }
  ];

  await CustomerActivity.create(sampleActivities);
  console.log(`[M2 Seed] Created ${sampleActivities.length} customer activity audit events.`);

  console.log('[M2 Seed] Seeding completed successfully!');
  return createdCustomers;
};

if (require.main === module) {
  seedCustomers()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[M2 Seed Error]', err.message);
      try {
        await disconnectDB();
      } catch (_) {}
      process.exit(1);
    });
}

module.exports = { seedCustomers };

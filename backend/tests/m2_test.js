const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const { seedCustomers } = require('../src/modules/customers/seeds/customerSeed');
const Customer = require('../src/modules/customers/models/Customer');

let server;
let baseUrl;

const request = async (method, endpoint, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsedData;
          try {
            parsedData = JSON.parse(data);
          } catch (_) {
            parsedData = data;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsedData
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
};

const runTests = async () => {
  console.log('\n======================================================');
  console.log('STARTING M2 CUSTOMER MANAGEMENT & PORTAL TEST SUITE');
  console.log('======================================================\n');

  await connectDB();
  const seeded = await seedCustomers();

  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Test Server] Running at ${baseUrl}\n`);

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} - ${details}`);
      failed++;
    }
  };

  // Development authentication headers for standalone testing
  const adminHeaders = {
    'x-dev-role': 'admin',
    'x-dev-user-id': '660000000000000000000001',
    'x-dev-email': 'admin@brightloop.com'
  };

  const staffHeaders = {
    'x-dev-role': 'staff',
    'x-dev-user-id': '660000000000000000000002',
    'x-dev-email': 'staff@brightloop.com'
  };

  const customer1Headers = {
    'x-dev-role': 'customer',
    'x-dev-user-id': seeded[0].userId ? seeded[0].userId.toString() : '660000000000000000000010',
    'x-dev-email': seeded[0].email
  };

  const customer2Headers = {
    'x-dev-role': 'customer',
    'x-dev-user-id': seeded[1].userId ? seeded[1].userId.toString() : '660000000000000000000011',
    'x-dev-email': seeded[1].email
  };

  try {
    // ------------------------------------------------------------------
    // TEST GROUP 1: CUSTOMER CREATION & DUPLICATE CHECKS
    // ------------------------------------------------------------------
    console.log('\n--- 1. Customer Creation & Validation Tests ---');

    // 1.1 Admin creates customer
    const createRes = await request(
      'POST',
      '/api/customers',
      {
        firstName: 'Ananya',
        lastName: 'Roy',
        email: 'ananya@fintech.io',
        phone: '+91 9447123456',
        customerType: 'individual',
        billingAddress: {
          addressLine1: 'Marine Drive 101',
          city: 'Kochi',
          state: 'Kerala',
          postalCode: '682011',
          country: 'India'
        }
      },
      adminHeaders
    );
    assert(createRes.status === 201, 'Admin creates individual customer profile');
    assert(createRes.body.data.customer.customerCode.startsWith('CUST-'), 'Sequential customer code generated');
    const newCustomerId = createRes.body.data.customer.id;

    // 1.2 Reject duplicate email
    const dupEmailRes = await request(
      'POST',
      '/api/customers',
      {
        displayName: 'Duplicate Customer',
        email: 'ananya@fintech.io',
        phone: '+91 9447123456'
      },
      adminHeaders
    );
    assert(dupEmailRes.status === 409, 'Reject duplicate customer email with 409');

    // 1.3 Reject duplicate linked userId
    const dupUserRes = await request(
      'POST',
      '/api/customers',
      {
        userId: seeded[0].userId,
        displayName: 'Duplicate User Link',
        email: 'unique_new@fintech.io'
      },
      adminHeaders
    );
    assert(dupUserRes.status === 409, 'Reject duplicate customer profile for same userId with 409');

    // 1.4 Customer / Unauthenticated cannot create customer profile
    const custCreateRes = await request('POST', '/api/customers', { email: 'hack@test.com' }, customer1Headers);
    assert(custCreateRes.status === 403, 'Customer forbidden from creating customer profiles');

    const unauthCreateRes = await request('POST', '/api/customers', { email: 'hack@test.com' });
    assert(unauthCreateRes.status === 401, 'Unauthenticated request rejected with 401');

    // ------------------------------------------------------------------
    // TEST GROUP 2: LISTING, SEARCH, FILTERING & PAGINATION
    // ------------------------------------------------------------------
    console.log('\n--- 2. Customer Listing, Search & Filters ---');

    // 2.1 Admin lists all customers
    const listRes = await request('GET', '/api/customers', null, adminHeaders);
    assert(listRes.status === 200, 'Admin can list customers');
    assert(Array.isArray(listRes.body.data.customers), 'Customers returned as array');
    assert(listRes.body.data.pagination.total >= 4, 'Pagination metadata returned');

    // 2.2 Search by customer name
    const searchRes = await request('GET', '/api/customers?search=Rahul', null, staffHeaders);
    assert(searchRes.status === 200, 'Staff can search customers');
    assert(searchRes.body.data.customers.some((c) => c.displayName.includes('Rahul')), 'Search by name returns matching record');

    // 2.3 Filter by customerType
    const filterTypeRes = await request('GET', '/api/customers?customerType=business', null, staffHeaders);
    assert(filterTypeRes.status === 200, 'Filter by customerType=business works');
    assert(filterTypeRes.body.data.customers.every((c) => c.customerType === 'business'), 'All returned records are business type');

    // 2.4 Filter by status
    const filterStatusRes = await request('GET', '/api/customers?status=suspended', null, staffHeaders);
    assert(filterStatusRes.status === 200, 'Filter by status=suspended works');
    assert(filterStatusRes.body.data.customers.length >= 1, 'Suspended customer found');

    // ------------------------------------------------------------------
    // TEST GROUP 3: CUSTOMER DETAILS & ADAPTER SUMMARIES
    // ------------------------------------------------------------------
    console.log('\n--- 3. Customer Details & Adapter Summaries ---');

    const targetCustomer = seeded[0];
    const detailsRes = await request('GET', `/api/customers/${targetCustomer._id}`, null, adminHeaders);
    assert(detailsRes.status === 200, 'Retrieve full customer details');
    assert(detailsRes.body.data.customer.subscriptionSummary !== undefined, 'Subscription adapter summary included');
    assert(detailsRes.body.data.customer.invoiceSummary !== undefined, 'Invoice adapter summary included');
    assert(detailsRes.body.data.customer.paymentSummary !== undefined, 'Payment adapter summary included');

    // ------------------------------------------------------------------
    // TEST GROUP 4: STATUS UPDATES & RBAC
    // ------------------------------------------------------------------
    console.log('\n--- 4. Customer Status Management & RBAC ---');

    // 4.1 Admin deactivates customer
    const deactRes = await request('PATCH', `/api/customers/${newCustomerId}/status`, { status: 'inactive' }, adminHeaders);
    assert(deactRes.status === 200, 'Admin can update customer status to inactive');
    assert(deactRes.body.data.customer.status === 'inactive', 'Customer status updated in DB');

    // 4.2 Staff attempts status change (Forbidden)
    const staffStatusRes = await request('PATCH', `/api/customers/${newCustomerId}/status`, { status: 'active' }, staffHeaders);
    assert(staffStatusRes.status === 403, 'Staff is forbidden from changing customer status');

    // 4.3 Customer attempts status change (Forbidden)
    const custStatusRes = await request('PATCH', `/api/customers/${newCustomerId}/status`, { status: 'active' }, customer1Headers);
    assert(custStatusRes.status === 403, 'Customer is forbidden from changing account status');

    // ------------------------------------------------------------------
    // TEST GROUP 5: ADDRESS MANAGEMENT
    // ------------------------------------------------------------------
    console.log('\n--- 5. Customer Address Management ---');

    // 5.1 Add address
    const addAddrRes = await request(
      'POST',
      `/api/customers/${targetCustomer._id}/addresses`,
      {
        addressType: 'shipping',
        addressLine1: 'Technopark Phase 3',
        city: 'Trivandrum',
        state: 'Kerala',
        postalCode: '695581',
        country: 'India',
        isDefault: false
      },
      customer1Headers
    );
    assert(addAddrRes.status === 201, 'Customer can add new address to their profile');
    const createdAddrId = addAddrRes.body.data.address._id;

    // 5.2 Set default address
    const setDefaultRes = await request(
      'PATCH',
      `/api/customers/${targetCustomer._id}/addresses/${createdAddrId}/default`,
      {},
      customer1Headers
    );
    assert(setDefaultRes.status === 200, 'Customer can set default address');

    // 5.3 Delete address
    const deleteAddrRes = await request(
      'DELETE',
      `/api/customers/${targetCustomer._id}/addresses/${createdAddrId}`,
      null,
      customer1Headers
    );
    assert(deleteAddrRes.status === 200, 'Customer can delete address from their profile');

    // ------------------------------------------------------------------
    // TEST GROUP 6: INTERNAL NOTES & CUSTOMER ISOLATION
    // ------------------------------------------------------------------
    console.log('\n--- 6. Internal Notes & Security Isolation ---');

    // 6.1 Staff adds internal note
    const addNoteRes = await request(
      'POST',
      `/api/customers/${targetCustomer._id}/notes`,
      { note: 'Discussed renewal terms during client review meeting.' },
      staffHeaders
    );
    assert(addNoteRes.status === 201, 'Staff can add internal customer note');

    // 6.2 Customer attempts to read internal notes (Forbidden)
    const custReadNotesRes = await request('GET', `/api/customers/${targetCustomer._id}/notes`, null, customer1Headers);
    assert(custReadNotesRes.status === 403, 'Customer is strictly forbidden from reading internal notes');

    // 6.3 Customer cannot view another customer's profile (Ownership Protection)
    const otherCustRes = await request('GET', `/api/customers/${seeded[1]._id}`, null, customer1Headers);
    assert(otherCustRes.status === 403, 'Customer cannot view another customer profile (ownership check)');

    // ------------------------------------------------------------------
    // TEST GROUP 7: CUSTOMER PORTAL APIS
    // ------------------------------------------------------------------
    console.log('\n--- 7. Customer Portal Endpoints ---');

    // 7.1 Portal Dashboard
    const portalDashRes = await request('GET', '/api/customer-portal/dashboard', null, customer1Headers);
    assert(portalDashRes.status === 200, 'Customer loads portal dashboard');
    assert(portalDashRes.body.data.stats !== undefined, 'Portal dashboard includes stats');
    assert(Array.isArray(portalDashRes.body.data.recentSubscriptions), 'Portal dashboard includes recent subscriptions');

    // 7.2 Portal Profile
    const portalProfileRes = await request('GET', '/api/customer-portal/profile', null, customer1Headers);
    assert(portalProfileRes.status === 200, 'Customer loads portal profile');
    assert(portalProfileRes.body.data.customer.email === targetCustomer.email, 'Portal profile matches authenticated user');

    // 7.3 Portal Update Profile
    const portalUpdateRes = await request(
      'PUT',
      '/api/customer-portal/profile',
      {
        phone: '+91 9000000099',
        alternatePhone: '+91 9000000088'
      },
      customer1Headers
    );
    assert(portalUpdateRes.status === 200, 'Customer updates permitted profile fields');
    assert(portalUpdateRes.body.data.customer.phone === '+91 9000000099', 'Profile update persisted');

    // 7.4 Portal Subscriptions, Quotations, Invoices, Payments
    const portalSubsRes = await request('GET', '/api/customer-portal/subscriptions', null, customer1Headers);
    assert(portalSubsRes.status === 200 && Array.isArray(portalSubsRes.body.data.subscriptions), 'Portal subscriptions endpoint functional');

    const portalQuotesRes = await request('GET', '/api/customer-portal/quotations', null, customer1Headers);
    assert(portalQuotesRes.status === 200 && Array.isArray(portalQuotesRes.body.data.quotations), 'Portal quotations endpoint functional');

    const portalInvoicesRes = await request('GET', '/api/customer-portal/invoices', null, customer1Headers);
    assert(portalInvoicesRes.status === 200 && Array.isArray(portalInvoicesRes.body.data.invoices), 'Portal invoices endpoint functional');

    const portalPaymentsRes = await request('GET', '/api/customer-portal/payments', null, customer1Headers);
    assert(portalPaymentsRes.status === 200 && Array.isArray(portalPaymentsRes.body.data.payments), 'Portal payments endpoint functional');

    // ------------------------------------------------------------------
    // TEST GROUP 8: ACTIVITY LOGGING
    // ------------------------------------------------------------------
    console.log('\n--- 8. Activity History Audit ---');
    const activityRes = await request('GET', `/api/customers/${targetCustomer._id}/activity`, null, staffHeaders);
    assert(activityRes.status === 200, 'Retrieve customer activity history');
    assert(activityRes.body.data.activities.length >= 1, 'Activity events logged in audit trail');

  } catch (err) {
    console.error('Test runner exception:', err);
    failed++;
  } finally {
    console.log('\n======================================================');
    console.log(`M2 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');
    server.close();
    await disconnectDB();
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();

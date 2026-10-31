const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const { seedAdmin } = require('../scripts/seedAdmin');
const User = require('../src/models/User');

let server;
let baseUrl;

// Helper to make HTTP requests with cookie support
const request = async (method, endpoint, body = null, cookies = '', headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (cookies) {
      reqHeaders['Cookie'] = cookies;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
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
          const setCookie = res.headers['set-cookie'];
          resolve({
            status: res.statusCode,
            headers: res.headers,
            cookies: setCookie ? setCookie.join('; ') : '',
            body: parsedData,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n======================================================');
  console.log('STARTING M1 AUTHENTICATION & ROLE MANAGEMENT TEST SUITE');
  console.log('======================================================\n');

  await connectDB();
  await seedAdmin();

  // Start test server on random high port
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

  try {
    // ------------------------------------------------------------------
    // TEST GROUP 1: CUSTOMER REGISTRATION
    // ------------------------------------------------------------------
    console.log('\n--- 1. Customer Registration Tests ---');

    // 1.1 Password shorter than 9 chars
    const shortPassRes = await request('POST', '/api/auth/register', {
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'Short1!',
      confirmPassword: 'Short1!',
    });
    assert(shortPassRes.status === 400, 'Reject password <= 8 characters', JSON.stringify(shortPassRes.body));

    // 1.2 Missing uppercase
    const noUpperRes = await request('POST', '/api/auth/register', {
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password@123',
      confirmPassword: 'password@123',
    });
    assert(noUpperRes.status === 400, 'Reject password without uppercase letter');

    // 1.3 Missing special character
    const noSpecialRes = await request('POST', '/api/auth/register', {
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });
    assert(noSpecialRes.status === 400, 'Reject password without special character');

    // 1.4 Password mismatch
    const mismatchRes = await request('POST', '/api/auth/register', {
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'Password@123',
      confirmPassword: 'Password@999',
    });
    assert(mismatchRes.status === 400, 'Reject mismatched confirm password');

    // 1.5 Valid registration & privilege escalation protection
    const validRegRes = await request('POST', '/api/auth/register', {
      fullName: 'Rahul Kumar',
      email: 'RAHUL@example.com', // Test email normalization
      phone: '9876543210',
      password: 'Rahul@Password123',
      confirmPassword: 'Rahul@Password123',
      role: 'admin', // Attack attempt: should be ignored!
    });
    assert(validRegRes.status === 201, 'Valid customer registration succeeds');
    assert(validRegRes.body.data.user.role === 'customer', 'Registration forces role to customer (prevents privilege escalation)');
    assert(validRegRes.body.data.user.email === 'rahul@example.com', 'Email normalized to lowercase');
    assert(!validRegRes.body.data.user.password, 'Password hash never returned in response');
    const customerCookie = validRegRes.cookies;

    // 1.6 Duplicate email registration rejection
    const dupRes = await request('POST', '/api/auth/register', {
      fullName: 'Rahul Duplicate',
      email: 'rahul@example.com',
      password: 'Rahul@Password123',
      confirmPassword: 'Rahul@Password123',
    });
    assert(dupRes.status === 409, 'Reject duplicate email registration');

    // ------------------------------------------------------------------
    // TEST GROUP 2: LOGIN & SESSION TESTS
    // ------------------------------------------------------------------
    console.log('\n--- 2. Login & Session Tests ---');

    // 2.1 Admin login
    const adminLoginRes = await request('POST', '/api/auth/login', {
      email: 'admin@brightloop.com',
      password: 'ChangeThisPassword123!',
    });
    assert(adminLoginRes.status === 200, 'Admin login succeeds');
    assert(adminLoginRes.body.data.user.role === 'admin', 'Admin role verified in login');
    const adminCookie = adminLoginRes.cookies;

    // 2.2 Customer login
    const custLoginRes = await request('POST', '/api/auth/login', {
      email: 'rahul@example.com',
      password: 'Rahul@Password123',
    });
    assert(custLoginRes.status === 200, 'Customer login succeeds');
    assert(custLoginRes.body.data.user.role === 'customer', 'Customer role verified');

    // 2.3 Wrong password
    const wrongPassRes = await request('POST', '/api/auth/login', {
      email: 'rahul@example.com',
      password: 'WrongPassword@123',
    });
    assert(wrongPassRes.status === 401, 'Reject incorrect password with 401');
    assert(wrongPassRes.body.message === 'Invalid email or password', 'Generic error message for wrong password');

    // 2.4 Unknown email
    const unknownEmailRes = await request('POST', '/api/auth/login', {
      email: 'nonexistent@brightloop.com',
      password: 'Password@123',
    });
    assert(unknownEmailRes.status === 401, 'Reject unknown email with 401');
    assert(unknownEmailRes.body.message === 'Invalid email or password', 'Generic error message for unknown email');

    // 2.5 Current User (/api/auth/me)
    const meRes = await request('GET', '/api/auth/me', null, adminCookie);
    assert(meRes.status === 200, 'Retrieve current authenticated user session (/api/auth/me)');
    assert(meRes.body.data.user.email === 'admin@brightloop.com', 'Session matches logged in user');

    // 2.6 Unauthenticated access to /api/auth/me
    const unauthMeRes = await request('GET', '/api/auth/me');
    assert(unauthMeRes.status === 401, 'Reject unauthenticated session lookup');

    // ------------------------------------------------------------------
    // TEST GROUP 3: ADMIN USER & STAFF MANAGEMENT
    // ------------------------------------------------------------------
    console.log('\n--- 3. Admin User & Staff Management Tests ---');

    // 3.1 Customer cannot access Admin User Management
    const custForbiddenRes = await request('GET', '/api/users', null, customerCookie);
    assert(custForbiddenRes.status === 403, 'Customer forbidden from accessing Admin User Management');

    // 3.2 Admin lists users
    const listUsersRes = await request('GET', '/api/users', null, adminCookie);
    assert(listUsersRes.status === 200, 'Admin successfully retrieves user listing');
    assert(Array.isArray(listUsersRes.body.data.users), 'Users returned as array');

    // 3.3 Admin creates Staff member
    const createStaffRes = await request('POST', '/api/users/staff', {
      fullName: 'Sarah Operations',
      email: 'sarah@brightloop.com',
      phone: '9123456789',
      password: 'Staff@Password123',
      confirmPassword: 'Staff@Password123',
    }, adminCookie);
    assert(createStaffRes.status === 201, 'Admin creates new Staff member');
    assert(createStaffRes.body.data.user.role === 'staff', 'Created member has staff role');
    const staffId = createStaffRes.body.data.user.id;

    // 3.4 Staff attempts to create another Staff member (Forbidden)
    const staffLoginRes = await request('POST', '/api/auth/login', {
      email: 'sarah@brightloop.com',
      password: 'Staff@Password123',
    });
    const staffCookie = staffLoginRes.cookies;
    const staffCreateRes = await request('POST', '/api/users/staff', {
      fullName: 'Another Staff',
      email: 'another@brightloop.com',
      password: 'Staff@Password123',
    }, staffCookie);
    assert(staffCreateRes.status === 403, 'Staff is forbidden from creating Staff accounts');

    // 3.5 Duplicate Staff email rejected
    const dupStaffRes = await request('POST', '/api/users/staff', {
      fullName: 'Duplicate Sarah',
      email: 'sarah@brightloop.com',
      password: 'Staff@Password123',
    }, adminCookie);
    assert(dupStaffRes.status === 409, 'Reject duplicate Staff email creation');

    // 3.6 Search and Filter users
    const searchRes = await request('GET', '/api/users?search=Sarah&role=staff', null, adminCookie);
    assert(searchRes.status === 200 && searchRes.body.data.users.length >= 1, 'Search by name and filter by role works');

    // 3.7 Deactivate account
    const deactRes = await request('PATCH', `/api/users/${staffId}/status`, { isActive: false }, adminCookie);
    assert(deactRes.status === 200, 'Admin can deactivate user account');

    // 3.8 Deactivated user cannot log in
    const deactLoginRes = await request('POST', '/api/auth/login', {
      email: 'sarah@brightloop.com',
      password: 'Staff@Password123',
    });
    assert(deactLoginRes.status === 403, 'Deactivated account blocked from login');

    // 3.9 Reactivate account
    const reactRes = await request('PATCH', `/api/users/${staffId}/status`, { isActive: true }, adminCookie);
    assert(reactRes.status === 200, 'Admin can reactivate user account');

    // 3.10 Safeguard: Cannot deactivate or demote the last active Admin
    const adminUser = await User.findOne({ email: 'admin@brightloop.com' });
    const deactLastAdminRes = await request('PATCH', `/api/users/${adminUser._id}/status`, { isActive: false }, adminCookie);
    assert(deactLastAdminRes.status === 400, 'Safeguard: Cannot deactivate last active Admin');

    const demoteLastAdminRes = await request('PATCH', `/api/users/${adminUser._id}/role`, { role: 'customer' }, adminCookie);
    assert(demoteLastAdminRes.status === 400, 'Safeguard: Cannot demote last active Admin');

    // ------------------------------------------------------------------
    // TEST GROUP 4: FORGOT & RESET PASSWORD WORKFLOW
    // ------------------------------------------------------------------
    console.log('\n--- 4. Forgot & Reset Password Tests ---');

    // 4.1 Forgot password request
    const forgotRes = await request('POST', '/api/auth/forgot-password', {
      email: 'rahul@example.com',
    });
    assert(forgotRes.status === 200, 'Forgot password request processed');
    const resetToken = forgotRes.body.data.devResetToken;
    assert(!!resetToken, 'Dev reset token generated');

    // 4.2 Forgot password with unknown email (still 200 to prevent user enumeration)
    const forgotUnknownRes = await request('POST', '/api/auth/forgot-password', {
      email: 'nobody@nowhere.com',
    });
    assert(forgotUnknownRes.status === 200, 'Forgot password responds 200 for non-existent email (prevents enumeration)');

    // 4.3 Invalid token rejected
    const invalidTokenRes = await request('POST', '/api/auth/reset-password/fake-token-12345', {
      password: 'NewPassword@123',
      confirmPassword: 'NewPassword@123',
    });
    assert(invalidTokenRes.status === 400, 'Reject invalid reset token');

    // 4.4 Successful password reset
    const validResetRes = await request('POST', `/api/auth/reset-password/${resetToken}`, {
      password: 'NewRahulPassword@999',
      confirmPassword: 'NewRahulPassword@999',
    });
    assert(validResetRes.status === 200, 'Password reset succeeds with valid token');

    // 4.5 Reset token reuse rejected (single-use token)
    const reuseResetRes = await request('POST', `/api/auth/reset-password/${resetToken}`, {
      password: 'AnotherPassword@999',
      confirmPassword: 'AnotherPassword@999',
    });
    assert(reuseResetRes.status === 400, 'Reject reuse of already consumed reset token');

    // 4.6 Log in with new password
    const newPassLoginRes = await request('POST', '/api/auth/login', {
      email: 'rahul@example.com',
      password: 'NewRahulPassword@999',
    });
    assert(newPassLoginRes.status === 200, 'Login succeeds with new reset password');

    // ------------------------------------------------------------------
    // TEST GROUP 5: LOGOUT
    // ------------------------------------------------------------------
    console.log('\n--- 5. Logout Tests ---');
    const logoutRes = await request('POST', '/api/auth/logout', null, newPassLoginRes.cookies);
    assert(logoutRes.status === 200, 'Logout succeeds');
    assert(logoutRes.cookies.includes('token=;'), 'Logout clears HttpOnly cookie');

  } catch (err) {
    console.error('Test suite runtime error:', err);
    failed++;
  } finally {
    console.log('\n======================================================');
    console.log(`TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');
    server.close();
    await disconnectDB();
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();

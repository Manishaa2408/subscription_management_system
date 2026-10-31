const Customer = require('../models/Customer');
const { logActivity } = require('./customerActivityService');
const subscriptionAdapter = require('../adapters/subscriptionAdapter');
const quotationAdapter = require('../adapters/quotationAdapter');
const invoiceAdapter = require('../adapters/invoiceAdapter');
const paymentAdapter = require('../adapters/paymentAdapter');

/**
 * Generate a sequential customer code
 */
const generateCustomerCode = async () => {
  const count = await Customer.countDocuments();
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `CUST-${nextNum}`;
};

const createCustomer = async (data, currentUser) => {
  const {
    userId,
    customerCode,
    customerType = 'individual',
    firstName,
    lastName,
    displayName,
    email,
    phone,
    alternatePhone,
    companyName,
    businessRegistrationNumber,
    gstin,
    businessType,
    industry,
    website,
    billingAddress,
    shippingAddress,
    description
  } = data;

  if (!email) {
    throw new Error('Email address is required');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check duplicate email in customers
  const existingEmail = await Customer.findOne({ email: normalizedEmail });
  if (existingEmail) {
    throw new Error('A customer with this email address already exists');
  }

  // 2. Check duplicate linked userId (a user can have at most one customer profile)
  if (userId) {
    const existingUserLink = await Customer.findOne({ userId });
    if (existingUserLink) {
      throw new Error('This user account is already linked to an existing customer profile');
    }
  }

  // 3. Customer code generation & duplicate check
  let finalCode = customerCode ? customerCode.trim().toUpperCase() : await generateCustomerCode();
  const existingCode = await Customer.findOne({ customerCode: finalCode });
  if (existingCode) {
    finalCode = `CUST-${Date.now().toString().slice(-6)}`;
  }

  // 4. Derive display name if not provided
  let finalDisplayName = displayName;
  if (!finalDisplayName) {
    if (customerType === 'business' && companyName) {
      finalDisplayName = companyName.trim();
    } else {
      finalDisplayName = `${firstName || ''} ${lastName || ''}`.trim() || normalizedEmail;
    }
  }

  const customer = await Customer.create({
    userId: userId || null,
    customerCode: finalCode,
    customerType,
    firstName: firstName ? firstName.trim() : '',
    lastName: lastName ? lastName.trim() : '',
    displayName: finalDisplayName,
    email: normalizedEmail,
    phone: phone ? phone.trim() : '',
    alternatePhone: alternatePhone ? alternatePhone.trim() : '',
    companyName: companyName ? companyName.trim() : '',
    businessRegistrationNumber: businessRegistrationNumber ? businessRegistrationNumber.trim() : '',
    gstin: gstin ? gstin.trim().toUpperCase() : '',
    businessType: businessType ? businessType.trim() : '',
    industry: industry ? industry.trim() : '',
    website: website ? website.trim() : '',
    billingAddress: billingAddress || null,
    shippingAddress: shippingAddress || null,
    addresses: billingAddress ? [{ ...billingAddress, addressType: 'billing', isDefault: true }] : [],
    status: 'active',
    customerSince: new Date(),
    description: description ? description.trim() : '',
    createdBy: currentUser?.id || null,
    updatedBy: currentUser?.id || null
  });

  // Record creation activity
  await logActivity({
    customerId: customer._id,
    action: 'CUSTOMER_CREATED',
    description: `Customer profile ${customer.customerCode} created by ${currentUser?.fullName || 'Admin'}`,
    performedBy: currentUser,
    metadata: { customerType, code: customer.customerCode }
  });

  return customer;
};

const getCustomers = async (queryParams = {}) => {
  const {
    search,
    customerType,
    status,
    city,
    state,
    country,
    startDate,
    endDate,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = queryParams;

  const query = {};

  // Search by name, company, email, phone, customerCode
  if (search && search.trim() !== '') {
    const term = search.trim();
    const regex = new RegExp(term, 'i');
    query.$or = [
      { displayName: regex },
      { firstName: regex },
      { lastName: regex },
      { companyName: regex },
      { email: regex },
      { phone: regex },
      { customerCode: regex }
    ];
  }

  // Filter by customerType
  if (customerType && ['individual', 'business'].includes(customerType.toLowerCase())) {
    query.customerType = customerType.toLowerCase();
  }

  // Filter by status
  if (status && ['active', 'inactive', 'suspended'].includes(status.toLowerCase())) {
    query.status = status.toLowerCase();
  }

  // Location filters
  if (city) {
    query['billingAddress.city'] = new RegExp(city.trim(), 'i');
  }
  if (state) {
    query['billingAddress.state'] = new RegExp(state.trim(), 'i');
  }
  if (country) {
    query['billingAddress.country'] = new RegExp(country.trim(), 'i');
  }

  // Date range
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Allowed sort fields
  const allowedSorts = ['createdAt', 'displayName', 'customerCode', 'email', 'status'];
  const sortField = allowedSorts.includes(sortBy) ? sortBy : 'createdAt';
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const sortObj = { [sortField]: sortDirection };

  const [customers, total] = await Promise.all([
    Customer.find(query).sort(sortObj).skip(skip).limit(limitNum),
    Customer.countDocuments(query)
  ]);

  return {
    customers,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

const getCustomerById = async (id, currentUser) => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw new Error('Customer profile not found');
  }

  // Ownership check: if current user is customer, they must own this profile
  if (currentUser && currentUser.role === 'customer') {
    const isOwner =
      customer.userId && String(customer.userId) === String(currentUser.id);
    if (!isOwner) {
      throw new Error('Access denied: You are not authorized to view this customer profile');
    }
  }

  // Fetch summaries from adapters
  const [subsSummary, invoiceSummary, paymentSummary] = await Promise.all([
    subscriptionAdapter.getSubscriptionSummary(customer._id),
    invoiceAdapter.getInvoiceSummary(customer._id),
    paymentAdapter.getCustomerPaymentSummary(customer._id)
  ]);

  const customerObj = customer.toJSON();
  customerObj.subscriptionSummary = subsSummary;
  customerObj.invoiceSummary = invoiceSummary;
  customerObj.paymentSummary = paymentSummary;

  return customerObj;
};

const updateCustomer = async (id, updateData, currentUser) => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw new Error('Customer profile not found');
  }

  // Ownership check if customer role
  if (currentUser && currentUser.role === 'customer') {
    const isOwner = customer.userId && String(customer.userId) === String(currentUser.id);
    if (!isOwner) {
      throw new Error('Access denied: You cannot edit another customer profile');
    }
  }

  // Strip protected fields
  const safeData = { ...updateData };
  delete safeData.customerCode;
  delete safeData.userId;
  delete safeData.status; // status only through updateCustomerStatus
  delete safeData.createdAt;
  delete safeData.createdBy;

  // Customers cannot modify business type or internal notes
  if (currentUser && currentUser.role === 'customer') {
    delete safeData.customerType;
  }

  Object.assign(customer, safeData);
  customer.updatedBy = currentUser?.id || null;
  await customer.save();

  await logActivity({
    customerId: customer._id,
    action: 'PROFILE_UPDATED',
    description: `Profile updated by ${currentUser?.fullName || 'User'}`,
    performedBy: currentUser
  });

  return customer;
};

const updateCustomerStatus = async (id, newStatus, currentUser) => {
  if (!['active', 'inactive', 'suspended'].includes(newStatus)) {
    throw new Error("Invalid status. Allowed values: 'active', 'inactive', 'suspended'");
  }

  const customer = await Customer.findById(id);
  if (!customer) {
    throw new Error('Customer profile not found');
  }

  const oldStatus = customer.status;
  if (oldStatus === newStatus) {
    return customer;
  }

  customer.status = newStatus;
  customer.updatedBy = currentUser?.id || null;
  await customer.save();

  await logActivity({
    customerId: customer._id,
    action: 'STATUS_CHANGED',
    description: `Customer status changed from ${oldStatus} to ${newStatus}`,
    performedBy: currentUser,
    metadata: { oldStatus, newStatus }
  });

  return customer;
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  updateCustomerStatus
};

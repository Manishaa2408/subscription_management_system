const Customer = require('../models/Customer');
const { logActivity } = require('./customerActivityService');

const getAddresses = async (customerId) => {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new Error('Customer not found');
  }
  return customer.addresses || [];
};

const addAddress = async (customerId, addressData, currentUser) => {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new Error('Customer not found');
  }

  // If this address is set as default, unset other defaults of same type
  if (addressData.isDefault) {
    customer.addresses.forEach((addr) => {
      if (addr.addressType === addressData.addressType || addressData.addressType === 'both') {
        addr.isDefault = false;
      }
    });
  }

  customer.addresses.push(addressData);

  // Auto-sync main billing or shipping address if default or first address
  if (addressData.isDefault || customer.addresses.length === 1) {
    if (addressData.addressType === 'billing' || addressData.addressType === 'both') {
      customer.billingAddress = addressData;
    }
    if (addressData.addressType === 'shipping' || addressData.addressType === 'both') {
      customer.shippingAddress = addressData;
    }
  }

  await customer.save();

  await logActivity({
    customerId,
    action: 'ADDRESS_ADDED',
    description: `Added ${addressData.addressType} address (${addressData.city}, ${addressData.state})`,
    performedBy: currentUser
  });

  return customer.addresses[customer.addresses.length - 1];
};

const updateAddress = async (customerId, addressId, updateData, currentUser) => {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new Error('Customer not found');
  }

  const address = customer.addresses.id(addressId);
  if (!address) {
    throw new Error('Address not found');
  }

  if (updateData.isDefault) {
    customer.addresses.forEach((addr) => {
      if (addr._id.toString() !== addressId.toString() &&
         (addr.addressType === address.addressType || updateData.addressType === 'both')) {
        addr.isDefault = false;
      }
    });
  }

  Object.assign(address, updateData);

  // Sync if default
  if (address.isDefault) {
    if (address.addressType === 'billing' || address.addressType === 'both') {
      customer.billingAddress = address;
    }
    if (address.addressType === 'shipping' || address.addressType === 'both') {
      customer.shippingAddress = address;
    }
  }

  await customer.save();

  await logActivity({
    customerId,
    action: 'ADDRESS_UPDATED',
    description: `Updated address (${address.city}, ${address.state})`,
    performedBy: currentUser
  });

  return address;
};

const setDefaultAddress = async (customerId, addressId, currentUser) => {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new Error('Customer not found');
  }

  const targetAddr = customer.addresses.id(addressId);
  if (!targetAddr) {
    throw new Error('Address not found');
  }

  customer.addresses.forEach((addr) => {
    if (addr._id.toString() === addressId.toString()) {
      addr.isDefault = true;
      if (addr.addressType === 'billing' || addr.addressType === 'both') {
        customer.billingAddress = addr;
      }
      if (addr.addressType === 'shipping' || addr.addressType === 'both') {
        customer.shippingAddress = addr;
      }
    } else if (addr.addressType === targetAddr.addressType || targetAddr.addressType === 'both') {
      addr.isDefault = false;
    }
  });

  await customer.save();

  await logActivity({
    customerId,
    action: 'DEFAULT_ADDRESS_SET',
    description: `Set ${targetAddr.addressType} address in ${targetAddr.city} as default`,
    performedBy: currentUser
  });

  return targetAddr;
};

const deleteAddress = async (customerId, addressId, currentUser) => {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new Error('Customer not found');
  }

  const addr = customer.addresses.id(addressId);
  if (!addr) {
    throw new Error('Address not found');
  }

  customer.addresses.pull({ _id: addressId });
  await customer.save();

  await logActivity({
    customerId,
    action: 'ADDRESS_DELETED',
    description: `Removed address from customer profile`,
    performedBy: currentUser
  });

  return true;
};

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress
};

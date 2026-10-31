/**
 * Discount Adapter for Quotation Management (M6)
 * Simulates Developer 2's Module M8 (Discount Management)
 */

export const SAMPLE_DISCOUNTS = [
  {
    code: "WELCOME10",
    name: "New Customer Welcome Discount",
    type: "percentage",
    value: 10,
    minOrderValue: 1000,
    maxDiscountLimit: 5000,
    status: "active",
    validUntil: new Date("2028-12-31")
  },
  {
    code: "STARTUP20",
    name: "Early Stage Startup Tier",
    type: "percentage",
    value: 20,
    minOrderValue: 3000,
    maxDiscountLimit: 10000,
    status: "active",
    validUntil: new Date("2028-12-31")
  },
  {
    code: "LAUNCH500",
    name: "Product Launch Voucher",
    type: "fixed",
    value: 500,
    minOrderValue: 1500,
    maxDiscountLimit: 500,
    status: "active",
    validUntil: new Date("2028-12-31")
  },
  {
    code: "ENTERPRISE15",
    name: "Corporate Enterprise Rebate",
    type: "percentage",
    value: 15,
    minOrderValue: 10000,
    maxDiscountLimit: 25000,
    status: "active",
    validUntil: new Date("2028-12-31")
  }
];

export const getAvailableDiscounts = async () => {
  return SAMPLE_DISCOUNTS.filter(d => d.status === "active");
};

export const validateDiscount = async (discountCode, quotationSubtotal) => {
  if (!discountCode) {
    return { valid: true, discount: null, discountAmount: 0 };
  }

  const code = discountCode.toString().trim().toUpperCase();
  const discount = SAMPLE_DISCOUNTS.find(d => d.code === code);

  if (!discount) {
    return { valid: false, message: `Discount coupon '${code}' is invalid or does not exist` };
  }

  if (discount.status !== "active") {
    return { valid: false, message: `Discount coupon '${code}' is no longer active` };
  }

  if (new Date() > new Date(discount.validUntil)) {
    return { valid: false, message: `Discount coupon '${code}' has expired` };
  }

  if (quotationSubtotal < discount.minOrderValue) {
    return {
      valid: false,
      message: `Discount '${code}' requires a minimum subtotal of ₹${discount.minOrderValue} (Current: ₹${quotationSubtotal})`
    };
  }

  let amount = 0;
  if (discount.type === "percentage") {
    amount = (quotationSubtotal * discount.value) / 100;
    if (discount.maxDiscountLimit && amount > discount.maxDiscountLimit) {
      amount = discount.maxDiscountLimit;
    }
  } else if (discount.type === "fixed") {
    amount = Math.min(discount.value, quotationSubtotal);
  }

  amount = Math.round(amount * 100) / 100;

  return {
    valid: true,
    discount: {
      code: discount.code,
      name: discount.name,
      type: discount.type,
      value: discount.value
    },
    discountAmount: amount
  };
};

export default {
  getAvailableDiscounts,
  validateDiscount
};

# M12: Dashboard & Analytics – Module Integration Guide

**Project:** Subscription Management System  
**Hackathon:** Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026  
**Module Owner:** Developer 3  
**Status:** Complete, Independently Runnable, Fully Tested  
**Branch:** `feature/M12-dashboard-analytics`

---

## 1. Executive Summary & Purpose

Module **M12 – Dashboard & Analytics** delivers executive intelligence, financial performance tracking, subscription health metrics, and automated reporting for the Subscription Management System.

Built adhering strictly to the independent development architecture:
- M12 does not own or mutate underlying operational data models (Customers, Products, Subscriptions, Invoices, Payments, Billing Runs).
- All source data is queried via **modular, replaceable adapters** (`backend/src/modules/analytics/adapters/`).
- Adapters support dual-mode execution: seamlessly reading live Mongoose models when present, while utilizing realistic fallback analytics seed fixtures when external team dependencies are offline.
- Calculations strictly distinguish **Invoiced Revenue**, **Gross Collected Revenue**, **Net Collected Revenue**, **Outstanding Receivables**, and **Overdue Amounts**.

---

## 2. Standardized KPI Calculation Formulas

All analytical calculations are encapsulated in [`analyticsCalculationService.js`](file:///c:/Users/lenovo/Desktop/Sunscription%20Management%20System/backend/src/modules/analytics/services/analyticsCalculationService.js):

| Metric | Formula | Edge Case Handling |
| :--- | :--- | :--- |
| **Percentage Change** | `((current - previous) / previous) * 100` | If `previous === 0` and `current > 0`, yields `+100%`. If both are `0`, yields `0%`. Formatted to 2 decimal places. |
| **Gross Collected Revenue** | `Sum of all successful/recorded payments` | Excludes failed or cancelled transactions. |
| **Net Collected Revenue** | `Gross Collected Revenue - Processed Refunds` | Reflects true net cash inflow. |
| **Invoiced Revenue** | `Sum of all issued invoice grand totals` | Draft invoices excluded; represents billed receivables. |
| **Outstanding Amount** | `Sum of unpaid balances on pending invoices` | `grandTotal - amountPaid`. |
| **Overdue Amount** | `Sum of balances on invoices past due date` | Based on `invoice.dueDate < now` and `status === 'unpaid' \|\| 'partial'`. |
| **Customer Churn Rate** | `(cancelledSubscriptions / totalBase) * 100` | `totalBase = active + cancelled + paused + expired`. If `totalBase === 0`, returns `0%`. |
| **Customer Retention Rate** | `(activeSubscriptions / totalBase) * 100` | Inverse of churn base; captures active renewals. |
| **Billing Success Rate** | `(successfulRuns / totalRuns) * 100` | Monitored from M9 recurring billing runs. |
| **Quotation Conversion Rate** | `(convertedQuotations / totalQuotations) * 100` | Tracks sales quote pipeline to subscription activation. |

---

## 3. Replaceable Adapter Architecture

M12 relies on 9 dedicated adapters located in `backend/src/modules/analytics/adapters/`:

```
backend/src/modules/analytics/adapters/
├── authAdapter.js                   # JWT verification + RBAC header simulation ('admin'|'staff'|'customer')
├── customerAnalyticsAdapter.js      # Customer counts, growth timeline, and B2B vs B2C segmentation
├── productAnalyticsAdapter.js       # Product catalog performance, subscription density, revenue share %
├── planAnalyticsAdapter.js          # Plan tier breakdown and pricing distributions
├── quotationAnalyticsAdapter.js     # Quotation pipeline status and conversion rates
├── subscriptionAnalyticsAdapter.js  # Subscription lifecycle states, churn metrics, cohort timelines
├── discountAnalyticsAdapter.js      # Discount campaign redemptions and customer savings
├── billingAnalyticsAdapter.js       # M9 BillingEngine integration: schedule counts, execution runs
├── invoiceAnalyticsAdapter.js       # M10 Invoicing integration: invoiced revenue, tax breakdown (CGST/SGST/IGST)
└── paymentAnalyticsAdapter.js       # M11 Payment integration: collections, refund deductions, payment methods
```

### Final Integration Replacement Guide

When integrating with Developer 1 (Customers, Products, Plans, Quotations) and Developer 2 (Subscriptions, Discounts):
1. **Developer 1 Models:** Update `customerAnalyticsAdapter.js`, `productAnalyticsAdapter.js`, `planAnalyticsAdapter.js`, and `quotationAnalyticsAdapter.js` to query Developer 1's live Mongoose models (e.g., `Customer.aggregate(...)`, `Product.aggregate(...)`).
2. **Developer 2 Models:** Update `subscriptionAnalyticsAdapter.js` and `discountAnalyticsAdapter.js` to query Developer 2's `Subscription` and `Discount` models.
3. **Developer 3 Models:** `billingAnalyticsAdapter.js`, `invoiceAnalyticsAdapter.js`, and `paymentAnalyticsAdapter.js` already possess direct live connections to M9 (`BillingSchedule`, `BillingRun`), M10 (`Invoice`), and M11 (`Payment`, `Refund`, `BankTransaction`) models with automated fallback safety.

---

## 4. API Endpoints Catalog

### Dashboard Executive Endpoints (`/api/dashboard`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/overview` | Admin, Staff | Primary executive KPI overview with period comparisons |
| `GET` | `/api/dashboard/revenue-summary` | Admin, Staff | High-level collected vs invoiced revenue summary |
| `GET` | `/api/dashboard/customer-summary` | Admin, Staff | Total, active, and new customer acquisitions |
| `GET` | `/api/dashboard/subscription-summary` | Admin, Staff | Active subscriptions, churn velocity, and retention rate |
| `GET` | `/api/dashboard/operational-summary` | Admin, Staff | Billing runs, overdue invoices, and reconciliation status |
| `GET` | `/api/dashboard/preferences` | Admin, Staff | User widget visibility preferences |
| `PUT` | `/api/dashboard/preferences` | Admin, Staff | Update dashboard widget visibility layout |

### Section Analytics Endpoints (`/api/analytics`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/revenue/trends` | Admin, Staff | Monthly revenue timeline (invoiced, collected, net) |
| `GET` | `/api/analytics/revenue/by-product` | Admin, Staff | Revenue distribution per catalog product |
| `GET` | `/api/analytics/revenue/by-plan` | Admin, Staff | Revenue split across subscription pricing tiers |
| `GET` | `/api/analytics/revenue/comparison` | Admin, Staff | Current vs previous period percentage change |
| `GET` | `/api/analytics/customers/growth` | Admin, Staff | Monthly customer acquisition bar timeline |
| `GET` | `/api/analytics/customers/distribution` | Admin, Staff | B2B (Corporate) vs B2C (Individual) segmentation |
| `GET` | `/api/analytics/subscriptions/growth` | Admin, Staff | New activations vs churned cancellations timeline |
| `GET` | `/api/analytics/subscriptions/status` | Admin, Staff | Subscription contract state counts (active, paused, etc.) |
| `GET` | `/api/analytics/subscriptions/churn` | Admin, Staff | Churn rate and retention percentage metrics |
| `GET` | `/api/analytics/products/performance` | Admin, Staff | Comprehensive product ranking matrix & ARPU |
| `GET` | `/api/analytics/payments/methods` | Admin, Staff | Payment gateway rail distribution (Stripe, Razorpay, etc.) |
| `GET` | `/api/analytics/invoices/tax` | Admin only | GST liability breakdown (CGST, SGST, IGST) |

### Report Export Endpoints (`/api/reports`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/export/:type` | Admin only | Stream dynamic CSV file (`revenue`, `customers`, `subscriptions`, `invoices`, `payments`) |
| `GET` | `/api/reports/history` | Admin only | Audit log of previously generated analytical reports |

---

## 5. Role-Based Access Control (RBAC) Matrix

| Endpoint Group | Admin | Staff | Customer |
| :--- | :---: | :---: | :---: |
| `/api/dashboard/overview` | ✅ Allowed | ✅ Allowed | ❌ 403 Forbidden |
| `/api/analytics/*` (General) | ✅ Allowed | ✅ Allowed | ❌ 403 Forbidden |
| `/api/analytics/invoices/tax` | ✅ Allowed | ❌ 403 Forbidden | ❌ 403 Forbidden |
| `/api/reports/export/*` | ✅ Allowed | ❌ 403 Forbidden | ❌ 403 Forbidden |
| `/api/reports/history` | ✅ Allowed | ❌ 403 Forbidden | ❌ 403 Forbidden |

---

## 6. Frontend Visualization & Pages

The frontend is implemented in React with **Recharts** and Tailwind CSS:

1. **Executive Dashboard (`/admin/dashboard`):**
   - KPI Cards: Net Revenue, Active Subscriptions, Churn Rate, Outstanding Balance.
   - Interactive Recharts Area Chart for revenue trajectories.
   - Monthly customer acquisition bar chart.
   - Subscription lifecycle donut chart.
   - Payment method progress distribution.
   - Quick CSV download triggers with toast alerts.
2. **Revenue Analytics (`/admin/analytics/revenue`):**
   - Revenue trajectory timeline.
   - Product revenue horizontal bar chart.
   - Plan tier progression bars.
   - Indian GST tax compliance panel (CGST, SGST, IGST).
3. **Customer Analytics (`/admin/analytics/customers`):**
   - Growth metrics and month-over-month rate.
   - B2B Corporate vs B2C Individual segmentation donut.
4. **Subscription Analytics (`/admin/analytics/subscriptions`):**
   - Churn rate card with benchmark alerts.
   - Retention cohort visualization.
   - State breakdown (active, trial, paused, cancelled, expired).
5. **Product Analytics (`/admin/analytics/products`):**
   - Catalog revenue share pie chart.
   - Unit economics table with ARPU, subscriber density, and SKU indexing.

---

## 7. Verification & Testing

### 1. Run Seed Script
```bash
cd backend
npm run seed:m12
```
Populates default dashboard preferences and initial report audit logs.

### 2. Run Test Suite
```bash
cd backend
npm test
```
Executes all 5 test suites across modules:
- `analytics.test.js` (19 tests)
- `paymentAndReconciliation.test.js` (21 tests)
- `billingEngine.test.js` (19 tests)
- `invoiceApi.test.js` (14 tests)
- `taxCalculation.test.js` (10 tests)
**Result:** 83 tests passing, 0 failures.

### 3. Verify Production Frontend Build
```bash
cd frontend
npm run build
```
Builds cleanly with zero Vite/Rollup errors.

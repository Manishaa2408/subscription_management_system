# M9 – Recurring Billing & Invoice Generation Engine
## Integration Contract Document
### Brightloop Subscription Management System — Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026

---

## 1. Module Overview

**Module:** M9 – Recurring Billing & Invoice Generation Engine  
**Developer:** Developer 3  
**Branch:** `feature/M9-recurring-billing-engine`  
**Status:** Complete (standalone, independently runnable, fully tested)

M9 is responsible for automated recurring billing schedule management, due date calculations, eligibility checks, automated cron & manual billing execution batches, invoice-generation payload construction, idempotency enforcement, and retry processing.

---

## 2. Module Ownership & Boundaries

| Module | Ownership Scope |
|---|---|
| **M7** | Subscription lifecycle, status (`active`, `paused`, `cancelled`, `expired`), start and end dates. Authoritative source for subscription states. |
| **M9** | Recurring billing schedules, due date processing, billing runs, billing execution tracking, idempotency enforcement, and invoice payload dispatch. |
| **M10** | Official invoice records, sequential numbering (`INV-YYYY-XXXX`), line-item tax calculations (CGST/SGST/IGST), and invoice lifecycle. |
| **M11** | Payment recording, payment verification, payment receipts (`REC-YYYY-XXXX`), and bank reconciliation. |
| **M12** | Business telemetry, executive dashboard, MRR, ARR, churn analytics. Consumes summaries from M9, M10, and M11. |

> **Critical Rule:** M9 **never** calculates taxes (GST) and **never** creates permanent duplicate official invoice records. M9 dispatches a validated billing payload to M10 via the replaceable `invoiceAdapter.js`.

---

## 3. Architecture & File Structure

```
backend/src/modules/billing/
├── adapters/
│   ├── authAdapter.js           # JWT & Dev persona header auth (admin, staff, customer)
│   ├── customerAdapter.js       # Customer lookup & validation (M2 contract)
│   ├── planAdapter.js           # Daily, weekly, monthly, yearly plans (M4 contract)
│   ├── productAdapter.js        # Product metadata (M3 contract)
│   ├── subscriptionAdapter.js   # Isolated due & candidate subscriptions (M7 contract)
│   └── invoiceAdapter.js        # Smart M10 invoice dispatch & idempotency check
├── models/
│   ├── BillingSchedule.js       # Subscription recurring frequency & cycle periods
│   ├── BillingRun.js            # Batch execution runs (RUN-YYYY-XXXX)
│   ├── BillingExecution.js      # Individual subscription billing with unique idempotencyKey
│   ├── BillingAttempt.js        # Retries & execution attempt history
│   ├── BillingLog.js            # Engine audit logs and telemetry
│   └── BillingSequence.js       # Atomic sequence counter for run numbers
├── services/
│   ├── billingScheduleService.js    # Deterministic date & period calculation engine
│   ├── billingEligibilityService.js # Active, customer, plan, date eligibility validator
│   ├── invoicePayloadBuilder.js     # Standardized M9 -> M10 payload constructor
│   ├── billingIdempotencyService.js # Unique key generator & atomic reservation
│   ├── billingRetryService.js       # Exponential backoff retry scheduler
│   ├── recurringBillingEngine.js    # Core batch & single subscription runner
│   └── billingHistoryService.js     # History, failed, KPI telemetry queries
├── scheduler/
│   └── billingScheduler.js          # Automated node-cron runner with concurrency locking
├── controllers/
│   ├── billingController.js
│   └── billingRunController.js
├── routes/
│   ├── billingRoutes.js             # /api/billing
│   └── billingRunRoutes.js          # /api/billing/runs
├── seeds/
│   └── billingSeed.js               # npm run seed:m9
└── tests/
    └── billingEngine.test.js        # 26 automated unit & integration tests

frontend/src/
├── services/
│   └── billingApi.js                # Frontend API client
└── modules/billing/pages/
    ├── BillingDashboard.jsx         # Executive overview, Run Billing Now, due preview
    ├── BillingScheduleList.jsx      # Filterable recurring schedules
    ├── BillingScheduleDetails.jsx   # Cycle spec & subscription execution tree
    ├── BillingRuns.jsx              # Batch runs listing
    ├── BillingRunDetails.jsx        # Detailed run breakdown & logs
    ├── FailedBillings.jsx           # Exceptions, retry schedules & single-click retry
    └── BillingHistory.jsx           # Complete searchable execution history
```

---

## 4. REST API Reference

Base URL: `http://localhost:5000/api/billing`

### 4.1 Schedule APIs
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/billing/schedules` | Admin | Create/initialize recurring schedule |
| `GET` | `/api/billing/schedules` | Admin, Staff | List schedules (filters, pagination) |
| `GET` | `/api/billing/schedules/due` | Admin, Staff | List subscriptions currently due |
| `GET` | `/api/billing/schedules/:id` | Admin, Staff | Get schedule details |
| `PUT` | `/api/billing/schedules/:id` | Admin | Update interval, amount, or status |

### 4.2 Execution APIs
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/billing/run` | Admin | Trigger manual billing run |
| `POST` | `/api/billing/subscriptions/:subscriptionId/process` | Admin | Process single subscription billing |
| `GET` | `/api/billing/subscriptions/:subscriptionId/history` | Admin, Staff | Subscription billing history |

### 4.3 Billing Run APIs
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/billing/runs` | Admin, Staff | List historical billing runs |
| `GET` | `/api/billing/runs/:id` | Admin, Staff | Detailed run breakdown & executions |
| `POST` | `/api/billing/runs/:id/retry` | Admin | Batch retry failed subscriptions in a run |

### 4.4 Monitoring & Telemetry APIs
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/billing/history` | Admin, Staff | Audit trail of all executions |
| `GET` | `/api/billing/failed` | Admin, Staff | Failed and retry-scheduled executions |
| `GET` | `/api/billing/summary` | Admin, Staff | KPI metrics (counts, volume, frequency breakdown) |
| `GET` | `/api/billing/status` | Admin | Engine and cron scheduler state |

---

## 5. Date Calculation Policies

All calculations are deterministic and executed in UTC to eliminate daylight savings skew.

### 5.1 Frequencies & Formulas
- **Daily:** `next = baseDate + interval (days)`
- **Weekly:** `next = baseDate + (interval * 7) (days)`
- **Monthly:** Advances month by `interval`. Clamps day to the maximum number of days in the target month:
  - *Example:* Jan 31 + 1 month in non-leap year (2026) &rarr; **Feb 28**.
  - *Example:* Jan 31 + 1 month in leap year (2024) &rarr; **Feb 29**.
  - *Example:* Mar 31 + 1 month &rarr; **Apr 30**.
- **Yearly:** Advances year by `interval`.
  - *Leap Year Policy:* Feb 29 2024 + 1 year &rarr; **Feb 28 2025**.

### 5.2 Billing Period Formula
For any `periodStart`:
- `startDate` = `new Date(periodStart)`
- `endDate` = `calculateNextBillingDate(periodStart) - 1 ms`
This guarantees continuous, non-overlapping periods.

---

## 6. Idempotency & Duplicate Billing Prevention

Duplicate invoice generation is prevented at multiple architectural layers:

1. **Deterministic Idempotency Key:**
   ```
   IDEMP_{cleanSubId}_{YYYYMMDD_start}_{YYYYMMDD_end}
   Example: IDEMP_SUB-2026-0001_20261001_20261031
   ```
2. **MongoDB Unique Index:**
   The `BillingExecution` collection enforces `unique: true` on `idempotencyKey`.
3. **Atomic Reservation:**
   Before creating an invoice, M9 attempts to insert the `BillingExecution` in `'processing'` state.
   - If already `'success'`: Skipped (`already_completed`).
   - If already `'processing'`: Skipped (`concurrent_processing`).
   - If concurrent race occurs: MongoDB code `11000` catches the collision and prevents dual processing.
4. **M10 Timeout Safe-Query:**
   If M10 times out or fails, M9 queries `invoiceAdapter.getInvoiceBySourceReference(sourceReference)` before retrying to prevent orphaned duplicates.

---

## 7. Retry & Failure Handling

When a billing attempt fails (e.g., temporary M10 timeout or network glitch):
1. **Attempt Recording:** Every try is persisted in `BillingAttempt` with attempt number, timestamp, error, and reference.
2. **Exponential Backoff:**
   - Attempt 1: +5 minutes
   - Attempt 2: +15 minutes
   - Attempt 3: +60 minutes
   - Attempt 4+: +180 minutes (Capped at `BILLING_MAX_RETRIES = 3`)
3. **Permanent Failure:** After max retries, execution is marked `'failed'` requiring administrative manual review.
4. **Preservation:** The original `idempotencyKey` and `sourceReference` are preserved across retries.

---

## 8. M10 Invoice Generation Payload Contract

Sent to M10 via `invoiceAdapter.createInvoiceFromBillingPayload(payload)`:

```json
{
  "sourceReference": "BILL-SUB20260001-20261001",
  "idempotencyKey": "IDEMP_SUB-2026-0001_20261001_20261031",
  "source": "M9_RECURRING_BILLING",
  "subscriptionId": "sub_active_due_monthly_01",
  "customerId": "cust_001_intra_kerala",
  "planId": "plan_starter_monthly_03",
  "productId": "prod_bright_core",
  "billingPeriod": {
    "startDate": "2026-10-01T00:00:00.000Z",
    "endDate": "2026-10-31T23:59:59.999Z"
  },
  "items": [
    {
      "itemType": "plan",
      "itemId": "plan_starter_monthly_03",
      "itemName": "Brightloop Starter Monthly",
      "description": "Recurring monthly billing cycle (01/10/2026 to 31/10/2026)",
      "quantity": 1,
      "unitPrice": 3300
    }
  ],
  "currency": "INR",
  "issueDate": "2026-10-31T20:00:00.000Z"
}
```

### Expected Response from M10
```json
{
  "success": true,
  "invoiceId": "inv_6723b...",
  "invoiceNumber": "INV-2026-0042",
  "sourceReference": "BILL-SUB20260001-20261001"
}
```

---

## 9. Integration Replacement Instructions

| Adapter File | Temporary Mock / Standalone | Replace At Final Integration With |
|---|---|---|
| `adapters/authAdapter.js` | JWT verification + `x-mock-role` header | M1 shared auth middleware (`req.user.id`, `req.user.role`, `req.user.email`) |
| `adapters/customerAdapter.js` | 4 in-memory customer personas | M2 Customer Service (`customerService.getCustomerById(id)`) |
| `adapters/planAdapter.js` | 6 in-memory plan tiers (daily to yearly) | M4 Plan Service (`planService.getPlanById(id)`) |
| `adapters/productAdapter.js` | 2 in-memory products | M3 Product Service (`productService.getProductById(id)`) |
| `adapters/subscriptionAdapter.js` | Live in-memory subscription repository | M7 Subscription Service (`subscriptionService.getDueSubscriptions()`) |
| `adapters/invoiceAdapter.js` | Mock repository + live Mongoose model check | Direct M10 Invoice Service (`invoiceService.createFromBillingPayload(payload)`) |

---

## 10. Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/subscription_management
JWT_SECRET=development_brightloop_secret_2026_m10
NODE_ENV=development

# M9 Scheduler Configuration
BILLING_SCHEDULER_ENABLED=false     # Set to true in production
BILLING_CRON_EXPRESSION=0 0 * * *   # Midnight every day
BILLING_TIMEZONE=Asia/Kolkata
BILLING_MAX_RETRIES=3
BILLING_RETRY_BASE_DELAY_MINUTES=5
```

---

## 11. Running & Testing M9

```powershell
# 1. Seed M9 database
cd backend
npm run seed:m9

# 2. Run all unit and integration tests (64 passing)
npm test

# 3. Start Backend server
npm start

# 4. Start Frontend
cd ../frontend
npm run dev
```
Navigate to: `http://localhost:5173/admin/billing`

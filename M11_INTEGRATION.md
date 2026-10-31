# M11 – Payment & Reconciliation Management
## Integration Contract Document
### Brightloop Subscription Management System — Odoo x Make-A-Ton 9.0 Hackathon 2026

---

## 1. Module Overview

**Module:** M11 – Payment & Reconciliation Management  
**Developer:** Developer 3  
**Branch:** `feature/M11-payment-reconciliation-management`  
**Status:** Complete (standalone, independently runnable)

M11 manages the full lifecycle of customer payments: recording, verification, receipt generation, bank reconciliation, refund tracking, and invoice payment synchronisation.

---

## 2. Architecture

```
backend/src/modules/payments/
├── adapters/           ← Replaceable integration adapters
│   ├── authAdapter.js
│   ├── customerAdapter.js
│   ├── invoiceAdapter.js        ← Smart dual-mode: real DB → seed fallback
│   ├── billingAdapter.js
│   └── paymentGatewayAdapter.js
├── models/
│   ├── Payment.js
│   ├── PaymentReceipt.js
│   ├── BankTransaction.js
│   ├── Reconciliation.js
│   ├── Refund.js
│   └── PaymentSequence.js
├── services/
│   ├── paymentService.js
│   ├── receiptService.js
│   ├── reconciliationService.js
│   ├── autoMatchingService.js
│   ├── refundService.js
│   ├── paymentSequenceService.js
│   ├── paymentAllocationService.js
│   └── invoicePaymentSyncService.js
├── controllers/
│   ├── paymentController.js
│   ├── receiptController.js
│   ├── reconciliationController.js
│   └── refundController.js
├── routes/
│   ├── paymentRoutes.js
│   ├── receiptRoutes.js
│   ├── reconciliationRoutes.js
│   └── refundRoutes.js
├── seeds/paymentSeed.js
└── tests/paymentAndReconciliation.test.js

frontend/src/
├── modules/payments/pages/
│   ├── PaymentList.jsx
│   ├── RecordPayment.jsx
│   ├── PaymentDetails.jsx
│   ├── PaymentReceipt.jsx
│   └── CustomerPaymentHistory.jsx
├── modules/reconciliation/pages/
│   └── ReconciliationDashboard.jsx
├── modules/refunds/pages/
│   └── RefundList.jsx
└── services/paymentApi.js
```

---

## 3. REST API Endpoints

**Base URL:** `http://localhost:5000`

### 3.1 Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/payments` | admin/staff | Record a new payment |
| `GET` | `/api/payments` | admin/staff | List all payments (paginated, filtered) |
| `GET` | `/api/payments/my` | customer | Customer's own payments |
| `GET` | `/api/payments/:id` | any | Get payment by ID |
| `PATCH` | `/api/payments/:id/verify` | admin/staff | Verify a pending payment → completed |
| `PATCH` | `/api/payments/:id/fail` | admin/staff | Mark a pending payment → failed |
| `GET` | `/api/payments/dev/invoices` | any | Dev helper: get available invoices for dropdown |
| `GET` | `/api/payments/invoice/:invoiceId/summary` | admin/staff | Invoice payment summary |
| `GET` | `/api/payments/analytics/summary` | admin | Analytics for M12 dashboard |

### 3.2 Receipts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/receipts/:id` | any | Get receipt by ID |
| `GET` | `/api/receipts/:id/print` | any | Printable receipt |
| `GET` | `/api/receipts/payment/:paymentId` | any | Get receipt by payment ID |

### 3.3 Reconciliation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/reconciliation/import` | admin | Import bank transactions (JSON array) |
| `GET` | `/api/reconciliation/transactions` | admin | All bank transactions |
| `GET` | `/api/reconciliation/unmatched` | admin | Unmatched transactions only |
| `GET` | `/api/reconciliation/matches` | admin | Reconciled matches |
| `POST` | `/api/reconciliation/auto-match` | admin | Run auto-matching engine |
| `POST` | `/api/reconciliation/manual-match` | admin | Manual match: `{bankTransactionId, paymentId, notes}` |
| `GET` | `/api/reconciliation/summary` | admin | Reconciliation summary stats |

### 3.4 Refunds

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/refunds` | admin/staff | Issue a refund |
| `GET` | `/api/refunds` | admin/staff | List all refunds |
| `GET` | `/api/refunds/:id` | admin/staff | Get refund by ID |

---

## 4. Data Models

### Payment
```json
{
  "paymentReference": "PAY-2026-0001",
  "invoiceId": "ObjectId | string",
  "customerId": "string",
  "amount": 5900.00,
  "paymentMethod": "upi | bank_transfer | card | cash | cheque | other",
  "status": "pending | completed | failed | cancelled | refunded | partially_refunded",
  "transactionReference": "UTR12345678",
  "paymentDate": "2026-10-01T00:00:00.000Z",
  "bankDetails": { "bankName": "HDFC", "accountLast4": "1234" },
  "reconciliationStatus": "unmatched | matched",
  "refundedAmount": 0,
  "notes": "optional"
}
```

### PaymentReceipt
```json
{
  "receiptNumber": "REC-2026-0001",
  "paymentId": "ObjectId",
  "paymentReference": "PAY-2026-0001",
  "invoiceId": "string",
  "customerId": "string",
  "amount": 5900.00,
  "paymentMethod": "upi",
  "issuedAt": "2026-10-01T10:00:00.000Z"
}
```

### BankTransaction
```json
{
  "transactionId": "HDFC-TXN-001",
  "transactionDate": "2026-10-01T00:00:00.000Z",
  "description": "UPI Credit - PAY-2026-0001",
  "creditAmount": 5900.00,
  "debitAmount": 0,
  "reference": "PAY-2026-0001",
  "reconciliationStatus": "unmatched | matched | discrepancy | ignored",
  "matchedPaymentId": null
}
```

### Refund
```json
{
  "refundReference": "REF-2026-0001",
  "paymentId": "ObjectId",
  "amount": 1000.00,
  "reason": "Customer cancelled subscription",
  "status": "pending | completed | failed | cancelled",
  "notes": "optional"
}
```

---

## 5. Authentication

M11 uses the same JWT auth adapter as M10.

**Development tokens** (for testing without a login UI):
```
Admin:   POST /api/payments/dev/token { "role": "admin" }
Staff:   POST /api/payments/dev/token { "role": "staff" }
Customer: POST /api/payments/dev/token { "role": "customer", "userId": "cust_001" }
```

Or use the Navbar role-switcher which sets `X-Dev-User` header automatically.

---

## 6. Integration Contracts

### 6.1 What M11 Needs from M9 (Recurring Billing)

> **Currently handled by:** `billingAdapter.js` stub

| Field | Expected source |
|-------|----------------|
| Invoice IDs of recurring invoices | M9's Invoice model / `GET /api/billing/invoices` |

**Integration step:** Replace `billingAdapter.js` with a real HTTP call to M9's API.

---

### 6.2 What M11 Needs from M10 (Invoice & Tax)

> **Currently handled by:** `invoiceAdapter.js` (smart dual-mode)

| Operation | M10 Contract |
|-----------|-------------|
| Get invoice by ID | `GET /api/invoices/:id` → `{ _id, invoiceNumber, totalAmount, status, customerId, paidAmount }` |
| Update payment summary | `PATCH /api/invoices/:id/payment-summary` → `{ paidAmount, paymentStatus, outstandingAmount }` |
| List invoices | `GET /api/invoices?status=sent,overdue` |

**Integration step:** When M10 is running, the `invoiceAdapter` automatically uses the real `Invoice` Mongoose model (same MongoDB connection). No code change needed — just ensure both modules share the same `mongoose` connection.

---

### 6.3 What M12 (Dashboard & Analytics) Gets from M11

> **Endpoint:** `GET /api/payments/analytics/summary`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCollected": 29500,
    "pendingAmount": 11800,
    "refundedAmount": 0,
    "failedCount": 1,
    "completedCount": 4,
    "pendingCount": 1,
    "refundedCount": 0,
    "methodBreakdown": {
      "upi": 2,
      "bank_transfer": 1,
      "card": 1
    },
    "period": { "from": null, "to": null }
  }
}
```

---

## 7. Payment Status Flow

```
pending ──verify──► completed ──partial refund──► partially_refunded
   │                    │                              │
   └──fail──► failed    └──full refund──► refunded ◄──┘

cancelled (direct)
```

**Reconciliation Status Flow:**
```
unmatched ──auto/manual match──► matched
unmatched ──discrepancy found──► discrepancy ──resolve──► matched / ignored
```

---

## 8. GST / Tax Notes

M11 does **not** perform tax calculations. Tax is calculated by M10 and baked into the invoice `totalAmount`. Payments are made against the total invoice amount.

---

## 9. Seed Data

Run: `npm run seed:m11` from `backend/`

Seeds:
- **6 payments** (PAY-2026-0001 to PAY-2026-0006) across 4 customers, all methods
- **4 receipts** (REC-2026-0001 to REC-2026-0004) for completed payments
- **5 bank transactions** (1 pre-matched, 1 exact-ref candidate, 1 discrepancy, 1 unmatched credit, 1 debit fee)

---

## 10. Running M11 Independently

```powershell
# Backend
cd backend
npm run seed:m11
npm start
# Server on http://localhost:5000

# Frontend
cd frontend
npm run dev
# UI on http://localhost:5173

# Tests
cd backend
npm test
```

**Frontend Routes:**
| Route | Page |
|-------|------|
| `/admin/payments` | Payment list + analytics |
| `/admin/payments/create` | Record payment |
| `/admin/payments/:id` | Payment details + actions |
| `/admin/payments/receipt/:id` | Printable receipt |
| `/admin/reconciliation` | Bank reconciliation dashboard |
| `/admin/refunds` | Refunds list + issue refund |
| `/customer/payments` | Customer's payment history |

---

## 11. Environment Variables

```env
MONGODB_URI=mongodb://127.0.0.1:27017/subscription_management
JWT_SECRET=development_brightloop_secret_2026_m10
PORT=5000
NODE_ENV=development
```

---

## 12. Known Temporary Implementations (to replace at integration)

| File | What it does | Replace with |
|------|-------------|-------------|
| `adapters/authAdapter.js` | JWT decode + mock header auth | Shared auth middleware from M1/M2 |
| `adapters/customerAdapter.js` | 4 hardcoded seed customers | Real customer DB (M1/M2) |
| `adapters/invoiceAdapter.js` | Falls back to seed invoices if M10 not connected | Will auto-use M10 real DB when connected |
| `adapters/billingAdapter.js` | Empty stub | M9 billing API |
| `adapters/paymentGatewayAdapter.js` | Mock gateway responses | Real payment gateway (Razorpay/Stripe) |

# Brightloop Subscription Management System

**Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026**

A full-stack MERN application for end-to-end subscription lifecycle management — from customer onboarding through recurring billing, invoicing, payment reconciliation, and executive analytics.

---

## 🏗️ Architecture Overview

```
Brightloop Subscription Management System
├── backend/          Node.js + Express + MongoDB (REST API)
└── frontend/         React + Vite + Tailwind CSS
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, Recharts |
| Backend | Node.js 22, Express.js, JWT Auth, REST API |
| Database | MongoDB + Mongoose ODM |
| Testing | Jest, Supertest, mongodb-memory-server |
| DevOps | Git, GitHub, npm |

---

## 👥 Team & Module Ownership

| Developer | Modules |
|-----------|---------|
| Developer 1 | M1 Auth/RBAC, M2 Customer, M3 Products, M4 Plans |
| Developer 2 | M5 Quotation Templates, M6 Quotations, M7 Subscriptions, M8 Discounts |
| Developer 3 | M9 Recurring Billing, M10 Invoice/Tax, M11 Payments/Reconciliation, M12 Dashboard/Analytics |

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18 (tested on v22.21.1)
- MongoDB running locally on `mongodb://127.0.0.1:27017`
- npm >= 9

### 1. Clone & Environment Setup

```bash
git clone https://github.com/Manishaa2408/subscription_management_system.git
cd subscription_management_system
git checkout integration/final-end-to-end-integration
```

Create your `.env` file in `backend/`:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values:

```env
# Application
NODE_ENV=development
PORT=5000

# MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/subscription_management

# JWT (generate strong secrets for production)
JWT_SECRET=your_jwt_secret_here_min_32_chars
JWT_EXPIRE=30d
JWT_REFRESH_SECRET=your_refresh_secret_here_min_32_chars
JWT_REFRESH_EXPIRE=7d

# Cookie
COOKIE_SECRET=your_cookie_secret_here

# Company (M10 Tax Engine)
COMPANY_NAME=Brightloop Software
COMPANY_GSTIN=32AABCB1234D1Z8
COMPANY_STATE=Kerala
COMPANY_EMAIL=billing@brightloop.io
```

### 2. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 3. Seed Demo Data

Run these scripts from `backend/` in order:

```bash
cd backend

# 1. Create admin user (admin@brightloop.com / Admin@123)
node scripts/seedAdmin.js

# 2. Seed product catalog
node scripts/seedDevelopmentCatalog.js

# 3. Seed quotation data (requires catalog)
node scripts/seedQuotations.js

# 4. Seed subscriptions (requires quotations)
node scripts/seedSubscriptions.js

# 5. Seed discount campaigns
node scripts/seedDiscounts.js
```

### 4. Start the Application

Open two terminals:

**Terminal 1 — Backend (port 5000)**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend (port 5173)**
```bash
cd frontend
npm run dev
```

Open your browser at **http://localhost:5173**

---

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@brightloop.com | Admin@123 |
| Staff | staff@brightloop.com | Staff@123 |
| Customer | customer@brightloop.com | Customer@123 |

> The frontend includes a **Role Switcher** banner at the top for quick persona switching during demos — no logout needed.

---

## 🧪 Running Tests

### Jest Unit & Integration Tests (83 tests)

```bash
cd backend
npm test
```

Expected output:
```
Test Suites: 5 passed, 5 total
Tests:       83 passed, 83 total
```

### Standalone Module Tests

```bash
cd backend

# M1 - Authentication (42 tests)
node tests/m1_test.js

# M2 - Customer Management (42 tests)
node tests/m2_test.js

# M6 - Quotation Engine (24 tests)
node scripts/runM6Tests.js

# M7 - Subscription Lifecycle (24 tests)
node scripts/runM7Tests.js

# M8 - Discount Engine (36 tests)
node scripts/runM8Tests.js
```

### End-to-End Integration Test (19 assertions)

Validates the complete business workflow across all 12 modules:

```bash
cd backend
node scripts/runEndToEndWorkflowTest.js
```

Expected output:
```
FINAL INTEGRATION TEST RESULT: 19 PASSED, 0 FAILED
ALL 12 MODULES VALIDATED IN COMPLETE END-TO-END FLOW
```

### Frontend Build Verification

```bash
cd frontend
npm run build
# Expected: 2350+ modules, zero errors
```

---

## 📡 API Endpoints

All APIs are prefixed with `/api` and served from port 5000.

### Health Check
```
GET /api/health
```

### M1 – Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/refresh
```

### M2 – Customer Management
```
GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PUT    /api/customers/:id
DELETE /api/customers/:id
GET    /api/customers/profile/me
PUT    /api/customers/profile/me
```

### M3 – Product Catalog
```
GET    /api/products
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id
```

### M4 – Subscription Plans
```
GET    /api/plans
POST   /api/plans
GET    /api/plans/:id
PUT    /api/plans/:id
DELETE /api/plans/:id
```

### M5 – Quotation Templates
```
GET    /api/quotation-templates
POST   /api/quotation-templates
GET    /api/quotation-templates/:id
PUT    /api/quotation-templates/:id
DELETE /api/quotation-templates/:id
```

### M6 – Quotations
```
GET    /api/quotations
POST   /api/quotations
GET    /api/quotations/:id
PUT    /api/quotations/:id
POST   /api/quotations/:id/send
POST   /api/quotations/:id/accept
POST   /api/quotations/:id/reject
POST   /api/quotations/:id/convert
```

### M7 – Subscription Lifecycle
```
GET    /api/subscriptions
POST   /api/subscriptions
GET    /api/subscriptions/:id
PUT    /api/subscriptions/:id
POST   /api/subscriptions/:id/pause
POST   /api/subscriptions/:id/resume
POST   /api/subscriptions/:id/cancel
```

### M8 – Discount Engine
```
GET    /api/discounts
POST   /api/discounts
GET    /api/discounts/:id
PUT    /api/discounts/:id
POST   /api/discounts/validate
POST   /api/discounts/:id/archive
```

### M9 – Recurring Billing
```
GET  /api/billing/schedules
GET  /api/billing/schedules/:id
POST /api/billing/run
GET  /api/billing/runs
GET  /api/billing/runs/:id
POST /api/billing/runs/:id/retry
```

### M10 – Invoice & Tax Management
```
GET    /api/invoices
POST   /api/invoices
GET    /api/invoices/:id
PUT    /api/invoices/:id
POST   /api/invoices/:id/issue
POST   /api/invoices/:id/cancel
GET    /api/invoices/:id/pdf
POST   /api/tax/calculate
GET    /api/tax/rates
```

### M11 – Payments & Reconciliation
```
GET    /api/payments
POST   /api/payments
GET    /api/payments/:id
GET    /api/payments/:id/receipt
POST   /api/reconciliation/run
GET    /api/reconciliation/status
POST   /api/refunds
GET    /api/refunds
GET    /api/refunds/:id
```

### M12 – Dashboard & Analytics
```
GET /api/analytics/overview
GET /api/analytics/revenue
GET /api/analytics/customers
GET /api/analytics/subscriptions
GET /api/analytics/billing
GET /api/analytics/products
```

---

## 📊 Database Models

| Module | Model | Collection |
|--------|-------|-----------|
| M1 | User | users |
| M2 | Customer | customers |
| M3 | Product | products |
| M4 | SubscriptionPlan | subscriptionplans |
| M5 | QuotationTemplate | quotationtemplates |
| M6 | Quotation | quotations |
| M7 | Subscription | subscriptions |
| M8 | Discount | discounts |
| M9 | BillingSchedule | billingschedules |
| M9 | BillingRun | billingruns |
| M9 | BillingExecution | billingexecutions |
| M9 | BillingLog | billinglogs |
| M10 | Invoice | invoices |
| M11 | Payment | payments |
| M11 | Reconciliation | reconciliations |
| M11 | Refund | refunds |

---

## 🔄 Complete Business Workflow

```
Customer Registration (M1+M2)
    ↓
Product & Plan Selection (M3+M4)
    ↓
Discount Validation (M8)
    ↓
Quotation Creation & Tax Calculation (M6+M10)
    ↓
Quotation Acceptance & Subscription Activation (M6+M7)
    ↓
Recurring Billing Engine (M9) ← runs daily via cron
    ↓
Tax Invoice Generation (M10)
    ↓
Payment Recording & Reconciliation (M11)
    ↓
Executive Dashboard & Analytics (M12)
```

---

## 🧪 Test Results Summary

| Test Suite | Type | Count | Status |
|------------|------|-------|--------|
| M9 Billing Engine | Jest | 18 | ✅ PASS |
| M10 Invoice API | Jest | 15 | ✅ PASS |
| M10 Tax Calculation | Jest | 20 | ✅ PASS |
| M11 Payment & Reconciliation | Jest | 18 | ✅ PASS |
| M12 Analytics | Jest | 12 | ✅ PASS |
| **Jest Total** | | **83** | ✅ **ALL PASS** |
| M1 Authentication | Standalone | 42 | ✅ PASS |
| M2 Customer Management | Standalone | 42 | ✅ PASS |
| M6 Quotation Engine | Standalone | 24 | ✅ PASS |
| M7 Subscription Lifecycle | Standalone | 24 | ✅ PASS |
| M8 Discount Engine | Standalone | 36 | ✅ PASS |
| **Standalone Total** | | **168** | ✅ **ALL PASS** |
| E2E Workflow | Integration | 19 | ✅ **ALL PASS** |
| **GRAND TOTAL** | | **270** | ✅ **ALL PASS** |

---

## ⚙️ M9 Recurring Billing Scheduler

The billing engine runs automatically every day at midnight via node-cron:

```js
// Runs at 00:05 IST daily
cron.schedule('5 0 * * *', () => executeBillingRun({ triggerType: 'scheduled' }));
```

To trigger a manual billing run:
```bash
POST /api/billing/run
Authorization: Bearer <admin_token>
```

---

## 🔒 Authentication & Authorization

- **JWT-based authentication** via `Authorization: Bearer <token>` header or `jwt` cookie
- **Roles:** `admin`, `staff`, `customer`
- **RBAC middleware** on all sensitive routes
- **Hackathon demo mode:** `x-mock-role` header supported for testing without real login

---

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── app.js               # Unified Express app (all 12 module routes)
│   │   ├── server.js            # HTTP server + billing scheduler
│   │   ├── config/db.js         # MongoDB connection
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── errorMiddleware.js
│   │   ├── models/              # M1 User model
│   │   └── modules/
│   │       ├── customers/       # M2
│   │       ├── products/        # M3
│   │       ├── plans/           # M4
│   │       ├── quotationTemplates/  # M5 (ESM)
│   │       ├── quotations/      # M6 (ESM)
│   │       ├── subscriptions/   # M7 (ESM)
│   │       ├── discounts/       # M8 (ESM)
│   │       ├── billing/         # M9
│   │       ├── invoices/        # M10
│   │       ├── payments/        # M11
│   │       └── analytics/       # M12
│   ├── scripts/                 # Seed & test runner scripts
│   └── tests/                   # M1, M2 standalone tests
└── frontend/
    ├── src/
    │   ├── App.jsx              # All 12 module routes
    │   ├── context/AuthContext.jsx  # Unified auth + persona switcher
    │   ├── components/Navbar.jsx    # Unified navigation
    │   ├── pages/               # All module UI pages
    │   └── services/            # API clients
    └── vite.config.js           # Port 5173, proxy /api → :5000
```

---

## 🚀 Deployment Notes

For production deployment:
1. Set `NODE_ENV=production` in `.env`
2. Use a strong JWT secret (min 64 chars)
3. Set `MONGO_URI` to your Atlas or production MongoDB URI
4. Build frontend: `npm run build` in `frontend/`
5. Serve `frontend/dist/` via nginx or Express static
6. Use PM2 or systemd for backend process management

---

## 📝 Known Integration Boundaries

| Boundary | Detail |
|----------|--------|
| M9 Subscription Adapter | Uses in-memory mock (not MongoDB) — intentional for M9 independence. Replace with real Subscription model query for final integration. |
| M6 Quotation Creation | ESM `createQuotation` requires `customer.selection` format — minor field mapping needed at integration boundary. |
| M12 Revenue Metrics | Uses adapter-level aggregation — connect to real Invoice/Payment collections for live data. |

---

*Brightloop Software — Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026*

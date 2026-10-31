# M10: Invoice & Tax Management – Integration & Specification Guide
**Project:** Brightloop Subscription Management System  
**Hackathon:** Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026  
**Developer Assignment:** Developer 3 (M9–M12)  
**Assigned Module:** M10 – Invoice & Tax Management (Implemented Independently)  
**Git Branch:** `feature/M10-invoice-tax-management`

---

## 1. Module Overview & Responsibilities
`M10` owns all operations concerning **invoices**, **statutory tax configurations**, **Indian GST calculations (CGST, SGST, IGST)**, **lifecycle state transitions**, and **invoice presentation / printing**.

### Clear Boundaries:
- **M9 (Recurring Billing Engine):** Generates recurring billing cycles and feeds raw line items to M10. (M10 exposes an idempotent webhook & service method).
- **M10 (Invoice & Tax Management):** Owns invoice numbering (`INV-YYYY-XXXX`), tax rules, line calculations, snapshots, audit history, and print view.
- **M11 (Payment & Reconciliation):** Owns payment processing, gateway transactions, and bank reconciliations. (M10 displays payment summaries and syncs invoice payment status).
- **M12 (Dashboard & Analytics):** Owns executive financial metrics. (M10 exposes `/api/invoices/analytics/summary`).

---

## 2. Replaceable Architecture & Development Adapters
To guarantee 100% independent development without blocking on Developer 1 or Developer 2, M10 isolates all external dependencies behind adapters in `backend/src/modules/invoices/adapters/`:

| Adapter | Purpose in Standalone Mode | Replacement at Final Integration |
| :--- | :--- | :--- |
| `authAdapter.js` | Emulates Admin, Staff, and Customer test identities with JWT / mock headers (`x-mock-role`, `x-mock-user-id`) | Replace with Developer 1's **M1 Authentication Middleware** (`req.user = { id, role, email, name }`) |
| `customerAdapter.js` | Resolves billing address, state, and GSTIN from seed data | Replace with Developer 1's **M2 Customer Service** (`getCustomerById`, `getCustomerState`, `getCustomerGSTIN`) |
| `billingAdapter.js` | Provides test recurring billing payloads and validates incoming cycles | Connected to Developer 3's **M9 Billing Engine** |
| `paymentAdapter.js` | Mocks payment balance and status evaluations | Connected to Developer 3's **M11 Payment Service** |

---

## 3. Indian GST Calculation Rules (Statutory Logic)
Supplier State: `Kerala` (configurable via `process.env.COMPANY_STATE`)

### 3.1 Intra-State Supply (Supplier State === Customer Billing State)
- Applied when customer billing state is `Kerala`.
- Tax is split **equally** into Central GST (CGST) and State GST (SGST):
  $$\text{CGST Rate} = \frac{\text{GST Rate}}{2}, \quad \text{SGST Rate} = \frac{\text{GST Rate}}{2}$$
  $$\text{CGST Amount} = \text{round}\left(\frac{\text{Taxable} \times \text{CGST Rate}}{100}\right)$$
  $$\text{SGST Amount} = \text{Total Tax} - \text{CGST Amount}$$
- *Example:* On ₹1,000 with 18% GST $\rightarrow$ CGST = ₹90 (9%), SGST = ₹90 (9%).

### 3.2 Inter-State Supply (Supplier State $\neq$ Customer Billing State)
- Applied when customer billing state is `Karnataka`, `Tamil Nadu`, `Maharashtra`, etc.
- Integrated GST (IGST) applies at the full statutory rate:
  $$\text{IGST Amount} = \text{round}\left(\frac{\text{Taxable} \times \text{GST Rate}}{100}\right)$$
- *Example:* On ₹1,000 with 18% GST $\rightarrow$ IGST = ₹180 (18%).

---

## 4. Invoice Lifecycle & Business Safeguards

```
[Draft] ───(issue)───> [Issued] ───(payment)───> [Partially Paid] ───(full payment)───> [Paid]
   │                      │
   │                      └───(due date passed with balance)───> [Overdue]
   │
   └───(cancel)───> [Cancelled] (Preserves audit history)
```

### Critical Business Rules:
1. **Draft Invoices:** Line items, prices, discounts, and tax codes are fully editable by Admin.
2. **Issued / Paid Invoices:** Locked! Financial amounts and customer snapshots cannot be silently edited.
3. **Atomic Numbering:** Sequences (`INV-2026-0001`) are atomically incremented in MongoDB via `findOneAndUpdate` with `$inc`.
4. **Customer Data Isolation:** Customers can ONLY retrieve their own invoices (`req.user.id === invoice.customerId`). Unauthorized access returns HTTP 403 Forbidden.

---

## 5. REST API Specifications

Base Path: `/api`

### 5.1 Invoices Endpoints (`/api/invoices`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/invoices` | Admin, Staff | Filtered list with pagination, search, status, and date range |
| `POST` | `/api/invoices` | Admin | Create manual draft invoice |
| `GET` | `/api/invoices/my` | Customer | Scoped list of logged-in customer's invoices |
| `GET` | `/api/invoices/:id` | Admin, Staff, Owner | Single invoice details, items, tax breakdown & audit trail |
| `PUT` | `/api/invoices/:id` | Admin | Update draft invoice details |
| `PATCH` | `/api/invoices/:id/issue` | Admin | Issue draft invoice into official issued status |
| `PATCH` | `/api/invoices/:id/cancel` | Admin | Cancel eligible invoice with audit reason |
| `GET` | `/api/invoices/:id/print` | Admin, Staff, Owner | Structured data for print view |
| `POST` | `/api/invoices/billing-webhook` | System / M9 | Idempotent recurring billing ingestion |
| `GET` | `/api/invoices/analytics/summary` | Admin, Staff | Financial totals for M12 Dashboard |

### 5.2 Tax Configurations Endpoints (`/api/tax-configurations`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tax-configurations` | Admin, Staff | List configured tax rates (GST0, GST5, GST12, GST18, GST28) |
| `POST` | `/api/tax-configurations` | Admin | Create new statutory tax tier |
| `PUT` | `/api/tax-configurations/:id` | Admin | Update tax rate configuration |
| `PATCH` | `/api/tax-configurations/:id/status` | Admin | Toggle active/inactive state |
| `POST` | `/api/tax-configurations/calculate` | Admin, Staff | Preview GST calculations without saving invoice |

---

## 6. How to Run and Test M10 Independently

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### Step 1: Install Dependencies
```bash
# In backend
cd backend
npm install

# In frontend
cd ../frontend
npm install
```

### Step 2: Seed Development Database
Populates standard GST tax tiers (0%, 5%, 12%, 18%, 28%) and 6 invoices representing every lifecycle status:
```bash
cd backend
npm run seed:m10
```

### Step 3: Run Backend Test Suite
Executes 21 unit & integration tests (tax calculations, GST intra/inter-state, RBAC, customer isolation, idempotency):
```bash
cd backend
npm test
```

### Step 4: Start Development Servers
**Terminal 1 (Backend - Port 5000):**
```bash
cd backend
npm run dev
# Or: npm start
```

**Terminal 2 (Frontend - Port 5173):**
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser. Use the **Role Switcher** bar at the top of the interface to test Admin, Staff, Customer 1 (Kerala), and Customer 2 (Karnataka) personas live!

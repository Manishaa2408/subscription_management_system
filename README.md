# Brightloop Software - Subscription Management System (SMS)
## Developer 2 - Module 5: Quotation Template Management (M5)

Welcome to the **M5 Quotation Template Management** module for **Brightloop Software**, developed for the **Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026**.

---

### 1. Module Overview & Purpose
Brightloop Software sells recurring cloud subscriptions, implementation services, and product add-ons. 
Instead of manually selecting products and entering lines repeatedly, authorized users can create **reusable quotation templates** with predefined items, quantities, pricing snapshots, and validity periods.

> **Key Rule:** A quotation template is **not** an actual quotation. M5 configures reusable presets that **M6 (Quotation Management)** consumes to generate customer quotations.

---

### 2. Implemented Features (M5)
- **QuotationTemplate MongoDB Model**: Embedded items, 2-decimal rounded subtotals, tax totals, grand totals, unique auto-generated codes (`QT-001`, `QT-002`), timestamps, and soft deletion.
- **Product Catalog Adapter (simulating M3)**: Dynamic products and variants with variant price formula (`Base Price + Variant Additional Price`).
- **Subscription Plan Catalog Adapter (simulating M4)**: Dynamic daily, weekly, monthly, and yearly recurring plans.
- **Authoritative Backend Pricing Service**: Strict 2-decimal arithmetic, recalculating client submissions to prevent tampering.
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full access (Create, View all, Edit, Toggle Status, Soft Delete).
  - **Staff**: Read-only access (View active templates, Preview). Cannot create, edit, or delete.
  - **Customer**: Blocked from internal quotation templates (403 Forbidden).
- **Interactive Role Switcher Banner**: Switch between Admin, Staff, and Customer in one click on the frontend.
- **Printable Template Preview**: Professional branded sheet with print/PDF layout.
- **Search & Filter**: Search by template name or code, filter by active/inactive status.
- **M6 Consumption Contract**: Dedicated contract endpoint and service method `getTemplateForQuotation(id)`.

---

### 3. Quick Start & Run Instructions

#### Step 1: Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

#### Step 2: Seed the Database
```bash
cd backend
npm run seed
```

#### Step 3: Start the Backend Server
```bash
cd backend
npm start
# Server runs at http://localhost:5000
# API endpoints at http://localhost:5000/api/quotation-templates
```

#### Step 4: Start the React Frontend
```bash
cd frontend
npm run dev
# Frontend runs at http://localhost:3000
```

#### Step 5: Run Automated Tests
```bash
cd backend
node scripts/runAllTests.js
```

---

### 4. API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | System health check |
| `GET` | `/api/quotation-templates` | Admin, Staff | Get all templates with search & pagination |
| `POST` | `/api/quotation-templates` | Admin | Create a new quotation template |
| `GET` | `/api/quotation-templates/:id` | Admin, Staff | Get single template details |
| `PUT` | `/api/quotation-templates/:id` | Admin | Update template details and line items |
| `PATCH` | `/api/quotation-templates/:id/status` | Admin | Toggle status (`active` / `inactive`) |
| `DELETE` | `/api/quotation-templates/:id` | Admin | Soft delete template (`isDeleted: true`) |
| `GET` | `/api/quotation-templates/:id/preview` | Admin, Staff | Read-only quotation-style preview |
| `GET` | `/api/quotation-templates/catalog/products` | Admin, Staff | Dynamic products via Product Adapter |
| `GET` | `/api/quotation-templates/catalog/plans` | Admin, Staff | Dynamic plans via Plan Adapter |

---

### 5. Final Integration Contracts

#### 5.1 Authentication Contract (with Developer 1 / M1)
Controllers expect:
```javascript
req.user = {
  id: "USER_OBJECT_ID",
  email: "user@brightloop.local",
  role: "admin" // 'admin' | 'staff' | 'customer'
};
```
In `backend/src/modules/quotationTemplates/adapters/authAdapter.js`, simply swap the development middleware with M1's JWT middleware during integration.

#### 5.2 Product Catalog Contract (with Developer 1 / M3)
Interface exposed by `productCatalogAdapter.js`:
- `getProducts()`
- `getProductById(id)`
- `getProductVariants(productId)`
- `validateProduct(productId)`
- `calculateVariantPrice(productId, variantId)`

#### 5.3 Subscription Plan Contract (with Developer 1 / M4)
Interface exposed by `planCatalogAdapter.js`:
- `getPlans()`
- `getPlanById(id)`
- `validatePlan(planId)`
- `getPlanPrice(planId)`

#### 5.4 M6 Consumption Contract (Quotation Management)
M6 will consume template data using:
```javascript
import quotationTemplateService from "./modules/quotationTemplates/services/quotationTemplateService.js";

const template = await quotationTemplateService.getTemplateForQuotation(templateId);
// Returns snapshot of items, unit prices, tax rates, validityDays, and totals.
```

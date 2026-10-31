# M2 Integration Documentation

## Overview
This document captures the integration contracts for **Module 2 – Customer Management & Portal** of the Brightloop Subscription Management System.

## Backend API Endpoints
| Method | Path | Description | Roles Allowed |
|--------|------|-------------|---------------|
| GET | `/api/customers` | List customers with pagination, search & filters | `admin`, `staff` |
| POST | `/api/customers` | Create a new customer (individual or business) | `admin` |
| GET | `/api/customers/:id` | Get detailed info for a specific customer | `admin`, `staff` |
| PUT | `/api/customers/:id` | Update mutable customer fields | `admin` |
| DELETE | `/api/customers/:id` | Soft‑delete / deactivate a customer | `admin` |
| GET | `/api/customers/:id/notes` | List notes for a customer | `admin`, `staff` |
| POST | `/api/customers/:id/notes` | Add a note (internal only) | `admin`, `staff` |
| GET | `/api/customers/:id/activities` | Retrieve activity log (append‑only) | `admin`, `staff` |
| GET | `/api/customer-portal/dashboard` | Dashboard KPI summary for the logged‑in customer | `customer` |
| GET | `/api/customer-portal/profile` | Customer profile data | `customer` |
| PUT | `/api/customer-portal/profile` | Update profile (self‑service) | `customer` |
| GET | `/api/customer-portal/addresses` | List address book entries | `customer` |
| POST | `/api/customer-portal/addresses` | Add a new address | `customer` |
| PUT | `/api/customer-portal/addresses/:addrId` | Update an address | `customer` |
| DELETE | `/api/customer-portal/addresses/:addrId` | Delete an address | `customer` |
| GET | `/api/customer-portal/subscriptions` | List customer's subscriptions | `customer` |
| GET | `/api/customer-portal/quotations` | List quotations (mock data) | `customer` |
| GET | `/api/customer-portal/invoices` | List invoices (mock data) | `customer` |
| GET | `/api/customer-portal/payments` | List payments (mock data) | `customer` |

## Frontend Services (`frontend/src/services/customerService.js`)
- `getCustomers(params)` – Admin list.
- `createCustomer(payload)` – Admin create.
- `getCustomer(id)` – Admin detail.
- `updateCustomer(id, payload)` – Admin edit.
- `deleteCustomer(id)` – Admin soft delete.
- `getPortalDashboard()` – Customer portal KPI.
- `getPortalProfile()` / `updatePortalProfile(payload)` – Profile.
- `getPortalAddresses()`, `addPortalAddress(payload)`, `updatePortalAddress(id, payload)`, `deletePortalAddress(id)` – Address book.
- `getPortalSubscriptions()` – Subscriptions.
- `getPortalQuotations()`, `getPortalInvoices()`, `getPortalPayments()` – Mock portal data.

## Role‑Based Access Control (RBAC)
- **Admin**: Full CRUD on customers, notes, activities, and can view all portal data.
- **Staff**: Read‑only access to customers, notes, and activities.
- **Customer**: Self‑service portal – can only access resources belonging to their own user (`req.user.id`). All portal routes are wrapped with `ProtectedRoute allowedRoles=['customer']`.

## Adapter Pattern
Adapters (`adapters/*.js`) provide mock data sources for products, subscriptions, quotations, invoices, and payments. They expose a uniform interface (`list`, `getById`, etc.) and can be swapped out for real services (M3+ modules) without changing controllers or services.

## Integration Checklist
- [x] Backend routes mounted in `app.js`.
- [x] Service layer implements business logic and validation.
- [x] Controllers expose REST endpoints and enforce RBAC.
- [x] Frontend pages import `PortalLayout` for consistent navigation.
- [x] Navbar includes **Customers** link for admin/staff.
- [x] All routes added to `App.jsx` with `ProtectedRoute`.
- [x] Frontend build passes (`npm run build`).
- [ ] Documentation added to repository (`M2_INTEGRATION.md`).
- [ ] Commit and push the M2 changes to `feature/M2-customer-management-portal`.

## Next Steps
1. Commit the new files and updates.
2. Push the `feature/M2-customer-management-portal` branch to GitHub.
3. Notify the team that M2 is ready for integration testing.

---
*Generated on 2026‑10‑31.*

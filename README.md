# Brightloop Software – Subscription Management System
> **Odoo Make-A-Ton 9.0 Kochi Hackathon 2026**  
> **Developer 1:** Platform, Users and Product Configuration  
> **Module Implemented:** **M1 – Authentication & Role Management** (Production-Ready)

---

## 1. Module Overview & Capabilities

Module 1 establishes the unified authentication, authorization, and role management backbone for Brightloop Software:

- **Roles Supported:** `admin`, `staff`, `customer`.
- **Authentication Engine:** Signed JWTs transported via secure `HttpOnly` cookies (with Bearer token fallback for API consumers).
- **Password Security:** Salted hashing with `bcryptjs` (min 10 rounds), strict policy enforcement (> 8 characters, uppercase, lowercase, special character).
- **Public Customer Registration:** Role strictly locked to `customer` to prevent privilege escalation.
- **Role-Based Redirects:**
  - Admin $\rightarrow$ `/admin/dashboard`
  - Staff $\rightarrow$ `/staff/dashboard`
  - Customer $\rightarrow$ `/customer/dashboard`
- **Admin Staff Management:** Admin interface to create staff accounts, search by name/email, filter by role/status, activate/deactivate accounts, and edit roles with safeguard protection against removing the last active Admin.
- **Forgot & Reset Password:** Cryptographically secure 32-byte tokens hashed with SHA-256 in MongoDB, single-use, 15-minute expiration, user enumeration prevention, and development console link fallback.
- **Zero-Failure Database Layer:** Seamlessly connects to standard local MongoDB (`mongodb://127.0.0.1:27017/brightloop`) with automatic in-memory MongoDB fallback if local mongod daemon is not running.

---

## 2. Shared Integration Contracts for Developers 2 & 3

All team members must integrate with M1 using the following conventions:

### A. Role Values
```javascript
['admin', 'staff', 'customer']
```

### B. User Context in Protected Controllers
Import and mount the reusable middleware:
```javascript
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Accessible by any authenticated user
router.get('/my-data', protect, controller);

// Accessible only by admin and staff
router.post('/operations', protect, authorize('admin', 'staff'), controller);
```
In any protected controller, the authenticated user is accessible via:
```javascript
req.user = {
  id: "6ae5f7607a5b547c3957b679", // Mongoose ObjectId as string
  email: "user@example.com",
  role: "admin", // 'admin' | 'staff' | 'customer'
  fullName: "User Name"
}
```

### C. Database References
Use MongoDB ObjectIds referencing the `User` model:
- `Subscription` $\rightarrow$ `customerId` (ref: `'User'`)
- `Invoice` $\rightarrow$ `customerId` (ref: `'User'`)
- `Payment` $\rightarrow$ `recordedBy` (ref: `'User'`)
- `Quotation` $\rightarrow$ `createdBy` (ref: `'User'`)

### D. Frontend Auth Hook
In any React component:
```jsx
import { useAuth } from './context/AuthContext';

const MyComponent = () => {
  const { user, role, isAuthenticated, logout } = useAuth();
  // ...
};
```

---

## 3. Quickstart & Running Instructions

### Prerequisites
- Node.js (v18+) & npm

### Backend Setup
```bash
cd backend
npm install
npm run seed:admin   # Seeds the initial Admin account
npm run dev          # Starts Express server on http://localhost:5000
```

### Run Automated Acceptance Tests (42 Tests)
```bash
cd backend
npm run test:m1
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev          # Starts Vite dev server on http://localhost:5173
```

---

## 4. Default Seed Credentials (Development)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@brightloop.com` | `ChangeThisPassword123!` |

*(Customers can be created directly on the `/register` page)*

---

## 5. API Reference Summary

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register customer account |
| `POST` | `/api/auth/login` | Public | Authenticate user & set HttpOnly cookie |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current session user |
| `POST` | `/api/auth/logout` | Authenticated | Clear cookie & terminate session |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset token |
| `POST` | `/api/auth/reset-password/:token`| Public | Reset password with token |
| `GET` | `/api/users` | Admin | Search, filter, and paginate users |
| `GET` | `/api/users/:id` | Admin | Get user details |
| `POST` | `/api/users/staff` | Admin | Create Staff member |
| `PATCH`| `/api/users/:id/status` | Admin | Activate or deactivate user |
| `PATCH`| `/api/users/:id/role` | Admin | Change user role (admin protection) |
| `GET` | `/api/health` | Public | API health check |

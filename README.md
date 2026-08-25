# MarketPulse: Three-Sided Services Marketplace

A production-grade, three-sided services marketplace: Customers book services, Vendors fulfill and manage schedules, and Administrators govern platform operations and data-driven RBAC.

---

## 🌐 Live Deployed Application

- **Frontend Client**: [https://service-marketplace-delta.vercel.app](https://service-marketplace-delta.vercel.app)
- **Backend API Gateway**: [https://service-marketplace-9esa.onrender.com/api](https://service-marketplace-9esa.onrender.com/api)
- **Interactive Swagger Docs**: [https://service-marketplace-9esa.onrender.com/api/docs](https://service-marketplace-9esa.onrender.com/api/docs)

> **Quick Evaluator Switcher**: The frontend application includes a **⚡ Switch Persona** button in the header for 1-click login as any seeded persona.

---

## 👥 Seeded Personas & Test Credentials

All accounts share the default password: **`Password123!`**

| Persona | Role | Email | Capabilities & Scenarios |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `SUPER_ADMIN` | `superadmin@marketplace.com` | Bypasses all permission checks; full platform governance |
| **Catalogue Moderator** | `CATALOGUE_MODERATOR` | `moderator@marketplace.com` | Restricted sub-admin holding only `category.*` & `service.suspend` |
| **Approved Vendor** | `VENDOR` (Approved) | `vendor.approved@marketplace.com` | Has active services, weekly rules, and incoming bookings |
| **Pending Vendor** | `VENDOR` (Pending) | `vendor.pending@marketplace.com` | Account in review; operational endpoints return 403 `VENDOR_NOT_APPROVED` |
| **Rejected Vendor** | `VENDOR` (Rejected) | `vendor.rejected@marketplace.com` | Displays rejection reason in portal |
| **Customer 1** | `CUSTOMER` (Active) | `customer1@marketplace.com` | Has active appointments, rescheduling history, and cancellation refunds |
| **Customer 2** | `CUSTOMER` (New) | `customer2@marketplace.com` | Clean customer account ready to book first slot |

---

## ⚡ Cold Clone Setup & Quick Start

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- *(Optional)* MongoDB running locally or a MongoDB Atlas connection string. If no MongoDB is running, the backend automatically boots an **embedded in-memory MongoDB instance** so the app runs out-of-the-box with zero database installation!

### 2. Clone & Install Dependencies
```bash
git clone <repo-url>
cd <repo-folder>
npm install
```

### 3. Environment Variables Configuration
Copy the `.env.example` template:
```bash
cp .env.example .env
```

*(Default values in `.env.example` work out-of-the-box for local testing).*

### 4. Seed the Database
Populates the database with all 7 personas, categories, services, weekly rules, and bookings:
```bash
npm run seed
```

### 5. Start the Application
Run both backend and frontend concurrently:
```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5001/api`
- **Swagger Documentation**: `http://localhost:5001/api/docs`

---

## 🧪 Automated Concurrency & Integrity Tests

### Concurrency Stress Test (M6 Concurrency Race Prevention)
Fires **20 simultaneous booking requests** in parallel against a slot with capacity 3:
```bash
npm run test:concurrency
```
**Expected Output**: Exactly **3 bookings return HTTP 201 Created** and **17 requests return clean HTTP 409 Conflict (`SLOT_CAPACITY_EXCEEDED`)**.

### Full Integrity & RBAC Test Suite
Runs tests covering permission guards, tenant ownership isolation, vendor onboarding gates, state machine invalid transitions, deterministic payment declines, and idempotent webhooks:
```bash
npm run test:suite
```

---

## 💳 Deterministic Mock Payment Triggers (M7)

When booking in `PAY_NOW` mode, use the following deterministic test tokens to trigger specific scenarios:

| Token | Simulated Behavior | System Outcome |
| :--- | :--- | :--- |
| **`tok_success`** | Instant payment approval | Payment status `SUCCESS`; Booking status `CONFIRMED`. |
| **`tok_fail`** | Forced card decline | Payment status `FAILED`; Slot capacity is immediately released; Booking marked `CANCELLED`. |
| **`tok_delay`** | Asynchronous payment processing | Payment status `INITIATED`; Booking stays `PENDING` until webhook callback. |

### Idempotency & Webhooks
- **Idempotency Key**: Pass header `Idempotency-Key: <unique-key>`. Replaying the same key returns the cached payment response without double charging or duplicate bookings.
- **Webhook Simulator**: Call `POST /api/payments/webhook` with `{ event: "payment.success" | "payment.failed", providerRef: "<ref>" }`. Delivered multiple times with zero additional side-effects.

---

## 📐 Architecture & Key Design Highlights

- **Data-Driven RBAC (M2)**: Permissions are granular slugs (`service.create`, `booking.cancel`, `vendor.approve`). Roles are stored in the database, enabling admins to create custom roles and assign them to sub-admins without code redeployment.
- **Dynamic Slot Derivation (M5)**: Bookable slots are derived in real-time by partitioning weekly opening windows by offering duration, subtracting date exceptions, and subtracting active bookings. No static slot tables.
- **Database-Level Atomic Locking (M6)**: Overbooking is prevented using MongoDB's atomic conditional `findOneAndUpdate` with `{ $expr: { $lt: ['$bookedCount', '$maxCapacity'] } }`.
- **Financial Precision (09)**: Money is represented strictly in integer minor units (paise/cents) to eliminate floating-point rounding errors.
- **Timezone Awareness (M5)**: Slots are evaluated in the vendor's operating timezone (e.g. `Asia/Kolkata`) rather than the client browser's local clock.

# Architecture & Design Decisions: MarketPulse Services Marketplace

This document details the architectural decisions, data model, concurrency control mechanism, scope trade-offs, and future roadmap for the MarketPulse three-sided services marketplace.

---

## 1. Data Model & Entity Relations

### Entity Relationship Overview

```
Role (RBAC Data-Driven)
 ├── User (Customer, Vendor, Admin, Sub-Admin)
 │    ├── RefreshToken (7-Day rotation, hashed)
 │    ├── VendorProfile (Onboarding status: PENDING | APPROVED | REJECTED)
 │    │    └── Service (DRAFT | PUBLISHED | SUSPENDED)
 │    │         ├── Offering (duration in minutes, price in minor units)
 │    │         ├── AvailabilityRule (Weekly windows & per-slot capacity)
 │    │         ├── DateException (Closures & custom overrides)
 │    │         └── SlotCapacity (Real-time atomic occupancy sentinel)
 │    └── Booking (State Machine: PENDING -> CONFIRMED -> COMPLETED | CANCELLED | REJECTED | NO_SHOW)
 │         ├── BookingTimeline (Audit trail: who, from, to, reason, timestamp)
 │         └── Payment (Status: INITIATED | SUCCESS | FAILED | REFUNDED)
 └── AuditLog (Admin governance activity)
```

### Table & Collection Reference

| Collection | Key Fields | Purpose |
| :--- | :--- | :--- |
| **`User`** | `_id`, `email` (unique), `passwordHash` (bcrypt), `roleId`, `status` | Identity and authentication credential holder |
| **`Role`** | `_id`, `name` (unique), `description`, `permissions` (slugs array), `isSystem` | Data-driven RBAC container (not code enums) |
| **`Permission`** | `_id`, `slug` (unique e.g. `service.create`), `resource`, `action` | Granular permission catalog |
| **`VendorProfile`** | `_id`, `userId` (unique), `businessName`, `status` (`PENDING` \| `APPROVED` \| `REJECTED`), `timezone` | Business entity and onboarding status |
| **`Category`** | `_id`, `name`, `slug`, `parentId` (self-referencing) | 2-level hierarchical category taxonomy |
| **`Service`** | `_id`, `vendorId`, `categoryId`, `title`, `slug`, `status`, `freeCancellationWindowHours` | Parent service catalog record |
| **`Offering`** | `_id`, `serviceId`, `name`, `durationMinutes`, `price` (integer minor units) | Tiered bookable service options |
| **`AvailabilityRule`** | `_id`, `serviceId`, `dayOfWeek` (0-6), `startTime`, `endTime`, `capacity` | Weekly operating schedule rules |
| **`DateException`** | `_id`, `serviceId`, `date`, `isClosed`, `customWindows` | Holiday closures and custom overrides |
| **`SlotCapacity`** | `_id`, `serviceId`, `date`, `startTime`, `endTime`, `maxCapacity`, `bookedCount` | **Atomic Concurrency Sentinel** with compound index |
| **`Booking`** | `_id`, `bookingNumber`, `customerId`, `vendorId`, `serviceId`, `offeringId`, `date`, `startTime`, `endTime`, `status`, `price`, `paymentMode` | Appointment lifecycle record |
| **`BookingTimeline`** | `_id`, `bookingId`, `fromStatus`, `toStatus`, `changedByUserId`, `reason` | Complete immutable audit history |
| **`Payment`** | `_id`, `bookingId`, `amount`, `currency`, `providerRef`, `idempotencyKey`, `status`, `refunds` | Payment ledger with refund tracking |
| **`AuditLog`** | `_id`, `actorUserId`, `action`, `targetType`, `targetId`, `payload` | Administrative action logging |

---

## 2. Concurrency & Capacity Race Prevention (M6)

### The Problem
When 20 concurrent requests fire simultaneously for the last remaining seat in a time slot of capacity 3, a standard "read-then-write" in application code creates a race condition where multiple requests read available capacity before any write occurs, leading to disastrous overbooking.

### Our Solution: Database-Level Conditional Atomic Lock
We enforce slot capacity directly in the database engine using MongoDB's document-level atomic conditional `findOneAndUpdate` write lock:

```typescript
const reservedSlot = await SlotCapacity.findOneAndUpdate(
  {
    serviceId: sId,
    date,
    startTime,
    $expr: { $lt: ['$bookedCount', '$maxCapacity'] }, // Database-level capacity condition
  },
  {
    $inc: { bookedCount: 1 }, // Atomic increment
  },
  { new: true }
);

if (!reservedSlot) {
  // If capacity is already at maxCapacity, the filter fails atomically
  throw new ConflictError(
    'SLOT_CAPACITY_EXCEEDED',
    'The selected time slot is fully booked. Please select another slot.'
  );
}
```

### Verification & Concurrency Test Output
We verified this with our automated test script (`scripts/test-concurrency.ts`), firing 20 simultaneous HTTP POST requests against a slot with capacity 3:
- **Result**: Exactly **3 requests returned HTTP 201 Created** and **17 requests returned clean HTTP 409 Conflict (`SLOT_CAPACITY_EXCEEDED`)**.
- Final database count: `bookedCount = 3` (never exceeds `maxCapacity = 3`).

---

## 3. Timezone Handling Strategy

- **Timestamps**: All creation and modification timestamps (`createdAt`, `updatedAt`, `refundedAt`) are stored strictly in ISO 8601 UTC.
- **Slot Evaluation**: Slot start times are evaluated in the **vendor's operating timezone** (e.g. `Asia/Kolkata`), never the client browser's clock.
- **Past Slot Filtering**: When generating derived slots (`slot.service.ts`), current time is converted to the vendor's timezone using `Intl.DateTimeFormat` before comparing against slot start times. This prevents customers in earlier timezones from booking expired slots.

---

## 4. Scope Decisions & Trade-Offs

| Module / Feature | Decision | Rationale |
| :--- | :--- | :--- |
| **Payment Gateway** | Interface-based Mock Provider (`PaymentGateway`) | The rubric explicitly prohibits real payment networks. Our mock supports deterministic tokens (`tok_success`, `tok_fail`, `tok_delay`), idempotency keys, refund ledgers, and idempotent webhook callbacks. |
| **Document Storage** | Structured JSON file metadata | Avoids third-party S3 credentials while supporting multiple uploaded business licenses. |
| **Forgot Password** | Console Link Generation (M1 STRETCH) | Single-use expiring token printed to server console instead of SMTP integration. |
| **Embedded DB Support** | `mongodb-memory-server` zero-config fallback | Allows cold clone evaluation out-of-the-box without requiring the reviewer to have local MongoDB running. Also connects to MongoDB Atlas seamlessly if `MONGODB_URI` is supplied. |

---

## 5. What We Would Build Next Given Another Week

1. **Staff Member Assignment & Multi-Resource Capacity (M6 STRETCH)**:
   - Allow vendors to add staff members (e.g. Stylist A, Stylist B) and constrain slot generation to the union of available staff schedules.
2. **Real-time WebSockets / SSE Notifications**:
   - Push instant booking alerts to vendors when a new appointment is confirmed, and push live status updates to customers.
3. **Multi-Currency & Internationalization**:
   - Support currency conversion rates for cross-border booking with localized time format displays.
4. **Google / Apple Calendar Integration**:
   - Generate `.ics` invite links upon booking confirmation with automatic calendar reminders.

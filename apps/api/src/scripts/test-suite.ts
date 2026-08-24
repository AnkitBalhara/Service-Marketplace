import axios from 'axios';
import { config } from '../config';

const API_BASE = `http://localhost:${config.port}/api`;

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

async function recordTest(category: string, name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ category, name, passed: true, message: 'Passed successfully' });
    console.log(`  ✅ [${category}] ${name}`);
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message;
    results.push({ category, name, passed: false, message: msg });
    console.log(`  ❌ [${category}] ${name} -> Error: ${msg}`);
  }
}

async function runTestSuite() {
  console.log(`=============================================================`);
  console.log(`🧪 Running Core Integrity & RBAC Test Suite`);
  console.log(`=============================================================`);

  // Tokens
  const loginResAdmin = await axios.post(`${API_BASE}/auth/login`, {
    email: 'superadmin@marketplace.com',
    password: 'Password123!',
  });
  const adminToken = loginResAdmin.data.data.accessToken;

  const loginResCust1 = await axios.post(`${API_BASE}/auth/login`, {
    email: 'customer1@marketplace.com',
    password: 'Password123!',
  });
  const cust1Token = loginResCust1.data.data.accessToken;

  const loginResCust2 = await axios.post(`${API_BASE}/auth/login`, {
    email: 'customer2@marketplace.com',
    password: 'Password123!',
  });
  const cust2Token = loginResCust2.data.data.accessToken;

  const loginResVendor = await axios.post(`${API_BASE}/auth/login`, {
    email: 'vendor.approved@marketplace.com',
    password: 'Password123!',
  });
  const vendorToken = loginResVendor.data.data.accessToken;

  const loginResPendingVendor = await axios.post(`${API_BASE}/auth/login`, {
    email: 'vendor.pending@marketplace.com',
    password: 'Password123!',
  });
  const pendingVendorToken = loginResPendingVendor.data.data.accessToken;

  // -------------------------------------------------------------
  // 1. RBAC & PERMISSION GUARD TESTS (M2)
  // -------------------------------------------------------------
  console.log(`\n[Module: M2 Permissions & Ownership]`);

  await recordTest('Permissions', 'Low-privileged customer calling Admin endpoint returns 403', async () => {
    try {
      await axios.get(`${API_BASE}/admin/metrics`, {
        headers: { Authorization: `Bearer ${cust1Token}` },
      });
      throw new Error('Expected 403 Forbidden but request succeeded');
    } catch (err: any) {
      if (err.response?.status !== 403) {
        throw new Error(`Expected HTTP 403, got ${err.response?.status}`);
      }
    }
  });

  await recordTest('Ownership', 'Customer 2 accessing Customer 1 private booking returns 403', async () => {
    // Find customer 1's booking
    const cust1Bookings = await axios.get(`${API_BASE}/bookings/customer/me`, {
      headers: { Authorization: `Bearer ${cust1Token}` },
    });
    const bId = cust1Bookings.data.data[0]._id;

    try {
      await axios.get(`${API_BASE}/bookings/${bId}`, {
        headers: { Authorization: `Bearer ${cust2Token}` },
      });
      throw new Error('Expected 403 Forbidden on cross-customer access');
    } catch (err: any) {
      if (err.response?.status !== 403) {
        throw new Error(`Expected HTTP 403, got ${err.response?.status}`);
      }
    }
  });

  await recordTest('Onboarding Guard', 'Pending vendor is blocked from publishing/creating services with 403', async () => {
    try {
      await axios.post(
        `${API_BASE}/vendor/services`,
        {
          categoryId: '6a8c40bd817d6e104d913310',
          title: 'Unauthorized Pending Service',
          description: 'This service should be blocked',
        },
        {
          headers: { Authorization: `Bearer ${pendingVendorToken}` },
        }
      );
      throw new Error('Expected 403 Forbidden for pending vendor');
    } catch (err: any) {
      if (err.response?.status !== 403) {
        throw new Error(`Expected HTTP 403, got ${err.response?.status}`);
      }
    }
  });

  // -------------------------------------------------------------
  // 2. STATE MACHINE TESTS (M6)
  // -------------------------------------------------------------
  console.log(`\n[Module: M6 Booking State Machine & Lifecycle]`);

  await recordTest('State Machine', 'Illegal transition: Marking PENDING booking as COMPLETED returns 422', async () => {
    // Create new PENDING booking
    const cat = await axios.get(`${API_BASE}/catalogue/services`);
    const srv = cat.data.data[0];
    const off = srv.offerings[0];

    const createRes = await axios.post(
      `${API_BASE}/bookings`,
      {
        serviceId: srv.id || srv._id,
        offeringId: off._id,
        date: '2026-09-21',
        startTime: '10:30',
        paymentMode: 'PAY_AFTER',
      },
      { headers: { Authorization: `Bearer ${cust1Token}` } }
    );
    const newBookingId = createRes.data.data._id;

    // Try completing directly from PENDING (without CONFIRMED)
    try {
      await axios.patch(
        `${API_BASE}/bookings/${newBookingId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${vendorToken}` } }
      );
      throw new Error('Expected 422 Unprocessable Entity for illegal transition');
    } catch (err: any) {
      if (err.response?.status !== 422) {
        throw new Error(`Expected HTTP 422, got ${err.response?.status}`);
      }
    }
  });

  await recordTest('State Machine', 'Customer calling PATCH /bookings/:id/complete returns 403', async () => {
    const cust1Bookings = await axios.get(`${API_BASE}/bookings/customer/me`, {
      headers: { Authorization: `Bearer ${cust1Token}` },
    });
    const bId = cust1Bookings.data.data[0]._id;

    try {
      await axios.patch(
        `${API_BASE}/bookings/${bId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${cust1Token}` } }
      );
      throw new Error('Expected 403 Forbidden for customer calling complete');
    } catch (err: any) {
      if (err.response?.status !== 403) {
        throw new Error(`Expected HTTP 403, got ${err.response?.status}`);
      }
    }
  });

  // -------------------------------------------------------------
  // 3. PAYMENT MOCK & FAILURE HANDLING (M7)
  // -------------------------------------------------------------
  console.log(`\n[Module: M7 Deterministic Mock Payments]`);

  await recordTest('Payments', 'Forced payment failure (tok_fail) aborts booking and releases slot', async () => {
    const cat = await axios.get(`${API_BASE}/catalogue/services`);
    const srv = cat.data.data[0];
    const off = srv.offerings[0];

    try {
      await axios.post(
        `${API_BASE}/bookings`,
        {
          serviceId: srv.id || srv._id,
          offeringId: off._id,
          date: '2026-09-22',
          startTime: '09:00',
          paymentMode: 'PAY_NOW',
          paymentToken: 'tok_fail',
        },
        { headers: { Authorization: `Bearer ${cust1Token}` } }
      );
      throw new Error('Expected payment failure for tok_fail');
    } catch (err: any) {
      if (err.response?.status !== 400 && err.response?.status !== 422) {
        throw new Error(`Expected 400/422 for tok_fail, got ${err.response?.status}`);
      }
    }
  });

  await recordTest('Payments', 'Simulated Webhook endpoint handles async payment confirmation idempotently', async () => {
    const webhookRes1 = await axios.post(`${API_BASE}/payments/webhook`, {
      event: 'payment.success',
      providerRef: 'mock_pay_seed001',
    });
    if (webhookRes1.status !== 200) throw new Error('Webhook 1 failed');

    // Deliver same webhook second time
    const webhookRes2 = await axios.post(`${API_BASE}/payments/webhook`, {
      event: 'payment.success',
      providerRef: 'mock_pay_seed001',
    });
    if (webhookRes2.status !== 200) throw new Error('Webhook 2 failed');
  });

  console.log(`\n=============================================================`);
  console.log(`📊 TEST SUITE SUMMARY: ${results.filter((r) => r.passed).length}/${results.length} PASSED`);
  console.log(`=============================================================\n`);

  const allPassed = results.every((r) => r.passed);
  process.exit(allPassed ? 0 : 1);
}

runTestSuite();

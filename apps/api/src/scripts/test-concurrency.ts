import axios from 'axios';
import { config } from '../config';

const API_BASE = `http://localhost:${config.port}/api`;

async function runConcurrencyTest() {
  console.log(`=============================================================`);
  console.log(`🚀 Starting Concurrency & Capacity Race Test (M6 Rubric)`);
  console.log(`=============================================================`);

  try {
    // 1. Fetch live published services from API
    console.log(`[Setup] Fetching published services from ${API_BASE}/catalogue/services...`);
    const catalogueRes = await axios.get(`${API_BASE}/catalogue/services`);
    const services: any[] = catalogueRes.data.data;

    if (!services || services.length === 0) {
      console.error(`[Error] No published services found on API. Please ensure the API is seeded.`);
      process.exit(1);
    }

    // Pick the Artisan Haircuts service which is configured with capacity 3 in seed data
    const service = services.find((s) => s.title.includes('Haircut')) || services[0];
    const offering = service.offerings && service.offerings.length > 0 ? service.offerings[0] : null;

    if (!offering) {
      console.error(`[Error] Target service "${service.title}" has no active offerings.`);
      process.exit(1);
    }

    // 2. Dynamically pick a fresh future Tuesday so test can be re-run indefinitely
    // Find next Tuesday at least 30 days in future
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30 + (Math.floor(Math.random() * 20) * 7));
    // Set to Tuesday (day 2)
    const day = targetDate.getDay();
    const diff = (2 - day + 7) % 7;
    targetDate.setDate(targetDate.getDate() + diff);

    const testDate = targetDate.toISOString().split('T')[0];
    const testStartTime = '11:15';

    console.log(`[Test Setup] Target Service: "${service.title}" (ID: ${service.id || service._id})`);
    console.log(`[Test Setup] Target Offering: "${offering.name}" (${offering.durationMinutes} min, ₹${offering.price / 100})`);
    console.log(`[Test Setup] Target Slot: ${testDate} (Tuesday) at ${testStartTime}`);
    console.log(`[Test Setup] Configured Slot Max Capacity: 3 simultaneous bookings`);
    console.log(`[Test Setup] Firing 20 simultaneous booking requests in parallel...\n`);

    // 3. Authenticate as Customer 1 and Customer 2
    const loginRes1 = await axios.post(`${API_BASE}/auth/login`, {
      email: 'customer1@marketplace.com',
      password: 'Password123!',
    });
    const token1 = loginRes1.data.data.accessToken;

    const loginRes2 = await axios.post(`${API_BASE}/auth/login`, {
      email: 'customer2@marketplace.com',
      password: 'Password123!',
    });
    const token2 = loginRes2.data.data.accessToken;

    // 4. Launch 20 simultaneous HTTP POST requests using Promise.all
    const startTime = Date.now();

    const requestPromises = Array.from({ length: 20 }).map(async (_, idx) => {
      const token = idx % 2 === 0 ? token1 : token2;
      const idempotencyKey = `concurrency_test_${idx + 1}_${Date.now()}_${Math.random()}`;

      try {
        const response = await axios.post(
          `${API_BASE}/bookings`,
          {
            serviceId: service.id || service._id,
            offeringId: offering._id,
            date: testDate,
            startTime: testStartTime,
            paymentMode: 'PAY_AFTER',
            notes: `Concurrent test client #${idx + 1}`,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Idempotency-Key': idempotencyKey,
            },
          }
        );
        return {
          index: idx + 1,
          status: response.status,
          success: true,
          bookingNumber: response.data.data.bookingNumber,
        };
      } catch (error: any) {
        return {
          index: idx + 1,
          status: error.response?.status || 500,
          success: false,
          errorCode: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
          errorMessage: error.response?.data?.error?.message || error.message,
        };
      }
    });

    const results = await Promise.all(requestPromises);
    const duration = Date.now() - startTime;

    console.log(`=============================================================`);
    console.log(`📊 CONCURRENCY TEST RESULTS (Completed in ${duration}ms)`);
    console.log(`=============================================================`);

    let successCount = 0;
    let conflictCount = 0;
    let otherErrorCount = 0;

    results.forEach((res) => {
      if (res.success && res.status === 201) {
        successCount++;
        console.log(`  [Req #${res.index.toString().padStart(2, ' ')}] ✅ 201 CREATED  -> Booking Number: ${res.bookingNumber}`);
      } else if (res.status === 409) {
        conflictCount++;
        console.log(`  [Req #${res.index.toString().padStart(2, ' ')}] ❌ 409 CONFLICT -> ${res.errorCode}: ${res.errorMessage}`);
      } else {
        otherErrorCount++;
        console.log(`  [Req #${res.index.toString().padStart(2, ' ')}] ⚠️ ${res.status} ERROR    -> ${res.errorMessage}`);
      }
    });

    console.log(`-------------------------------------------------------------`);
    console.log(`Total Requests Fired:    20`);
    console.log(`Successful Bookings:     ${successCount} (Target: 3)`);
    console.log(`Refused (409 Conflict):  ${conflictCount} (Target: 17)`);
    console.log(`Other Errors:            ${otherErrorCount} (Target: 0)`);
    console.log(`-------------------------------------------------------------`);

    if (successCount === 3 && conflictCount === 17) {
      console.log(`\n🎉 TEST PASSED! Exactly 3 bookings succeeded and 17 requests were safely refused with HTTP 409 Conflict.`);
      console.log(`The MongoDB document-level atomic conditional write lock completely prevented capacity overbooking.\n`);
      process.exit(0);
    } else {
      console.error(`\n❌ TEST FAILED! Expected 3 successes and 17 conflicts, but got ${successCount} successes and ${conflictCount} conflicts.`);
      process.exit(1);
    }
  } catch (err: any) {
    console.error(`[Error] Test execution failed:`, err.response?.data || err.message);
    process.exit(1);
  }
}

runConcurrencyTest();

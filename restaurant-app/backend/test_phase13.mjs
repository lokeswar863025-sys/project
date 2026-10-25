const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== RUNNING PHASE 13 AUTOMATED VALIDATION SUITE ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} -> ${details}`);
      failed++;
    }
  }

  try {
    const testDate = `2026-12-${Math.floor(10 + Math.random() * 18)}`;
    console.log(`Using fresh test date: ${testDate}`);

    const menuData = await fetch(`${BASE_URL}/menu`).then(r => r.json());
    const validItem = menuData.data && menuData.data[0] ? menuData.data[0] : { id: 'M01', name: 'Paneer Tikka', price: '₹349', price_numeric: 349 };

    // Cleanup any existing reservations for test date first
    // ----------------------------------------------------
    console.log('--- Step 0: Ensure Clean Test Table Setup ---');
    // Ensure Table T02 has capacity 4, owner_status = AVAILABLE, is_active = 1
    const resetRes = await fetch(`${BASE_URL}/admin/tables/T02`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capacity: 4, owner_status: 'AVAILABLE', is_active: 1 })
    }).then(r => r.json());
    assert(resetRes.success, 'Reset T02 capacity to 4 and AVAILABLE');

    // TEST 1: Table capacity = 4, Reserved = 0, Customer guests = 2
    // Expected: 4 capacity, 0 reserved, 4 available, AVAILABLE
    console.log('\n--- Running TEST 1 ---');
    let availRes = await fetch(`${BASE_URL}/tables/availability?date=${testDate}&arrivalTime=12:00 PM&leavingTime=01:00 PM&guests=2`)
      .then(r => r.json());
    let t02 = availRes.tables.find(t => t.id === 'T02');
    assert(
      t02 && t02.capacity === 4 && t02.reservedSeats === 0 && t02.availableSeats === 4 && t02.status === 'AVAILABLE',
      'TEST 1: Table capacity=4, Reserved=0, Guests=2 -> 4 cap, 0 res, 4 avail, AVAILABLE',
      JSON.stringify(t02)
    );

    // Book 2 seats on T02 for test customer A
    const custAId = 'cust_test_A';
    const bookResA = await fetch(`${BASE_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': custAId },
      body: JSON.stringify({
        table_id: 'T02',
        date: testDate,
        time: '12:00 PM',
        leaving_time: '01:00 PM',
        guests: 2,
        customer_name: 'Customer A'
      })
    }).then(r => r.json());
    assert(bookResA.success, 'Booked 2 seats on T02 for Customer A');

    // TEST 2: Table capacity = 4, Reserved = 2, Customer guests = 2
    // Expected: 4 capacity, 2 reserved, 2 available, AVAILABLE (or PARTIALLY_AVAILABLE)
    console.log('\n--- Running TEST 2 ---');
    availRes = await fetch(`${BASE_URL}/tables/availability?date=${testDate}&arrivalTime=12:00 PM&leavingTime=01:00 PM&guests=2`)
      .then(r => r.json());
    t02 = availRes.tables.find(t => t.id === 'T02');
    assert(
      t02 && t02.capacity === 4 && t02.reservedSeats === 2 && t02.availableSeats === 2 && (t02.status === 'AVAILABLE' || t02.status === 'PARTIALLY_AVAILABLE') && t02.canSelect === true,
      'TEST 2: Table capacity=4, Reserved=2, Guests=2 -> 4 cap, 2 res, 2 avail, AVAILABLE/Selectable',
      JSON.stringify(t02)
    );

    // TEST 3: Table capacity = 4, Reserved = 2, Customer guests = 3
    // Expected: 4 capacity, 2 reserved, 2 available, NOT ENOUGH SEATS
    console.log('\n--- Running TEST 3 ---');
    availRes = await fetch(`${BASE_URL}/tables/availability?date=${testDate}&arrivalTime=12:00 PM&leavingTime=01:00 PM&guests=3`)
      .then(r => r.json());
    t02 = availRes.tables.find(t => t.id === 'T02');
    assert(
      t02 && t02.capacity === 4 && t02.reservedSeats === 2 && t02.availableSeats === 2 && t02.status === 'NOT_ENOUGH_SEATS' && t02.canSelect === false,
      'TEST 3: Table capacity=4, Reserved=2, Guests=3 -> NOT ENOUGH SEATS, canSelect=false',
      JSON.stringify(t02)
    );

    // Book remaining 2 seats on T02 for customer B
    const custBId = 'cust_test_B';
    const bookResB = await fetch(`${BASE_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': custBId },
      body: JSON.stringify({
        table_id: 'T02',
        date: testDate,
        time: '12:00 PM',
        leaving_time: '01:00 PM',
        guests: 2,
        customer_name: 'Customer B'
      })
    }).then(r => r.json());
    assert(bookResB.success, 'Booked remaining 2 seats on T02 for Customer B');

    // TEST 4: Table capacity = 4, Reserved = 4, Customer guests = 1
    // Expected: FULL, 0 available
    console.log('\n--- Running TEST 4 ---');
    availRes = await fetch(`${BASE_URL}/tables/availability?date=${testDate}&arrivalTime=12:00 PM&leavingTime=01:00 PM&guests=1`)
      .then(r => r.json());
    t02 = availRes.tables.find(t => t.id === 'T02');
    assert(
      t02 && t02.capacity === 4 && t02.reservedSeats === 4 && t02.availableSeats === 0 && t02.status === 'FULL' && t02.canSelect === false,
      'TEST 4: Table capacity=4, Reserved=4, Guests=1 -> FULL, 0 available, canSelect=false',
      JSON.stringify(t02)
    );

    // TEST 5: Owner sets table to UNAVAILABLE
    // Expected: OWNER UNAVAILABLE, Customer cannot reserve it
    console.log('\n--- Running TEST 5 ---');
    await fetch(`${BASE_URL}/admin/tables/T02`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner_status: 'UNAVAILABLE' })
    });
    availRes = await fetch(`${BASE_URL}/tables/availability?date=${testDate}&arrivalTime=06:00 PM&leavingTime=07:00 PM&guests=2`)
      .then(r => r.json());
    t02 = availRes.tables.find(t => t.id === 'T02');
    assert(
      t02 && t02.ownerStatus === 'UNAVAILABLE' && t02.status === 'OWNER_UNAVAILABLE' && t02.canSelect === false,
      'TEST 5: Owner sets table to UNAVAILABLE -> status=OWNER_UNAVAILABLE, canSelect=false',
      JSON.stringify(t02)
    );

    // Attempt reservation on OWNER_UNAVAILABLE table should be rejected by backend
    const rejectBook = await fetch(`${BASE_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'cust_test_C' },
      body: JSON.stringify({
        table_id: 'T02',
        date: testDate,
        time: '06:00 PM',
        leaving_time: '07:00 PM',
        guests: 2
      })
    });
    assert(
      rejectBook.status === 403 || rejectBook.status === 400 || rejectBook.status === 409,
      'TEST 5b: Backend rejects reservation for OWNER_UNAVAILABLE table (HTTP 403/400)'
    );

    // TEST 6: Owner sets table back to AVAILABLE
    // Expected: Table becomes eligible for new reservations
    console.log('\n--- Running TEST 6 ---');
    await fetch(`${BASE_URL}/admin/tables/T02`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner_status: 'AVAILABLE' })
    });
    availRes = await fetch(`${BASE_URL}/tables/availability?date=${testDate}&arrivalTime=06:00 PM&leavingTime=07:00 PM&guests=2`)
      .then(r => r.json());
    t02 = availRes.tables.find(t => t.id === 'T02');
    assert(
      t02 && t02.ownerStatus === 'AVAILABLE' && t02.status === 'AVAILABLE' && t02.canSelect === true,
      'TEST 6: Owner sets table back to AVAILABLE -> status=AVAILABLE, canSelect=true',
      JSON.stringify(t02)
    );

    // TEST 7: Customer has no reservation, attempts to order food
    // Expected: PLEASE RESERVE A TABLE BEFORE ORDERING FOOD (403 Forbidden)
    console.log('\n--- Running TEST 7 ---');
    const orderWithoutRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'unreserved_customer' },
      body: JSON.stringify({
        table_id: 'T02',
        items: [{ id: validItem.id, name: validItem.name, price: validItem.price, price_numeric: validItem.price_numeric, quantity: 1 }],
        subtotal: validItem.price,
        tax: '₹17',
        total: validItem.price,
        total_numeric: validItem.price_numeric
      })
    });
    const orderWithoutResData = await orderWithoutRes.json();
    assert(
      orderWithoutRes.status === 403 && orderWithoutResData.message?.includes('PLEASE RESERVE A TABLE BEFORE ORDERING FOOD'),
      'TEST 7: Customer without reservation blocked from ordering (403: PLEASE RESERVE A TABLE BEFORE ORDERING FOOD)',
      JSON.stringify(orderWithoutResData)
    );

    // TEST 8: Customer with confirmed reservation orders food
    // Expected: Order succeeds and links reservation_id
    console.log('\n--- Running TEST 8 ---');
    const orderWithRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': custAId },
      body: JSON.stringify({
        table_id: 'T02',
        reservation_id: bookResA.data?.id,
        items: [{ id: validItem.id, name: validItem.name, price: validItem.price, price_numeric: validItem.price_numeric, quantity: 1 }],
        subtotal: validItem.price,
        tax: '₹17',
        total: validItem.price,
        total_numeric: validItem.price_numeric
      })
    });
    const orderWithResData = await orderWithRes.json();
    assert(
      orderWithRes.status === 201 && orderWithResData.success === true && orderWithResData.data?.reservation_id === bookResA.data?.id,
      'TEST 8: Customer with confirmed reservation successfully places order linked to reservation',
      JSON.stringify(orderWithResData)
    );

    // TEST 9: Customer attempts to order for another customer's reservation / table
    // Customer C tries to pass Customer A's reservation_id
    console.log('\n--- Running TEST 9 ---');
    const orderSpoof = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'attacker_cust_c' },
      body: JSON.stringify({
        table_id: 'T02',
        reservation_id: bookResA.data?.id,
        items: [{ id: validItem.id, name: validItem.name, price: validItem.price, price_numeric: validItem.price_numeric, quantity: 1 }],
        subtotal: validItem.price,
        tax: '₹17',
        total: validItem.price
      })
    });
    const orderSpoofData = await orderSpoof.json();
    assert(
      orderSpoof.status === 403,
      'TEST 9: Customer cannot order for another customer\'s reservation (403 rejected)',
      JSON.stringify(orderSpoofData)
    );

    // TEST 10: Concurrent / Exceeded Booking Protection
    // T02 at 12:00 PM already has 4/4 seats reserved. Customer C requests 1 guest.
    console.log('\n--- Running TEST 10 ---');
    const overbookRes = await fetch(`${BASE_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'cust_test_C' },
      body: JSON.stringify({
        table_id: 'T02',
        date: testDate,
        time: '12:00 PM',
        leaving_time: '01:00 PM',
        guests: 1
      })
    });
    const overbookData = await overbookRes.json();
    assert(
      overbookRes.status === 409 && overbookData.message?.includes('SORRY, THE SELECTED TABLE NO LONGER HAS ENOUGH AVAILABLE SEATS'),
      'TEST 10: Overbooking / Concurrent seat overflow rejected with 409: SORRY, THE SELECTED TABLE NO LONGER HAS ENOUGH AVAILABLE SEATS',
      JSON.stringify(overbookData)
    );

    // TEST 11: No table can accommodate requested guests at selected time
    console.log('\n--- Running TEST 11 ---');
    availRes = await fetch(`${BASE_URL}/tables/availability?date=${testDate}&arrivalTime=12:00 PM&leavingTime=01:00 PM&guests=50`)
      .then(r => r.json());
    assert(
      availRes.totalAvailableTablesForSelectedTime === 0,
      'TEST 11: 50 guests -> 0 available tables for this time',
      `available: ${availRes.totalAvailableTablesForSelectedTime}`
    );

    // TEST 12: No table available for any time on date
    console.log('\n--- Running TEST 12 ---');
    assert(
      availRes.hasAnyTableForGuests === false,
      'TEST 12: Guests=50 -> hasAnyTableForGuests is false (NO TABLES AVAILABLE FOR THIS DATE)',
      `hasAnyTable: ${availRes.hasAnyTableForGuests}`
    );

    // TEST 15 & 16: Interval Overlap Logic
    console.log('\n--- Running TEST 15 & 16 (Interval Logic) ---');
    // Non-overlapping interval: 03:00 PM - 04:00 PM should have 4 available seats on T02
    availRes = await fetch(`${BASE_URL}/tables/availability?date=${testDate}&arrivalTime=03:00 PM&leavingTime=04:00 PM&guests=2`)
      .then(r => r.json());
    t02 = availRes.tables.find(t => t.id === 'T02');
    assert(
      t02 && t02.availableSeats === 4 && t02.reservedSeats === 0,
      'TEST 15: Existing reservation at 12-1pm does NOT reduce availability at 3-4pm (non-overlapping)',
      `T02 avail: ${t02?.availableSeats}`
    );

    // Overlapping interval: 12:30 PM - 01:30 PM overlaps 12:00 PM - 01:00 PM reservation
    availRes = await fetch(`${BASE_URL}/tables/availability?date=${testDate}&arrivalTime=12:30 PM&leavingTime=01:30 PM&guests=2`)
      .then(r => r.json());
    t02 = availRes.tables.find(t => t.id === 'T02');
    assert(
      t02 && t02.reservedSeats === 4,
      'TEST 16: Interval 12:30 PM - 01:30 PM overlaps 12:00 PM - 01:00 PM -> reservedSeats counted as 4',
      `T02 res: ${t02?.reservedSeats}`
    );

    // Admin Table Management APIs
    console.log('\n--- Step 17: Admin Table CRUD Verification ---');
    const addTableRes = await fetch(`${BASE_URL}/admin/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumber: 'Table 99', capacity: 6, zone: 'VIP Lounge' })
    }).then(r => r.json());
    assert(addTableRes.success && addTableRes.data?.capacity === 6, 'Admin can add new table (Table 99)');

    const table99Id = addTableRes.data?.id;
    const patchCapRes = await fetch(`${BASE_URL}/admin/tables/${table99Id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capacity: 8 })
    }).then(r => r.json());
    assert(patchCapRes.success && patchCapRes.data?.capacity === 8, 'Admin can update capacity to 8');

    const deactRes = await fetch(`${BASE_URL}/admin/tables/${table99Id}`, {
      method: 'DELETE'
    }).then(r => r.json());
    assert(deactRes.success, 'Admin can soft-deactivate table preserving historical records');

    console.log(`\n========================================`);
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test suite error:', err);
    process.exit(1);
  }
}

runTests();

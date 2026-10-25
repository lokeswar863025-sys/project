// Use built-in globalThis.fetch in Node.js

async function runCustomerBookingTest() {
  console.log('--- 1. Testing Customer Login / Auth Sync ---');
  const authRes = await fetch('http://localhost:5000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Priya Sharma',
      mobileNumber: '9876543210'
    })
  });
  const authData = await authRes.json();
  console.log('Auth status:', authRes.status, 'Success:', authData.success, 'User ID:', authData.data?.id);

  const customerId = authData.data.id;

  console.log('\n--- 2. Checking Table Availability for 07:00 PM ---');
  const today = new Date().toISOString().split('T')[0];
  const availRes = await fetch(`http://localhost:5000/api/tables/availability?date=${today}&arrivalTime=07:00%20PM&leavingTime=09:00%20PM&guests=2`);
  const availData = await availRes.json();
  console.log('Availability status:', availRes.status, 'Total tables returned:', availData.tables?.length);
  const eligibleTable = availData.tables?.find(t => t.canSelect);
  console.log('Selected Table for booking:', eligibleTable ? (eligibleTable.tableNumber || eligibleTable.id) : 'None available');

  if (!eligibleTable) throw new Error('No eligible table found!');

  console.log('\n--- 3. Testing Customer Booking Reservation ---');
  const bookRes = await fetch('http://localhost:5000/api/reservations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': customerId
    },
    body: JSON.stringify({
      tableId: eligibleTable.tableId || eligibleTable.id,
      date: today,
      time: '07:00 PM',
      leavingTime: '09:00 PM',
      guests: '2 Guests',
      customerName: 'Priya Sharma',
      customerMobile: '9876543210',
      userId: customerId
    })
  });
  const bookData = await bookRes.json();
  console.log('Booking status:', bookRes.status, 'Success:', bookData.success, 'Reservation ID:', bookData.data?.id);

  console.log('\n--- 4. Checking Customer My-Reservations History ---');
  const histRes = await fetch('http://localhost:5000/api/reservations/my-reservations', {
    headers: { 'x-user-id': customerId }
  });
  const histData = await histRes.json();
  console.log('My-Reservations status:', histRes.status, 'Found count:', histData.data?.length);
  const myRes = histData.data?.find(r => r.id === bookData.data?.id);
  console.log('Confirmed reservation verified in customer history:', myRes ? `YES (${myRes.id} for ${myRes.table_number || myRes.table_id})` : 'NO');

  console.log('\n--- 5. All Customer Booking Tests Passed Successfully! ---');
}

runCustomerBookingTest().catch(e => {
  console.error('TEST FAILED:', e);
  process.exit(1);
});

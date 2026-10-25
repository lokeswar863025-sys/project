export const TABLE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  SELECTED: 'SELECTED',
  UNAVAILABLE: 'UNAVAILABLE',
  HELD: 'HELD',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED'
};

export const RESTAURANT_TABLES = [
  { id: 'T01', name: 'Table 01', capacity: 2, guestsText: '2 Guests', zone: 'Patio Lounge', description: 'Intimate outdoor patio seating with ambient glow lighting.' },
  { id: 'T02', name: 'Table 02', capacity: 4, guestsText: '4 Guests', zone: 'Main Dining', description: 'Central dining hall table with comfortable leather seating.' },
  { id: 'T03', name: 'Table 03', capacity: 4, guestsText: '4 Guests', zone: 'Window View', description: 'Panoramic glass window table overlooking city skyline.' },
  { id: 'T04', name: 'Table 04', capacity: 6, guestsText: '6 Guests', zone: 'Executive Booth', description: 'Spacious semi-private dining booth for group dining.' },
  { id: 'T05', name: 'Table 05', capacity: 8, guestsText: '8 Guests', zone: 'VIP Lounge', description: 'Exclusive 8-seat VIP marble table with dedicated butler service.' },
  { id: 'T06', name: 'Table 06', capacity: 2, guestsText: '2 Guests', zone: 'Chef Counter', description: 'Front-row seat observing culinary chef preparation.' },
  { id: 'T07', name: 'Table 07', capacity: 4, guestsText: '4 Guests', zone: 'Patio Garden', description: 'Veranda garden booth surrounded by lush natural foliage.' },
  { id: 'T08', name: 'Table 08', capacity: 6, guestsText: '6 Guests', zone: 'Wine Cellar', description: 'Rustic stone cellar booth adjacent to sommelier collection.' }
];

export const AVAILABLE_TIME_SLOTS = [
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '01:00 PM',
  '01:30 PM',
  '07:00 PM',
  '07:30 PM',
  '08:00 PM',
  '08:30 PM',
  '09:00 PM'
];

export const TIME_SLOTS = AVAILABLE_TIME_SLOTS;

export const GUEST_OPTIONS = [
  '1 Guest',
  '2 Guests',
  '4 Guests',
  '6 Guests',
  '8+ Guests'
];

// Parse time string e.g. "12:00 PM" to minutes from midnight
export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 720;
  const parts = timeStr.trim().split(' ');
  if (parts.length !== 2) return 720;
  const [hhmm, period] = parts;
  let [hours, minutes] = hhmm.split(':').map(Number);
  if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// Generate Customer Leaving Time Options (Up to 2 Hours Max Limit)
export function getLeavingTimeOptions(arrivalTimeSlot, maxHours = 2) {
  if (!arrivalTimeSlot) return [{ time: '02:00 PM', label: '02:00 PM (2 Hours Max Limit)' }];
  
  const arrivalMinutes = parseTimeToMinutes(arrivalTimeSlot);
  const options = [];
  
  for (let offset = 30; offset <= maxHours * 60; offset += 30) {
    let totalMins = arrivalMinutes + offset;
    let h = Math.floor(totalMins / 60) % 24;
    let m = totalMins % 60;
    
    let p = h >= 12 ? 'PM' : 'AM';
    let dh = h % 12;
    if (dh === 0) dh = 12;
    
    const formattedM = m < 10 ? `0${m}` : m;
    const formattedH = dh < 10 ? `0${dh}` : dh;
    const timeText = `${formattedH}:${formattedM} ${p}`;
    
    const durationLabel = offset === 120 ? '2 Hours (Max Limit)' : `${offset / 60} Hour${offset > 60 ? 's' : ''}`;
    options.push({ time: timeText, label: `${timeText} (${durationLabel})`, durationMins: offset });
  }
  
  return options;
}

export function calculateLeavingTime(arrivalTimeSlot, durationHours = 2) {
  const opts = getLeavingTimeOptions(arrivalTimeSlot, durationHours);
  return opts[opts.length - 1]?.time || '02:00 PM';
}

const LOCAL_STORAGE_KEY = 'nowait_reservations_v1';

function getStoredReservations() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }

  const initial = [
    {
      id: 'NW-2026-8942',
      userId: 'sample-user-99',
      customerName: 'Marcus Vance',
      customerMobile: '',
      tableId: 'T04',
      tableName: 'Table 04',
      date: '2026-08-15',
      timeSlot: '08:00 PM',
      leavingTime: '10:00 PM',
      duration: '2 Hours (Max)',
      guestCount: '6 Guests',
      status: TABLE_STATUS.CONFIRMED,
      createdAt: new Date().toISOString()
    }
  ];
  saveStoredReservations(initial);
  return initial;
}

function saveStoredReservations(reservations) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reservations));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

// Evaluate Real-Time Interval Overlap & Guest Capacity
export function isTableAvailable(tableId, date, timeSlot, leavingTime = null, guestCount = '2 Guests') {
  if (!tableId || !date || !timeSlot) return true;
  
  const numGuests = parseInt(guestCount.toString().replace(/[^0-9]/g, ''), 10) || 2;
  const table = RESTAURANT_TABLES.find((t) => t.id === tableId);
  if (table && table.capacity < numGuests) return false;

  const reqStart = parseTimeToMinutes(timeSlot);
  const reqEnd = leavingTime ? parseTimeToMinutes(leavingTime) : reqStart + 120;

  const reservations = getStoredReservations();
  const hasOverlap = reservations.some((res) => {
    if (res.tableId !== tableId || res.date !== date) return false;
    if (res.status !== TABLE_STATUS.CONFIRMED && res.status !== TABLE_STATUS.HELD) return false;

    const existingStart = parseTimeToMinutes(res.timeSlot || res.time);
    const existingEnd = res.leavingTime || res.leaving_time
      ? parseTimeToMinutes(res.leavingTime || res.leaving_time)
      : existingStart + 120;

    // Overlap Formula: existingStart < reqEnd AND existingEnd > reqStart
    return existingStart < reqEnd && existingEnd > reqStart;
  });

  return !hasOverlap;
}

export function getTablesWithStatus(date, timeSlot, selectedTableId = null, guestCount = '2 Guests') {
  return RESTAURANT_TABLES.map((table) => {
    const available = isTableAvailable(table.id, date, timeSlot, null, guestCount);
    let status = available ? TABLE_STATUS.AVAILABLE : TABLE_STATUS.UNAVAILABLE;

    if (available && selectedTableId === table.id) {
      status = TABLE_STATUS.SELECTED;
    }

    return {
      ...table,
      status,
      isAvailable: available
    };
  });
}

export function createReservation({ userId, customerName, customerMobile, date, timeSlot, leavingTime, guestCount, tableId }) {
  if (!isTableAvailable(tableId, date, timeSlot, leavingTime, guestCount)) {
    throw new Error(`Table ${tableId} is already booked for ${date} at ${timeSlot}. Please select another table or time slot.`);
  }

  const table = RESTAURANT_TABLES.find((t) => t.id === tableId);
  const reservationId = `NW-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const finalLeavingTime = leavingTime || calculateLeavingTime(timeSlot, 2);

  const newReservation = {
    id: reservationId,
    userId,
    customerName,
    customerMobile,
    tableId,
    tableName: table ? table.name : tableId,
    tableZone: table ? table.zone : 'Main Dining',
    date,
    timeSlot,
    leavingTime: finalLeavingTime,
    duration: '2 Hours (Max)',
    guestCount,
    status: TABLE_STATUS.CONFIRMED,
    createdAt: new Date().toISOString()
  };

  const reservations = getStoredReservations();
  reservations.unshift(newReservation);
  saveStoredReservations(reservations);

  return newReservation;
}

export function getUserReservations(userId) {
  const reservations = getStoredReservations();
  if (!userId) return reservations;
  const cleanMobile = typeof userId === 'string' ? userId.replace(/[^0-9]/g, '').slice(-10) : '';
  return reservations.filter((r) => 
    r.userId === userId || 
    (cleanMobile && (r.customerMobile === cleanMobile || (r.userId && r.userId.includes(cleanMobile))))
  );
}

export function cancelReservation(reservationId) {
  const reservations = getStoredReservations();
  const updated = reservations.map((r) => {
    if (r.id === reservationId) {
      return { ...r, status: TABLE_STATUS.CANCELLED };
    }
    return r;
  });
  saveStoredReservations(updated);
  return updated;
}

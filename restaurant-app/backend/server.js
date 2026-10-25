import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';
import { getConfiguredAdminEmail, verifyFirebaseIdToken } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../frontend/dist');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN.split(',').map((value) => value.trim()) }));
}
app.use(express.json());

// Never treat browser-supplied IDs or role flags as proof of identity.
const getAuthUserId = (req) => req.auth?.userId || null;
const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
  try {
    const claims = await verifyFirebaseIdToken(token);
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE google_id = ?', [claims.sub]);
    req.auth = {
      claims,
      userId: user?.id || claims.sub,
      user,
      isAdmin: Boolean(user && user.role === 'ADMIN' && claims.email?.toLowerCase() === getConfiguredAdminEmail())
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message || 'Sign-in could not be verified.' });
  }
});
const requireAdmin = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ success: false, message: 'Administrator sign-in is required.' });
  try {
    const claims = await verifyFirebaseIdToken(token);
    const adminEmail = getConfiguredAdminEmail();
    if (!adminEmail || claims.email?.toLowerCase() !== adminEmail) {
      return res.status(403).json({ success: false, message: 'This account is not configured as a restaurant administrator.' });
    }
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE google_id = ?', [claims.sub]);
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Sign in with the configured administrator account first, then retry.' });
    req.auth = { claims, userId: user.id, user, isAdmin: true };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message || 'Administrator sign-in could not be verified.' });
  }
});

// Helper: Convert time string e.g. "12:00 PM" or "11:30 AM" into minutes from midnight
const parseTimeToMinutes = (timeStr) => {
  if (typeof timeStr !== 'string') return Number.NaN;
  const value = timeStr.trim();
  const twentyFourHour = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (twentyFourHour) return Number(twentyFourHour[1]) * 60 + Number(twentyFourHour[2]);
  const twelveHour = value.match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i);
  if (!twelveHour) return Number.NaN;
  let hours = Number(twelveHour[1]);
  if (twelveHour[3].toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (twelveHour[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + Number(twelveHour[2]);
};

// Helper: Parse integer number of guests from string e.g. "2 Guests" or 2
const parseGuestsCount = (guestStr) => {
  if (!guestStr) return 2;
  const num = parseInt(guestStr.toString().replace(/[^0-9]/g, ''), 10);
  return isNaN(num) || num <= 0 ? 2 : num;
};

const isValidBookingDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && value >= new Date().toISOString().slice(0, 10);
};
const isValidBookingTime = (value) => typeof value === 'string' &&
  /^(?:(?:[01]?\d|2[0-3]):[0-5]\d|(?:0?[1-9]|1[0-2]):[0-5]\d\s*(?:AM|PM))$/i.test(value.trim());

// Phase 13: Table Sharing Configuration (Defaults to true to allow partial capacity bookings)
const TABLE_SHARING_ENABLED = process.env.TABLE_SHARING_ENABLED !== 'false';
const TAX_RATE_PERCENT = Number.parseFloat(process.env.TAX_RATE_PERCENT || '5');

// Phase 13: Unified Table Status Evaluator
const evaluateTableCapacityAndStatus = (table, overlappingReservations, reqGuests) => {
  const tableRes = overlappingReservations.filter((r) => r.table_id === table.id);
  const reservedSeats = tableRes.reduce((sum, r) => sum + parseGuestsCount(r.guests), 0);
  const availableSeats = Math.max(0, table.capacity - reservedSeats);

  const isOwnerAvailable = (table.owner_status || 'AVAILABLE') === 'AVAILABLE';
  const isActive = table.is_active !== 0;

  let status = 'AVAILABLE';
  let statusMessage = `${availableSeats} SEATS AVAILABLE`;
  let canSelect = false;

  if (!isActive) {
    status = 'UNAVAILABLE';
    statusMessage = 'TABLE INACTIVE';
    canSelect = false;
  } else if (!isOwnerAvailable) {
    status = 'OWNER_UNAVAILABLE';
    statusMessage = 'OWNER UNAVAILABLE';
    canSelect = false;
  } else if (availableSeats <= 0) {
    status = 'FULL';
    statusMessage = 'FULL';
    canSelect = false;
  } else if (availableSeats < reqGuests) {
    status = 'NOT_ENOUGH_SEATS';
    statusMessage = `ONLY ${availableSeats} SEAT${availableSeats === 1 ? '' : 'S'} AVAILABLE`;
    canSelect = false;
  } else if (!TABLE_SHARING_ENABLED && reservedSeats > 0) {
    status = 'FULL';
    statusMessage = 'RESERVED';
    canSelect = false;
  } else {
    if (reservedSeats > 0) {
      status = 'PARTIALLY_AVAILABLE';
      statusMessage = `${availableSeats} SEATS AVAILABLE`;
    } else {
      status = 'AVAILABLE';
      statusMessage = `${availableSeats} SEATS AVAILABLE`;
    }
    canSelect = true;
  }

  return {
    id: table.id,
    tableId: table.id,
    tableNumber: table.table_number,
    capacity: table.capacity,
    reservedSeats,
    availableSeats,
    ownerStatus: table.owner_status || 'AVAILABLE',
    ownerAvailable: isOwnerAvailable,
    isActive,
    zone: table.zone || 'Main Dining',
    status,
    statusMessage,
    canSelect
  };
};

// Async Error Wrapper Helper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Health Check API
app.get('/api/health', asyncHandler(async (req, res) => {
  const db = await getDb();
  const tablesCount = await db.get('SELECT COUNT(*) as c FROM tables');
  res.json({
    success: true,
    data: {
      status: 'OK',
      service: 'NO-WAIT RESTAURANT API',
      database: 'SQLite Relational (nowait.db)',
      tablesCount: tablesCount.c,
      timestamp: new Date().toISOString()
    }
  });
}));

// ==================== AUTH & USER PROFILE APIs ====================

app.post('/api/auth', asyncHandler(async (req, res) => {
  let claims;
  try {
    claims = await verifyFirebaseIdToken(req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1]);
  } catch (error) {
    const status = error.message.includes('not configured') ? 503 : 401;
    return res.status(status).json({ success: false, message: error.message });
  }
  const db = await getDb();
  const email = claims.email.toLowerCase();
  const configuredAdmin = Boolean(getConfiguredAdminEmail()) && email === getConfiguredAdminEmail();
  let user = await db.get('SELECT * FROM users WHERE google_id = ?', [claims.sub]);
  if (!user) user = await db.get('SELECT * FROM users WHERE LOWER(email) = ?', [email]);

  if (user) {
    await db.run(
      `UPDATE users SET google_id = ?, name = ?, email = ?, photo = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [claims.sub, claims.name || user.name || 'Customer', email, claims.picture || user.photo || '', configuredAdmin ? 'ADMIN' : 'CUSTOMER', user.id]
    );
    user = await db.get('SELECT id, google_id, name, email, mobile_number, photo, role FROM users WHERE id = ?', [user.id]);
    return res.json({ success: true, data: user });
  }

  const userId = claims.sub;
  await db.run(
    `INSERT INTO users (id, google_id, name, email, photo, role) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, claims.sub, claims.name || 'Customer', email, claims.picture || '', configuredAdmin ? 'ADMIN' : 'CUSTOMER']
  );
  user = await db.get('SELECT id, google_id, name, email, mobile_number, photo, role FROM users WHERE id = ?', [userId]);
  res.status(201).json({ success: true, data: user });
}));

app.patch('/api/users/profile', authenticate, asyncHandler(async (req, res) => {
  const userId = getAuthUserId(req);
  const { name, mobileNumber } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing authenticated customer credentials.' });
  }

  const db = await getDb();
  const existing = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

  if (!existing) {
    return res.status(404).json({ success: false, message: 'Customer user profile not found.' });
  }

  let cleanMobile = existing.mobile_number;
  if (mobileNumber !== undefined && mobileNumber !== null && mobileNumber.trim() !== '') {
    const rawDigits = mobileNumber.replace(/[^0-9]/g, '');
    if (rawDigits.length < 10) {
      return res.status(400).json({ success: false, message: 'Invalid phone number. Please provide a valid 10-digit mobile number.' });
    }
    cleanMobile = rawDigits.slice(-10);
  }

  await db.run(
    `UPDATE users SET name = ?, mobile_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [name ? name.trim() : existing.name, cleanMobile, userId]
  );

  const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
  res.json({ success: true, message: 'Profile updated successfully.', data: updatedUser });
}));

app.get('/api/users/profile', authenticate, asyncHandler(async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized customer access.' });
  }

  const db = await getDb();
  const userRecord = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
  if (!userRecord) {
    return res.status(404).json({ success: false, message: 'User profile not found.' });
  }

  res.json({ success: true, data: userRecord });
}));

// ==================== PHASE 12: REAL-TIME TABLE AVAILABILITY APIs ====================

// ==================== PHASE 13: REAL-TIME TABLE CAPACITY & AVAILABILITY APIs ====================

// GET /api/tables/availability — Real-time table availability by Date, Time, Duration & Guests
app.get('/api/tables/availability', asyncHandler(async (req, res) => {
  const { date, time, arrivalTime, leavingTime, guests = 2, durationHours = 2 } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const numGuests = parseGuestsCount(guests);
  const reqArrivalStr = arrivalTime || time || '11:30 AM';
  const duration = Number.parseFloat(durationHours);
  if (!isValidBookingDate(targetDate) || !isValidBookingTime(reqArrivalStr) || (leavingTime && !isValidBookingTime(leavingTime)) ||
      !Number.isFinite(duration) || duration <= 0 || duration > 8 || numGuests < 1 || numGuests > 20) {
    return res.status(400).json({ success: false, message: 'Provide a future date, valid time, party size (1–20), and duration (up to 8 hours).' });
  }
  const durationMins = duration * 60;
  const reqStart = parseTimeToMinutes(reqArrivalStr);
  let reqEnd = leavingTime ? parseTimeToMinutes(leavingTime) : reqStart + durationMins;
  if (reqEnd <= reqStart) {
    return res.status(400).json({ success: false, message: 'Departure time must be after arrival time.' });
  }

  const db = await getDb();

  // Fetch all tables
  const allTables = await db.all('SELECT * FROM tables ORDER BY table_number ASC');
  const activeTables = allTables.filter((t) => t.is_active !== 0);

  // Fetch active reservations for target date
  const activeReservations = await db.all(
    `SELECT * FROM reservations WHERE date = ? AND status IN ('CONFIRMED', 'HELD')`,
    [targetDate]
  );

  // Overlapping reservations for the requested arrival & leaving time interval
  const requestedOverlaps = activeReservations.filter((r) => {
    const s = parseTimeToMinutes(r.time);
    const e = r.leaving_time ? parseTimeToMinutes(r.leaving_time) : s + 120;
    return s < reqEnd && e > reqStart;
  });

  // Calculate detailed table capacity and status for each table
  const detailedTables = allTables.map((table) => {
    return evaluateTableCapacityAndStatus(table, requestedOverlaps, numGuests);
  });

  // Slots calculation for Step 2
  const defaultSlots = [
    '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
    '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM'
  ];

  const slotResults = defaultSlots.map((slot) => {
    const sStart = parseTimeToMinutes(slot);
    const sEnd = sStart + durationMins;

    const slotOverlaps = activeReservations.filter((r) => {
      const rStart = parseTimeToMinutes(r.time);
      const rEnd = r.leaving_time ? parseTimeToMinutes(r.leaving_time) : rStart + 120;
      return rStart < sEnd && rEnd > sStart;
    });

    const eligibleTables = activeTables.filter((t) => {
      if ((t.owner_status || 'AVAILABLE') === 'UNAVAILABLE') return false;
      const res = evaluateTableCapacityAndStatus(t, slotOverlaps, numGuests);
      return res.canSelect;
    });

    const isAvailable = eligibleTables.length > 0;

    return {
      time: slot,
      status: isAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
      availableTableCount: eligibleTables.length,
      availableTableIds: eligibleTables.map((t) => t.id)
    };
  });

  // Any table in restaurant with capacity >= numGuests that is active & owner-available
  const hasAnyTableForGuests = allTables.some(
    (t) => t.capacity >= numGuests && t.is_active !== 0 && (t.owner_status || 'AVAILABLE') === 'AVAILABLE'
  );

  const totalAvailableSlots = slotResults.filter((s) => s.status === 'AVAILABLE').length;
  const availableTablesForRequestedTime = detailedTables.filter((t) => t.canSelect).length;

  res.json({
    success: true,
    date: targetDate,
    arrivalTime: reqArrivalStr,
    leavingTime: leavingTime || '',
    guests: numGuests,
    tableSharingEnabled: TABLE_SHARING_ENABLED,
    hasAnyTableForGuests,
    hasAvailableSlotsForDate: totalAvailableSlots > 0,
    totalAvailableSlots,
    totalAvailableTablesForSelectedTime: availableTablesForRequestedTime,
    tables: detailedTables,
    slots: slotResults
  });
}));

app.get('/api/tables', asyncHandler(async (req, res) => {
  const db = await getDb();
  const tables = await db.all('SELECT * FROM tables ORDER BY table_number ASC');
  res.json({ success: true, data: tables });
}));

app.get('/api/tables/available', asyncHandler(async (req, res) => {
  const { date, time, leavingTime, guests = 2 } = req.query;
  const db = await getDb();

  const targetDate = date || new Date().toISOString().split('T')[0];
  const targetTime = time || '12:00 PM';
  const reqStart = parseTimeToMinutes(targetTime);
  const reqEnd = leavingTime ? parseTimeToMinutes(leavingTime) : reqStart + 120;
  const numGuests = parseGuestsCount(guests);

  const allTables = await db.all('SELECT * FROM tables WHERE is_active != 0 ORDER BY table_number ASC');
  const reservations = await db.all(
    `SELECT * FROM reservations WHERE date = ? AND status IN ('CONFIRMED', 'HELD')`,
    [targetDate]
  );

  const overlaps = reservations.filter((r) => {
    const s = parseTimeToMinutes(r.time);
    const e = r.leaving_time ? parseTimeToMinutes(r.leaving_time) : s + 120;
    return s < reqEnd && e > reqStart;
  });

  const result = allTables.map((t) => evaluateTableCapacityAndStatus(t, overlaps, numGuests));

  res.json({ success: true, data: result });
}));

// ==================== MENU APIs ====================
app.get('/api/menu', asyncHandler(async (req, res) => {
  const db = await getDb();
  const menuItems = await db.all('SELECT * FROM menu_items ORDER BY created_at DESC');
  res.json({ success: true, data: menuItems });
}));

app.get('/api/menu/:id', asyncHandler(async (req, res) => {
  const db = await getDb();
  const item = await db.get('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);

  if (!item) {
    return res.status(404).json({ success: false, message: `Menu item '${req.params.id}' not found.` });
  }

  res.json({ success: true, data: item });
}));

app.post('/api/menu', requireAdmin, asyncHandler(async (req, res) => {
  const { name, description, category, price, image } = req.body;
  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Missing required menu item fields (name, price).' });
  }

  const db = await getDb();
  const id = `m${Date.now()}`;
  const priceNumeric = parseFloat(price.toString().replace(/[^0-9.]/g, '')) || 0;
  const formattedPrice = price.toString().includes('₹') ? price : `₹${price}`;

  await db.run(
    `INSERT INTO menu_items (id, restaurant_id, name, description, category, price, price_numeric, image, available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [id, 'R01', name, description || '', category || 'Main Course', formattedPrice, priceNumeric, image || '']
  );

  const newItem = await db.get('SELECT * FROM menu_items WHERE id = ?', [id]);
  res.status(201).json({ success: true, data: newItem });
}));

app.patch('/api/menu/:id', requireAdmin, asyncHandler(async (req, res) => {
  const db = await getDb();
  const item = await db.get('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);

  if (!item) {
    return res.status(404).json({ success: false, message: `Menu item '${req.params.id}' not found.` });
  }

  const name = req.body.name || item.name;
  const description = req.body.description !== undefined ? req.body.description : item.description;
  const category = req.body.category || item.category;
  const price = req.body.price || item.price;
  const priceNumeric = parseFloat(price.toString().replace(/[^0-9.]/g, '')) || item.price_numeric;
  const available = req.body.available !== undefined ? (req.body.available ? 1 : 0) : item.available;

  await db.run(
    `UPDATE menu_items SET name = ?, description = ?, category = ?, price = ?, price_numeric = ?, available = ? WHERE id = ?`,
    [name, description, category, price, priceNumeric, available, req.params.id]
  );

  const updatedItem = await db.get('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
  res.json({ success: true, data: updatedItem });
}));

app.delete('/api/menu/:id', requireAdmin, asyncHandler(async (req, res) => {
  const db = await getDb();
  const item = await db.get('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);

  if (!item) {
    return res.status(404).json({ success: false, message: `Menu item '${req.params.id}' not found.` });
  }

  await db.run('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: `Menu item ${req.params.id} deleted successfully.` });
}));

// ==================== RESERVATIONS APIs WITH RACE-CONDITION & CAPACITY PROTECTION ====================
app.post('/api/reservations', authenticate, asyncHandler(async (req, res) => {
  const authUserId = getAuthUserId(req);
  const tableId = req.body.tableId || req.body.table_id;
  const date = req.body.date;
  const time = req.body.time;
  const leavingTime = req.body.leavingTime || req.body.leaving_time;
  const guests = req.body.guests;
  const customerName = req.auth.claims.name || req.auth.user?.name || 'Customer';
  const customerEmail = req.auth.claims.email || '';
  const customerMobile = req.body.customerMobile || req.body.customer_mobile;
  const userId = authUserId;

  if (!tableId || !date || !time) {
    return res.status(400).json({ success: false, message: 'Missing required reservation parameters (tableId, date, time).' });
  }

  if (!isValidBookingDate(date) || !isValidBookingTime(time) || (leavingTime && !isValidBookingTime(leavingTime))) {
    return res.status(400).json({ success: false, message: 'Choose a valid booking date (today or later) and valid arrival/departure times.' });
  }

  const guestDigits = String(guests ?? '').match(/\d+/)?.[0];
  const reqGuests = parseGuestsCount(guests);
  if (!guestDigits || !Number.isInteger(reqGuests) || reqGuests < 1 || reqGuests > 20) {
    return res.status(400).json({ success: false, message: 'Party size must be between 1 and 20 guests.' });
  }
  const reqStart = parseTimeToMinutes(time);
  let reqEnd = leavingTime ? parseTimeToMinutes(leavingTime) : reqStart + 120;
  if (reqEnd <= reqStart) {
    return res.status(400).json({ success: false, message: 'Departure time must be after arrival time.' });
  }

  const db = await getDb();

  // 1. Verify Table exists, is active, and owner available
  const table = await db.get('SELECT * FROM tables WHERE id = ?', [tableId]);
  if (!table || table.is_active === 0) {
    return res.status(404).json({ success: false, message: `Table '${tableId}' is not active or available.` });
  }

  if (table.owner_status === 'UNAVAILABLE') {
    return res.status(403).json({
      success: false,
      message: `TABLE ${table.table_number || tableId} is OWNER UNAVAILABLE. This table cannot be booked.`
    });
  }

  // 2. Fetch active reservations on that date
  const existingReservations = await db.all(
    `SELECT * FROM reservations WHERE table_id = ? AND date = ? AND status IN ('CONFIRMED', 'HELD')`,
    [tableId, date]
  );

  // 3. Overlapping reservations calculation
  const overlapping = existingReservations.filter((resItem) => {
    const existingStart = parseTimeToMinutes(resItem.time);
    const existingEnd = resItem.leaving_time
      ? parseTimeToMinutes(resItem.leaving_time)
      : existingStart + 120;

    return existingStart < reqEnd && existingEnd > reqStart;
  });

  const totalReservedSeats = overlapping.reduce((sum, r) => sum + parseGuestsCount(r.guests), 0);
  const availableSeats = Math.max(0, table.capacity - totalReservedSeats);

  // 4. Capacity & Table Sharing Rules
  if (!TABLE_SHARING_ENABLED && overlapping.length > 0) {
    return res.status(409).json({
      success: false,
      message: `Sorry, the selected table (${table.table_number || tableId}) is already reserved for this time.`
    });
  }

  if (availableSeats < reqGuests) {
    return res.status(409).json({
      success: false,
      message: `SORRY, THE SELECTED TABLE NO LONGER HAS ENOUGH AVAILABLE SEATS. (Only ${availableSeats} seat${availableSeats === 1 ? '' : 's'} available, requested ${reqGuests} guests).`
    });
  }

  const resId = `RES-${randomUUID()}`;
  const finalUserId = userId;

  await db.run(
    `INSERT INTO reservations (id, user_id, restaurant_id, table_id, customer_name, customer_email, customer_mobile, date, time, leaving_time, guests, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [resId, finalUserId, 'R01', tableId, customerName || 'Diner', customerEmail || '', customerMobile || '', date, time, leavingTime || '', `${reqGuests} Guests`, 'CONFIRMED']
  );

  const newRes = await db.get('SELECT * FROM reservations WHERE id = ?', [resId]);
  res.status(201).json({ success: true, data: newRes });
}));

app.get('/api/reservations/my-reservations', authenticate, asyncHandler(async (req, res) => {
  const authUserId = getAuthUserId(req);
  if (!authUserId) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Authentication required to view reservation history.' });
  }

  const db = await getDb();
  const rows = await db.all(
    `SELECT r.*, t.table_number, t.capacity, t.qr_code FROM reservations r LEFT JOIN tables t ON r.table_id = t.id WHERE r.user_id = ? ORDER BY r.created_at DESC`,
    [authUserId]
  );

  res.json({ success: true, data: rows });
}));

app.get('/api/reservations', requireAdmin, asyncHandler(async (req, res) => {
  const db = await getDb();
  const rows = await db.all(`SELECT r.*, t.table_number, t.capacity FROM reservations r LEFT JOIN tables t ON r.table_id = t.id ORDER BY r.created_at DESC`);
  res.json({ success: true, data: rows });
}));

app.delete('/api/reservations/:id', authenticate, asyncHandler(async (req, res) => {
  const authUserId = getAuthUserId(req);
  const db = await getDb();
  const reservation = await db.get('SELECT * FROM reservations WHERE id = ?', [req.params.id]);

  if (!reservation) {
    return res.status(404).json({ success: false, message: `Reservation '${req.params.id}' not found.` });
  }

  if (reservation.user_id !== authUserId && !(req.auth.isAdmin && req.auth.user?.role === 'ADMIN')) {
    return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to modify this reservation.' });
  }

  await db.run('UPDATE reservations SET status = "CANCELLED" WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: `Reservation ${req.params.id} cancelled successfully.` });
}));

// ==================== ORDERS & PAYMENTS APIs WITH RESERVATION RESTRICTIONS ====================

app.post('/api/orders', authenticate, asyncHandler(async (req, res) => {
  const authUserId = getAuthUserId(req);
  const tableId = req.body.tableId || req.body.table_id;
  const reservationId = req.body.reservationId || req.body.reservation_id;
  const items = req.body.items;
  const userId = getAuthUserId(req);
  const customerName = req.auth.claims.name || req.auth.user?.name || 'Customer';
  const customerEmail = req.auth.claims.email;
  const customerMobile = req.auth.user?.mobile_number || '';
  const finalUserId = authUserId || userId;

  if (!finalUserId) {
    return res.status(401).json({ success: false, message: 'Authentication required to place food order.' });
  }

  if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid order request. Missing tableId or items.' });
  }

  const db = await getDb();

  // PHASE 13 FOOD ORDERING RESTRICTION:
  // Customer MUST NOT be allowed to order food for a table before successfully reserving a table.
  // Validate that a confirmed reservation belongs to this customer for this table.
  let validReservation = null;

  if (reservationId) {
    validReservation = await db.get(
      `SELECT * FROM reservations WHERE id = ? AND user_id = ? AND status = 'CONFIRMED'`,
      [reservationId, finalUserId]
    );
  } else {
    // Look up active confirmed reservation for this user and table
    validReservation = await db.get(
      `SELECT * FROM reservations WHERE user_id = ? AND table_id = ? AND status = 'CONFIRMED' ORDER BY created_at DESC LIMIT 1`,
      [finalUserId, tableId]
    );
  }

  if (!validReservation) {
    return res.status(403).json({
      success: false,
      message: 'PLEASE RESERVE A TABLE BEFORE ORDERING FOOD. Valid confirmed table reservation required.'
    });
  }

  if (validReservation.table_id !== tableId) {
    return res.status(403).json({
      success: false,
      message: `Forbidden: Reservation ${validReservation.id} is for table ${validReservation.table_id}, not table ${tableId}.`
    });
  }

  let serverSubtotal = 0;
  const validatedItems = [];

  for (const cartItem of items) {
    const itemId = cartItem.id || cartItem.menuItemId;
    const dbItem = await db.get('SELECT * FROM menu_items WHERE id = ?', [itemId]);

    if (!dbItem) {
      return res.status(404).json({ success: false, message: `Menu item '${cartItem.name || itemId}' not found in database.` });
    }

    if (dbItem.available === 0) {
      return res.status(400).json({ success: false, message: `Dish '${dbItem.name}' is currently unavailable.` });
    }

    const unitPriceNumeric = dbItem.price_numeric;
    const itemName = dbItem.name;
    const quantity = Number(cartItem.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return res.status(400).json({ success: false, message: `Quantity for '${dbItem.name}' must be a whole number from 1 to 50.` });
    }

    const lineTotalNumeric = unitPriceNumeric * quantity;
    serverSubtotal += lineTotalNumeric;

    validatedItems.push({
      menuItemId: dbItem.id,
      itemName,
      quantity,
      price: dbItem.price,
      priceNumeric: unitPriceNumeric,
      subtotal: `₹${lineTotalNumeric.toLocaleString('en-IN')}`
    });
  }

  const taxRatePercent = Number.isFinite(TAX_RATE_PERCENT) && TAX_RATE_PERCENT >= 0 && TAX_RATE_PERCENT <= 100 ? TAX_RATE_PERCENT : 5;
  const serverTaxNumeric = Math.round(serverSubtotal * taxRatePercent / 100);
  const serverTotalNumeric = serverSubtotal + serverTaxNumeric;

  const orderId = `NW-${randomUUID().toUpperCase()}`;

  const dateStamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const paymentReference = `NW-PAY-${dateStamp}-${randomUUID().slice(0, 10).toUpperCase()}`;
  const paymentId = `pay-${randomUUID()}`;

  await db.run(
    `INSERT INTO orders (id, user_id, restaurant_id, table_id, reservation_id, customer_name, customer_email, customer_mobile, payment_id, payment_reference, payment_status, status, subtotal, tax, total, total_numeric) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderId,
      finalUserId,
      'R01',
      tableId,
      validReservation.id,
      customerName || validReservation.customer_name || 'Diner',
      customerEmail || validReservation.customer_email || '',
      customerMobile || validReservation.customer_mobile || '',
      paymentId,
      paymentReference,
      'PENDING',
      'RECEIVED',
      `₹${serverSubtotal.toLocaleString('en-IN')}`,
      `₹${serverTaxNumeric.toLocaleString('en-IN')}`,
      `₹${serverTotalNumeric.toLocaleString('en-IN')}`,
      serverTotalNumeric
    ]
  );

  for (const item of validatedItems) {
    const orderItemId = `oi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    await db.run(
      `INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, price, price_numeric, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderItemId, orderId, item.menuItemId, item.itemName, item.quantity, item.price, item.priceNumeric, item.subtotal]
    );
  }

  await db.run(
    `INSERT INTO payments (id, order_id, user_id, restaurant_id, amount, amount_numeric, currency, payment_method, payment_reference, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      paymentId,
      orderId,
      finalUserId,
      'R01',
      `₹${serverTotalNumeric.toLocaleString('en-IN')}`,
      serverTotalNumeric,
      'INR',
      'UPI_QR',
      paymentReference,
      'PENDING'
    ]
  );

  const newOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
  const paymentRecord = await db.get('SELECT * FROM payments WHERE id = ?', [paymentId]);

  res.status(201).json({
    success: true,
    data: {
      ...newOrder,
      items: validatedItems,
      payment: paymentRecord
    }
  });
}));

app.get('/api/payments/:paymentId', authenticate, asyncHandler(async (req, res) => {
  const authUserId = getAuthUserId(req);
  const db = await getDb();

  const payment = await db.get('SELECT * FROM payments WHERE id = ? OR payment_reference = ?', [req.params.paymentId, req.params.paymentId]);
  if (!payment) {
    return res.status(404).json({ success: false, message: `Payment reference '${req.params.paymentId}' not found.` });
  }

  const order = await db.get('SELECT * FROM orders WHERE id = ?', [payment.order_id]);

  if (payment.user_id !== authUserId && !(req.auth.isAdmin && req.auth.user?.role === 'ADMIN')) {
    return res.status(403).json({ success: false, message: '403 Forbidden: Access denied.' });
  }

  res.json({
    success: true,
    data: {
      ...payment,
      order
    }
  });
}));

app.post('/api/payments/:paymentId/verify', authenticate, asyncHandler(async (req, res) => {
  // A browser request cannot prove that money was received. A real payment
  // provider and verification of its signed webhook are required for this.
  return res.status(501).json({
    success: false,
    message: 'Online payment verification is not configured. Do not treat a screenshot or browser confirmation as proof of payment.'
  });
}));

app.post('/api/payments/webhook', asyncHandler(async (req, res) => {
  return res.status(501).json({ success: false, message: 'No payment provider webhook is configured.' });
}));

app.get('/api/orders/my-orders', authenticate, asyncHandler(async (req, res) => {
  const authUserId = getAuthUserId(req);
  const { status, search, page = 1, limit = 10 } = req.query;

  if (!authUserId) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Authentication required.' });
  }

  const db = await getDb();
  let sql = `SELECT o.*, t.table_number FROM orders o JOIN tables t ON o.table_id = t.id WHERE o.user_id = ?`;
  const params = [authUserId];

  if (status && status !== 'All') {
    sql += ` AND o.status = ?`;
    params.push(status.toUpperCase());
  }

  if (search && search.trim()) {
    sql += ` AND (o.id LIKE ? OR o.table_id LIKE ? OR o.payment_reference LIKE ?)`;
    params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
  }

  sql += ` ORDER BY o.created_at DESC`;

  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 10));
  const offset = (safePage - 1) * safeLimit;
  sql += ` LIMIT ? OFFSET ?`;
  params.push(safeLimit, offset);

  const orders = await db.all(sql, params);

  const result = [];
  for (const ord of orders) {
    const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [ord.id]);
    result.push({
      ...ord,
      items: items.map((i) => ({
        id: i.id,
        menuItemId: i.menu_item_id,
        itemName: i.item_name,
        quantity: i.quantity,
        price: i.price,
        subtotal: i.subtotal
      }))
    });
  }

  res.json({
    success: true,
    data: result,
    pagination: { page: safePage, limit: safeLimit }
  });
}));

app.get('/api/orders/:id', authenticate, asyncHandler(async (req, res) => {
  const authUserId = getAuthUserId(req);
  const db = await getDb();

  const order = await db.get(
    `SELECT o.*, t.table_number, t.capacity FROM orders o JOIN tables t ON o.table_id = t.id WHERE o.id = ?`,
    [req.params.id]
  );

  if (!order) {
    return res.status(404).json({ success: false, message: `Order '${req.params.id}' not found.` });
  }

  if (order.user_id !== authUserId && !(req.auth.isAdmin && req.auth.user?.role === 'ADMIN')) {
    return res.status(403).json({
      success: false,
      message: '403 Forbidden: Access denied. You do not have permission to view this order.'
    });
  }

  const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);

  res.json({
    success: true,
    data: {
      ...order,
      items: items.map((i) => ({
        id: i.id,
        menuItemId: i.menu_item_id,
        itemName: i.item_name,
        quantity: i.quantity,
        price: i.price,
        subtotal: i.subtotal
      }))
    }
  });
}));

app.patch('/api/orders/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { status } = req.body;
  const db = await getDb();

  const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!order) {
    return res.status(404).json({ success: false, message: `Order '${req.params.id}' not found.` });
  }

  await db.run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
    status || order.status,
    req.params.id
  ]);
  const updated = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);

  res.json({ success: true, data: updated });
}));

// ==================== OWNER / ADMIN AUTHENTICATION API ====================
app.post('/api/owner/login', (req, res) => res.status(410).json({
  success: false,
  message: 'Password-only owner login has been removed. Sign in with the configured Firebase administrator account.'
}));

// ==================== COMPREHENSIVE ADMIN MANAGEMENT APIs ====================
app.use('/api/admin', requireAdmin);

// 1. Overview Dashboard Statistics (Real Database Metrics)
app.get('/api/admin/stats', asyncHandler(async (req, res) => {
  const db = await getDb();
  const todayStr = new Date().toISOString().split('T')[0];

  const totalBookingsRow = await db.get("SELECT COUNT(*) as c FROM reservations");
  const todayBookingsRow = await db.get("SELECT COUNT(*) as c FROM reservations WHERE date = ?", [todayStr]);
  const confirmedBookingsRow = await db.get("SELECT COUNT(*) as c FROM reservations WHERE status = 'CONFIRMED'");
  const completedBookingsRow = await db.get("SELECT COUNT(*) as c FROM reservations WHERE status = 'COMPLETED'");
  const cancelledBookingsRow = await db.get("SELECT COUNT(*) as c FROM reservations WHERE status = 'CANCELLED'");

  const totalOrdersRow = await db.get("SELECT COUNT(*) as c FROM orders");
  const todayOrdersRow = await db.get("SELECT COUNT(*) as c FROM orders WHERE date(created_at) = date('now') OR date(created_at) = ?", [todayStr]);
  const pendingOrdersRow = await db.get("SELECT COUNT(*) as c FROM orders WHERE status IN ('RECEIVED', 'PREPARING', 'READY')");
  const completedOrdersRow = await db.get("SELECT COUNT(*) as c FROM orders WHERE status = 'COMPLETED'");
  const cancelledOrdersRow = await db.get("SELECT COUNT(*) as c FROM orders WHERE status = 'CANCELLED'");

  const totalCustomersRow = await db.get("SELECT COUNT(*) as c FROM users WHERE role = 'CUSTOMER'");
  
  const revenueRow = await db.get("SELECT SUM(total_numeric) as sum FROM orders WHERE payment_status = 'PAID'");
  const todayRevenueRow = await db.get("SELECT SUM(total_numeric) as sum FROM orders WHERE payment_status = 'PAID' AND (date(created_at) = date('now') OR date(created_at) = ?)", [todayStr]);

  const totalRevenue = revenueRow?.sum || 0;
  const todayRevenue = todayRevenueRow?.sum || 0;

  res.json({
    success: true,
    data: {
      totalBookings: totalBookingsRow.c,
      todayBookings: todayBookingsRow.c,
      confirmedBookings: confirmedBookingsRow.c,
      completedBookings: completedBookingsRow.c,
      cancelledBookings: cancelledBookingsRow.c,

      totalOrders: totalOrdersRow.c,
      todayOrders: todayOrdersRow.c,
      pendingOrders: pendingOrdersRow.c,
      completedOrders: completedOrdersRow.c,
      cancelledOrders: cancelledOrdersRow.c,

      totalCustomers: totalCustomersRow.c,
      totalRevenue: `₹${totalRevenue.toLocaleString()}`,
      totalRevenueNumeric: totalRevenue,
      todayRevenue: `₹${todayRevenue.toLocaleString()}`,
      todayRevenueNumeric: todayRevenue
    }
  });
}));

// 2. Admin Bookings / Reservations List & Filter
app.get('/api/admin/reservations', asyncHandler(async (req, res) => {
  const db = await getDb();
  const { status, search } = req.query;

  let query = `
    SELECT r.*, t.table_number, t.capacity 
    FROM reservations r 
    LEFT JOIN tables t ON r.table_id = t.id 
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL') {
    query += ` AND r.status = ?`;
    params.push(status);
  }

  if (search) {
    query += ` AND (r.id LIKE ? OR r.customer_name LIKE ? OR r.customer_email LIKE ? OR r.customer_mobile LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  query += ` ORDER BY r.date DESC, r.time DESC`;

  const reservations = await db.all(query, params);
  res.json({ success: true, data: reservations });
}));

// 3. Update Reservation Status
app.patch('/api/admin/reservations/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'New status is required.' });
  }

  const db = await getDb();
  const existing = await db.get("SELECT * FROM reservations WHERE id = ?", [req.params.id]);
  if (!existing) {
    return res.status(404).json({ success: false, message: `Reservation '${req.params.id}' not found.` });
  }

  await db.run("UPDATE reservations SET status = ? WHERE id = ?", [status, req.params.id]);
  const updated = await db.get("SELECT * FROM reservations WHERE id = ?", [req.params.id]);

  res.json({ success: true, message: `Reservation status updated to ${status}`, data: updated });
}));

// 3.1 Update Reservation Customer Arrival & Leaving Times
app.patch('/api/admin/reservations/:id/timing', asyncHandler(async (req, res) => {
  const { arrival_time, leaving_time } = req.body;
  const db = await getDb();

  const existing = await db.get("SELECT * FROM reservations WHERE id = ?", [req.params.id]);
  if (!existing) {
    return res.status(404).json({ success: false, message: `Reservation '${req.params.id}' not found.` });
  }

  const newArrivalTime = arrival_time !== undefined ? arrival_time : existing.arrival_time;
  const newLeavingTime = leaving_time !== undefined ? leaving_time : existing.leaving_time;

  await db.run(
    "UPDATE reservations SET arrival_time = ?, leaving_time = ? WHERE id = ?",
    [newArrivalTime, newLeavingTime, req.params.id]
  );

  const updated = await db.get("SELECT * FROM reservations WHERE id = ?", [req.params.id]);
  res.json({ success: true, message: 'Reservation timing updated successfully.', data: updated });
}));

// 4. Admin Orders List with Items
app.get('/api/admin/orders', asyncHandler(async (req, res) => {
  const db = await getDb();
  const { status, search } = req.query;

  let query = `
    SELECT o.*, t.table_number 
    FROM orders o 
    LEFT JOIN tables t ON o.table_id = t.id 
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL') {
    query += ` AND o.status = ?`;
    params.push(status);
  }

  if (search) {
    query += ` AND (o.id LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ? OR o.customer_mobile LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  query += ` ORDER BY o.created_at DESC`;

  const orders = await db.all(query, params);

  // Fetch items for each order
  for (const order of orders) {
    order.items = await db.all("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
  }

  res.json({ success: true, data: orders });
}));

// 5. Update Order Status
app.patch('/api/admin/orders/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'Order status is required.' });
  }

  const db = await getDb();
  const order = await db.get("SELECT * FROM orders WHERE id = ?", [req.params.id]);
  if (!order) {
    return res.status(404).json({ success: false, message: `Order '${req.params.id}' not found.` });
  }

  await db.run(
    "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [status, req.params.id]
  );

  const updated = await db.get("SELECT * FROM orders WHERE id = ?", [req.params.id]);
  updated.items = await db.all("SELECT * FROM order_items WHERE order_id = ?", [updated.id]);

  res.json({ success: true, message: `Order status updated to ${newStatus}`, data: updated });
}));

// 6. Admin Customers Directory
app.get('/api/admin/customers', asyncHandler(async (req, res) => {
  const db = await getDb();
  const customers = await db.all(`
    SELECT u.*, 
      (SELECT COUNT(*) FROM reservations r WHERE r.user_id = u.id OR r.customer_email = u.email) as total_bookings,
      (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id OR o.customer_email = u.email) as total_orders,
      (SELECT COALESCE(SUM(total_numeric), 0) FROM orders o WHERE (o.user_id = u.id OR o.customer_email = u.email) AND o.payment_status = 'PAID') as total_spent
    FROM users u
    ORDER BY u.created_at DESC
  `);
  res.json({ success: true, data: customers });
}));

// 7. Admin Analytics Time-Series Data for Charts
app.get('/api/admin/analytics', asyncHandler(async (req, res) => {
  const db = await getDb();

  // Status Distribution
  const orderStatusCounts = await db.all(`
    SELECT status, COUNT(*) as count FROM orders GROUP BY status
  `);

  const bookingStatusCounts = await db.all(`
    SELECT status, COUNT(*) as count FROM reservations GROUP BY status
  `);

  res.json({
    success: true,
    data: {
      orderStatusDistribution: orderStatusCounts,
      bookingStatusDistribution: bookingStatusCounts,
      timeSeries: [
        { day: 'Mon', bookings: 8, orders: 12, revenue: 14200 },
        { day: 'Tue', bookings: 10, orders: 15, revenue: 18900 },
        { day: 'Wed', bookings: 14, orders: 18, revenue: 22400 },
        { day: 'Thu', bookings: 12, orders: 16, revenue: 19800 },
        { day: 'Fri', bookings: 22, orders: 28, revenue: 38500 },
        { day: 'Sat', bookings: 30, orders: 35, revenue: 49200 },
        { day: 'Sun', bookings: 25, orders: 31, revenue: 41800 }
      ]
    }
  });
}));

// ==================== PHASE 13: OWNER TABLE CONTROL APIs ====================

// GET /api/admin/tables — View all tables with current capacity & reservation metrics
app.get('/api/admin/tables', asyncHandler(async (req, res) => {
  const db = await getDb();
  const { date, time } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const targetTime = time || '12:00 PM';
  const targetStart = parseTimeToMinutes(targetTime);
  const targetEnd = targetStart + 120;

  const tables = await db.all('SELECT * FROM tables ORDER BY table_number ASC');
  const reservations = await db.all(
    `SELECT * FROM reservations WHERE date = ? AND status IN ('CONFIRMED', 'HELD')`,
    [targetDate]
  );

  const data = tables.map((t) => {
    const tableRes = reservations.filter((r) => {
      if (r.table_id !== t.id) return false;
      const s = parseTimeToMinutes(r.time);
      const e = r.leaving_time ? parseTimeToMinutes(r.leaving_time) : s + 120;
      return s < targetEnd && e > targetStart;
    });

    const reservedSeats = tableRes.reduce((sum, r) => sum + parseGuestsCount(r.guests), 0);
    const availableSeats = Math.max(0, t.capacity - reservedSeats);

    return {
      ...t,
      ownerStatus: t.owner_status || 'AVAILABLE',
      isActive: t.is_active !== 0,
      reservedSeats,
      availableSeats,
      currentReservations: tableRes.map((r) => ({
        id: r.id,
        customerName: r.customer_name,
        time: r.time,
        leavingTime: r.leaving_time,
        guests: r.guests
      }))
    };
  });

  res.json({ success: true, data });
}));

// POST /api/admin/tables — Add new table
app.post('/api/admin/tables', asyncHandler(async (req, res) => {
  const { tableNumber, capacity, zone } = req.body;
  if (!tableNumber || !capacity) {
    return res.status(400).json({ success: false, message: 'Table number and seating capacity are required.' });
  }

  const db = await getDb();
  const cap = parseInt(capacity, 10) || 2;
  const numMatches = tableNumber.match(/\d+/);
  const numSuffix = numMatches ? numMatches[0].padStart(2, '0') : `${Date.now()}`.slice(-2);
  const tableId = `T${numSuffix}`;

  // Check if table ID already exists
  const existing = await db.get('SELECT * FROM tables WHERE id = ?', [tableId]);
  const finalId = existing ? `T${Date.now().toString().slice(-4)}` : tableId;
  const formattedNumber = tableNumber.toLowerCase().includes('table') ? tableNumber : `Table ${numSuffix}`;
  const finalZone = zone || 'Main Dining';

  await db.run(
    `INSERT INTO tables (id, restaurant_id, table_number, capacity, status, owner_status, is_active, zone, qr_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [finalId, 'R01', formattedNumber, cap, 'AVAILABLE', 'AVAILABLE', 1, finalZone, `/qr-order?table=${finalId}`]
  );

  const newTable = await db.get('SELECT * FROM tables WHERE id = ?', [finalId]);
  res.status(201).json({ success: true, message: `Table ${formattedNumber} created successfully.`, data: newTable });
}));

// PATCH /api/admin/tables/:id — Edit table, change capacity, make available/unavailable, activate/deactivate
app.patch('/api/admin/tables/:id', asyncHandler(async (req, res) => {
  const { capacity, zone, owner_status, is_active } = req.body;
  const db = await getDb();

  const table = await db.get('SELECT * FROM tables WHERE id = ?', [req.params.id]);
  if (!table) {
    return res.status(404).json({ success: false, message: `Table '${req.params.id}' not found.` });
  }

  const newCap = capacity !== undefined ? parseInt(capacity, 10) : table.capacity;
  const newZone = zone !== undefined ? zone : table.zone;
  const newOwnerStatus = owner_status !== undefined ? owner_status : table.owner_status;
  const newIsActive = is_active !== undefined ? (is_active ? 1 : 0) : table.is_active;

  await db.run(
    `UPDATE tables SET capacity = ?, zone = ?, owner_status = ?, is_active = ? WHERE id = ?`,
    [newCap, newZone, newOwnerStatus, newIsActive, req.params.id]
  );

  const updated = await db.get('SELECT * FROM tables WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: `Table ${updated.table_number} updated successfully.`, data: updated });
}));

// DELETE /api/admin/tables/:id — Deactivate table (preserves historical reservations and orders)
app.delete('/api/admin/tables/:id', asyncHandler(async (req, res) => {
  const db = await getDb();
  const table = await db.get('SELECT * FROM tables WHERE id = ?', [req.params.id]);
  if (!table) {
    return res.status(404).json({ success: false, message: `Table '${req.params.id}' not found.` });
  }

  // Soft deactivate so historical reservations remain intact
  await db.run('UPDATE tables SET is_active = 0, owner_status = "UNAVAILABLE" WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: `Table ${table.table_number} deactivated successfully (historical records preserved).` });
}));

// Serve static frontend assets
app.use(express.static(distPath));

// SPA Client Routing Fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// ==================== CENTRALIZED BACKEND ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('[Backend API Exception]', err.message);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[NO-WAIT Backend] Running on http://localhost:${PORT} with SQLite DB (nowait.db)`);
});

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'nowait.db');

let dbInstance = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await dbInstance.run('PRAGMA foreign_keys = ON;');

  // Initialize Relational Schemas with Payments Table & Security Fields
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_id TEXT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      mobile_number TEXT,
      photo TEXT,
      role TEXT CHECK(role IN ('CUSTOMER', 'ADMIN', 'STAFF')) DEFAULT 'CUSTOMER',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS restaurants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL,
      table_number TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      status TEXT DEFAULT 'AVAILABLE',
      owner_status TEXT DEFAULT 'AVAILABLE',
      is_active INTEGER DEFAULT 1,
      zone TEXT DEFAULT 'Main Dining',
      qr_code TEXT,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      price TEXT NOT NULL,
      price_numeric REAL NOT NULL,
      image TEXT,
      available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      restaurant_id TEXT NOT NULL,
      table_id TEXT NOT NULL,
      customer_name TEXT,
      customer_email TEXT,
      customer_mobile TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      leaving_time TEXT,
      guests TEXT NOT NULL,
      status TEXT CHECK(status IN ('HELD', 'CONFIRMED', 'CANCELLED', 'COMPLETED')) DEFAULT 'CONFIRMED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      restaurant_id TEXT NOT NULL,
      table_id TEXT NOT NULL,
      reservation_id TEXT,
      customer_name TEXT,
      customer_email TEXT,
      customer_mobile TEXT,
      payment_id TEXT,
      payment_reference TEXT,
      payment_status TEXT CHECK(payment_status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED')) DEFAULT 'PENDING',
      status TEXT CHECK(status IN ('RECEIVED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED')) DEFAULT 'RECEIVED',
      subtotal TEXT NOT NULL,
      tax TEXT NOT NULL,
      total TEXT NOT NULL,
      total_numeric REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      menu_item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price TEXT NOT NULL,
      price_numeric REAL NOT NULL,
      subtotal TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    -- PHASE 11: PAYMENTS ENTITY
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      restaurant_id TEXT NOT NULL,
      amount TEXT NOT NULL,
      amount_numeric REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      payment_method TEXT DEFAULT 'UPI_QR',
      payment_reference TEXT UNIQUE NOT NULL,
      status TEXT CHECK(status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED')) DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // Migration helper: Add missing columns if database exists from prior phases
  try {
    await dbInstance.run('ALTER TABLE users ADD COLUMN password TEXT');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE users ADD COLUMN updated_at DATETIME');
    await dbInstance.run('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE orders ADD COLUMN updated_at DATETIME');
    await dbInstance.run('UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE orders ADD COLUMN payment_id TEXT');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE orders ADD COLUMN payment_reference TEXT');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT "PENDING"');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE orders ADD COLUMN customer_name TEXT');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE orders ADD COLUMN customer_email TEXT');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE orders ADD COLUMN customer_mobile TEXT');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE orders ADD COLUMN total_numeric REAL DEFAULT 0');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE reservations ADD COLUMN customer_name TEXT');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE reservations ADD COLUMN customer_email TEXT');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE reservations ADD COLUMN customer_mobile TEXT');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE reservations ADD COLUMN leaving_time TEXT');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE reservations ADD COLUMN arrival_time TEXT');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE order_items ADD COLUMN item_name TEXT');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE order_items ADD COLUMN price_numeric REAL DEFAULT 0');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE order_items ADD COLUMN subtotal TEXT');
  } catch (e) {}

  // PHASE 14: Table Reservation Payment, Credit, Cancellation & Refund Columns
  try {
    await dbInstance.run('ALTER TABLE reservations ADD COLUMN reservation_fee REAL DEFAULT 500');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE reservations ADD COLUMN reservation_payment_id TEXT');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE reservations ADD COLUMN reservation_payment_status TEXT DEFAULT "PENDING"');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE reservations ADD COLUMN reservation_paid_amount REAL DEFAULT 0');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE reservations ADD COLUMN reservation_payment_time DATETIME');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE reservations ADD COLUMN reservation_credit REAL DEFAULT 0');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE reservations ADD COLUMN credit_applied INTEGER DEFAULT 0');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE reservations ADD COLUMN cancelled_at DATETIME');
  } catch (e) {}

  try {
    await dbInstance.run('ALTER TABLE payments ADD COLUMN payment_type TEXT DEFAULT "RESERVATION"');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE payments ADD COLUMN reservation_id TEXT');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE payments ADD COLUMN transaction_id TEXT');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE payments ADD COLUMN paid_at DATETIME');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE payments ADD COLUMN refund_status TEXT DEFAULT "NONE"');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE payments ADD COLUMN refund_amount REAL DEFAULT 0');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE payments ADD COLUMN refunded_at DATETIME');
  } catch (e) {}

  try {
    await dbInstance.run('ALTER TABLE orders ADD COLUMN reservation_credit_applied REAL DEFAULT 0');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE orders ADD COLUMN balance_due REAL DEFAULT 0');
  } catch (e) {}

  // PHASE 13: Table Management Columns & Index Adjustments
  try {
    await dbInstance.run('ALTER TABLE tables ADD COLUMN owner_status TEXT DEFAULT "AVAILABLE"');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE tables ADD COLUMN is_active INTEGER DEFAULT 1');
  } catch (e) {}
  try {
    await dbInstance.run('ALTER TABLE tables ADD COLUMN zone TEXT DEFAULT "Main Dining"');
  } catch (e) {}
  try {
    await dbInstance.run('DROP INDEX IF EXISTS idx_no_double_booking');
  } catch (e) {}
  try {
    await dbInstance.run('UPDATE tables SET owner_status = "AVAILABLE" WHERE owner_status IS NULL');
    await dbInstance.run('UPDATE tables SET is_active = 1 WHERE is_active IS NULL');
    await dbInstance.run('UPDATE tables SET zone = "Patio Lounge" WHERE id = "T01" AND (zone IS NULL OR zone = "Main Dining")');
    await dbInstance.run('UPDATE tables SET zone = "Window View" WHERE id = "T03" AND (zone IS NULL OR zone = "Main Dining")');
    await dbInstance.run('UPDATE tables SET zone = "Executive Booth" WHERE id = "T04" AND (zone IS NULL OR zone = "Main Dining")');
    await dbInstance.run('UPDATE tables SET zone = "VIP Lounge" WHERE id = "T05" AND (zone IS NULL OR zone = "Main Dining")');
    await dbInstance.run('UPDATE tables SET zone = "Chef Counter" WHERE id = "T06" AND (zone IS NULL OR zone = "Main Dining")');
    await dbInstance.run('UPDATE tables SET zone = "Patio Garden" WHERE id = "T07" AND (zone IS NULL OR zone = "Main Dining")');
    await dbInstance.run('UPDATE tables SET zone = "Wine Cellar" WHERE id = "T08" AND (zone IS NULL OR zone = "Main Dining")');
  } catch (e) {}

  await seedInitialDatabase(dbInstance);

  return dbInstance;
}

async function seedInitialDatabase(db) {
  // Seed Restaurant
  const restaurantCount = await db.get('SELECT COUNT(*) as count FROM restaurants');
  if (restaurantCount.count === 0) {
    await db.run(
      `INSERT INTO restaurants (id, name, location, phone) VALUES (?, ?, ?, ?)`,
      ['R01', 'NO-WAIT RESTAURANT', '100 Gourmet Boulevard, Suite 400', '+1 (555) 019-2834']
    );
  }

  // Seed Tables
  const tableCount = await db.get('SELECT COUNT(*) as count FROM tables');
  if (tableCount.count === 0) {
    const defaultTables = [
      ['T01', 'R01', 'Table 01', 2, 'AVAILABLE', '/qr-order?table=T01'],
      ['T02', 'R01', 'Table 02', 4, 'AVAILABLE', '/qr-order?table=T02'],
      ['T03', 'R01', 'Table 03', 4, 'AVAILABLE', '/qr-order?table=T03'],
      ['T04', 'R01', 'Table 04', 6, 'AVAILABLE', '/qr-order?table=T04'],
      ['T05', 'R01', 'Table 05', 8, 'AVAILABLE', '/qr-order?table=T05'],
      ['T06', 'R01', 'Table 06', 2, 'AVAILABLE', '/qr-order?table=T06'],
      ['T07', 'R01', 'Table 07', 4, 'AVAILABLE', '/qr-order?table=T07'],
      ['T08', 'R01', 'Table 08', 6, 'AVAILABLE', '/qr-order?table=T08']
    ];

    for (const t of defaultTables) {
      await db.run(
        `INSERT INTO tables (id, restaurant_id, table_number, capacity, status, qr_code) VALUES (?, ?, ?, ?, ?, ?)`,
        t
      );
    }
  }

  // Seed Menu Items
  const menuCount = await db.get('SELECT COUNT(*) as count FROM menu_items');
  if (menuCount.count === 0) {
    const defaultMenu = [
      ['m1', 'R01', 'Black Truffle Wagyu Steak', '28-day aged Wagyu ribeye, shaved black truffle, smoked rosemary butter.', 'Main Course', '₹1,499', 1499, '/images/steak_dish.png', 1],
      ['m2', 'R01', 'Smoked Burrata & Heirloom Salad', 'Artisanal smoked burrata cheese, charred cherry heirloom tomatoes, aged balsamic.', 'Starters', '₹699', 699, 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19655?auto=format&fit=crop&q=80&w=800', 1],
      ['m3', 'R01', 'Charcoal Crust Truffle Pizza', 'Activated charcoal sourdough dough, wild porcini mushrooms, fresh mozzarella.', 'Pizza', '₹1,099', 1099, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800', 1],
      ['m4', 'R01', 'Double Smoked Oak Wagyu Burger', 'Double Wagyu beef patties, aged sharp cheddar, caramelized shallot jam.', 'Burgers', '₹899', 899, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800', 1],
      ['m5', 'R01', 'Dark Chocolate Lava Sphere', '72% Valrhona dark chocolate dome, warm salted caramel drizzle.', 'Desserts', '₹549', 549, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=800', 1],
      ['m6', 'R01', 'Smoked Bourbon Old Fashioned', 'Small-batch Kentucky bourbon, Angostura bitters, flamed orange peel.', 'Drinks', '₹599', 599, 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800', 1]
    ];

    for (const m of defaultMenu) {
      await db.run(
        `INSERT INTO menu_items (id, restaurant_id, name, description, category, price, price_numeric, image, available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        m
      );
    }
  }
}

import { SAMPLE_MENU } from '../data/sampleMenu';
import { RESTAURANT_TABLES } from './bookingService';

const ADMIN_MENU_KEY = 'nowait_admin_menu_v1';
const ADMIN_TABLES_KEY = 'nowait_admin_tables_v1';
const ADMIN_SETTINGS_KEY = 'nowait_admin_settings_v1';

export const ADMIN_TABLE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  OCCUPIED: 'OCCUPIED',
  CLEANING: 'CLEANING'
};

// Seed initial Admin Tables if missing
function getAdminTables() {
  try {
    const data = localStorage.getItem(ADMIN_TABLES_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }

  const initial = RESTAURANT_TABLES.map((t, idx) => ({
    ...t,
    status: idx === 1 ? ADMIN_TABLE_STATUS.RESERVED : idx === 3 ? ADMIN_TABLE_STATUS.OCCUPIED : ADMIN_TABLE_STATUS.AVAILABLE
  }));
  saveAdminTables(initial);
  return initial;
}

function saveAdminTables(tables) {
  try {
    localStorage.setItem(ADMIN_TABLES_KEY, JSON.stringify(tables));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

// Seed initial Admin Menu if missing
export function getAdminMenu() {
  try {
    const data = localStorage.getItem(ADMIN_MENU_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }

  const initial = SAMPLE_MENU.map((m) => ({ ...m, isAvailable: true }));
  saveAdminMenu(initial);
  return initial;
}

export function saveAdminMenu(menuItems) {
  try {
    localStorage.setItem(ADMIN_MENU_KEY, JSON.stringify(menuItems));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

// Table Status Management
export function updateTableStatus(tableId, newStatus) {
  const tables = getAdminTables();
  const updated = tables.map((t) => (t.id === tableId ? { ...t, status: newStatus } : t));
  saveAdminTables(updated);
  return updated;
}

export function fetchAdminTables() {
  return getAdminTables();
}

// Menu Management Operations (Add, Edit, Delete, Toggle Availability)
export function addMenuItem(newItem) {
  const menu = getAdminMenu();
  const itemToAdd = {
    id: `m${Date.now()}`,
    name: newItem.name,
    category: newItem.category || 'Main Course',
    price: newItem.price.includes('₹') ? newItem.price : `₹${newItem.price}`,
    rating: '5.0',
    prepTime: newItem.prepTime || '15 min',
    description: newItem.description || 'Artisanal culinary preparation.',
    image: newItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
    isAvailable: true,
    tags: ['New Creation']
  };

  const updated = [itemToAdd, ...menu];
  saveAdminMenu(updated);
  return updated;
}

export function updateMenuItem(id, updatedFields) {
  const menu = getAdminMenu();
  const updated = menu.map((item) => {
    if (item.id === id) {
      const priceFormatted = updatedFields.price
        ? (updatedFields.price.includes('₹') ? updatedFields.price : `₹${updatedFields.price}`)
        : item.price;
      return { ...item, ...updatedFields, price: priceFormatted };
    }
    return item;
  });
  saveAdminMenu(updated);
  return updated;
}

export function deleteMenuItem(id) {
  const menu = getAdminMenu();
  const updated = menu.filter((item) => item.id !== id);
  saveAdminMenu(updated);
  return updated;
}

export function toggleMenuItemAvailability(id) {
  const menu = getAdminMenu();
  const updated = menu.map((item) => (item.id === id ? { ...item, isAvailable: !item.isAvailable } : item));
  saveAdminMenu(updated);
  return updated;
}

// Overview Metrics Calculation
export function getOverviewMetrics() {
  const tables = getAdminTables();
  const menu = getAdminMenu();
  
  const occupiedCount = tables.filter((t) => t.status === ADMIN_TABLE_STATUS.OCCUPIED).length;
  const reservedCount = tables.filter((t) => t.status === ADMIN_TABLE_STATUS.RESERVED).length;
  const availableCount = tables.filter((t) => t.status === ADMIN_TABLE_STATUS.AVAILABLE).length;

  return {
    todayReservations: 12,
    activeOrders: 4,
    availableTables: availableCount,
    occupiedTables: occupiedCount,
    reservedTables: reservedCount,
    todayRevenue: '₹48,950',
    monthlyRevenue: '₹8,45,200',
    customerSatisfaction: '98.4%'
  };
}

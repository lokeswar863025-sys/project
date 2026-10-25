import { SAMPLE_MENU } from '../data/sampleMenu';

export const ORDER_STATUS = {
  RECEIVED: 'RECEIVED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  SERVED: 'SERVED',
  COMPLETED: 'COMPLETED'
};

export const TABLE_MAP = {
  'T01': { id: 'T01', name: 'Table 01', zone: 'Patio Lounge' },
  'T02': { id: 'T02', name: 'Table 02', zone: 'Main Dining' },
  'T03': { id: 'T03', name: 'Table 03', zone: 'Window View' },
  'T04': { id: 'T04', name: 'Table 04', zone: 'Executive Booth' },
  'T05': { id: 'T05', name: 'Table 05', zone: 'VIP Lounge' },
  'T06': { id: 'T06', name: 'Table 06', zone: 'Chef Counter' },
  'T07': { id: 'T07', name: 'Table 07', zone: 'Patio Garden' },
  'T08': { id: 'T08', name: 'Table 08', zone: 'Wine Cellar' }
};

const LOCAL_STORAGE_ORDERS_KEY = 'nowait_qr_orders_v1';

/**
 * Standardize table query parameters like '04', '4', 't04', 'T04' into 'T04'.
 */
export function normalizeTableParam(param) {
  if (!param) return null;
  const cleaned = param.toString().trim().toUpperCase().replace('TABLE', '').replace('T', '');
  const num = parseInt(cleaned, 10);
  if (isNaN(num) || num < 1 || num > 8) return null;
  const padded = num < 10 ? `0${num}` : `${num}`;
  return `T${padded}`;
}

export function validateTable(tableId) {
  const norm = normalizeTableParam(tableId);
  return norm ? TABLE_MAP[norm] : null;
}

/**
 * Calculate cart subtotal, 5% tax, and total safely using canonical menu prices.
 */
export function calculateCartTotals(cartItems) {
  let subtotal = 0;

  cartItems.forEach((cartItem) => {
    // Find canonical item price from sample menu
    const menuObj = SAMPLE_MENU.find((m) => m.id === cartItem.id);
    const rawPriceStr = menuObj ? menuObj.price : cartItem.price || '0';
    const numericPrice = parseFloat(rawPriceStr.replace(/[^0-9.]/g, '')) || 0;
    subtotal += numericPrice * cartItem.quantity;
  });

  const tax = Math.round(subtotal * 0.05); // 5% GST tax
  const total = subtotal + tax;

  return {
    subtotal,
    tax,
    total,
    subtotalFormatted: `₹${subtotal.toLocaleString('en-IN')}`,
    taxFormatted: `₹${tax.toLocaleString('en-IN')}`,
    totalFormatted: `₹${total.toLocaleString('en-IN')}`
  };
}

function getStoredOrders() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
  return [];
}

function saveStoredOrders(orders) {
  try {
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

/**
 * Place a new table QR order.
 */
export function placeOrder({ tableId, cartItems, customerName, userId }) {
  const normTable = normalizeTableParam(tableId) || 'T04';
  const tableObj = TABLE_MAP[normTable];
  const totals = calculateCartTotals(cartItems);

  const orderId = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder = {
    id: orderId,
    tableId: normTable,
    tableName: tableObj.name,
    tableZone: tableObj.zone,
    customerName: customerName || 'Valued Diner',
    userId: userId || 'guest-qr-user',
    items: cartItems.map((item) => {
      const menuObj = SAMPLE_MENU.find((m) => m.id === item.id);
      return {
        id: item.id,
        name: menuObj ? menuObj.name : item.name,
        quantity: item.quantity,
        price: menuObj ? menuObj.price : item.price
      };
    }),
    subtotal: totals.subtotalFormatted,
    tax: totals.taxFormatted,
    total: totals.totalFormatted,
    status: ORDER_STATUS.RECEIVED,
    createdAt: new Date().toISOString()
  };

  const orders = getStoredOrders();
  orders.unshift(newOrder);
  saveStoredOrders(orders);

  return newOrder;
}

export function getUserOrders(userId) {
  const orders = getStoredOrders();
  if (!userId) return orders;
  return orders.filter((o) => o.userId === userId);
}

export function getOrderById(orderId) {
  const orders = getStoredOrders();
  return orders.find((o) => o.id === orderId) || null;
}

export function updateOrderStatus(orderId, newStatus) {
  const orders = getStoredOrders();
  const updated = orders.map((o) => {
    if (o.id === orderId) {
      return { ...o, status: newStatus };
    }
    return o;
  });
  saveStoredOrders(updated);
  return updated;
}

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Universal JSON API Request Wrapper with Customer Data Isolation Headers
 */
export async function apiRequest(endpoint, method = 'GET', body = null, userId = null, customHeaders = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders
  };

  if (userId) {
    headers['x-user-id'] = userId;
  }

  const config = {
    method,
    headers
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      const errObj = new Error(data.message || `API Error: ${response.status}`);
      errObj.status = response.status;
      throw errObj;
    }

    return data;
  } catch (error) {
    console.warn(`[API Client Warning] ${method} ${endpoint}:`, error.message);
    throw error;
  }
}

// API Endpoints Client
export const api = {
  // Auth & Profile
  authenticateUser: (userData) => apiRequest('/auth', 'POST', userData),
  updateProfile: (profileData, userId) => apiRequest('/users/profile', 'PATCH', profileData, userId),
  getProfile: (userId) => apiRequest('/users/profile', 'GET', null, userId),

  // Tables & Availability
  getTables: () => apiRequest('/tables'),
  getAvailableTables: (date, time) => apiRequest(`/tables/available?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`),
  getTableAvailability: (date, arrivalTime = '', leavingTime = '', guests = 2, durationHours = 2) =>
    apiRequest(`/tables/availability?date=${encodeURIComponent(date)}&arrivalTime=${encodeURIComponent(arrivalTime)}&leavingTime=${encodeURIComponent(leavingTime)}&guests=${encodeURIComponent(guests)}&durationHours=${encodeURIComponent(durationHours)}`),

  // Menu Items
  getMenu: () => apiRequest('/menu'),
  getMenuItem: (id) => apiRequest(`/menu/${id}`),
  createMenuItem: (itemData) => apiRequest('/menu', 'POST', itemData),
  updateMenuItem: (id, itemData) => apiRequest(`/menu/${id}`, 'PATCH', itemData),
  deleteMenuItem: (id) => apiRequest(`/menu/${id}`, 'DELETE'),

  // Isolated Customer Reservations History
  createReservation: (resData, userId) => apiRequest('/reservations', 'POST', resData, userId),
  getMyReservations: (userId) => apiRequest('/reservations/my-reservations', 'GET', null, userId),
  cancelReservation: (id, userId) => apiRequest(`/reservations/${id}`, 'DELETE', null, userId),

  // Isolated Customer Orders & Dynamic Payments History
  createOrder: (orderData, userId) => apiRequest('/orders', 'POST', orderData, userId),
  getMyOrders: (userId, { status = 'All', search = '', page = 1, limit = 10 } = {}) =>
    apiRequest(`/orders/my-orders?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`, 'GET', null, userId),
  getOrderDetails: (id, userId) => apiRequest(`/orders/${id}`, 'GET', null, userId),
  updateOrderStatus: (id, status) => apiRequest(`/orders/${id}`, 'PATCH', { status }),

  // Payments Verification & Status
  getPaymentDetails: (paymentId, userId) => apiRequest(`/payments/${paymentId}`, 'GET', null, userId),
  verifyPayment: (paymentId, action = 'VERIFY') => apiRequest(`/payments/${paymentId}/verify`, 'POST', { action }),

  // Owner & Admin APIs
  ownerLogin: (credentials) => apiRequest('/owner/login', 'POST', credentials),
  getAdminStats: () => apiRequest('/admin/stats'),
  getAdminReservations: (status = 'ALL', search = '') => 
    apiRequest(`/admin/reservations?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`),
  updateAdminReservationStatus: (id, status) => 
    apiRequest(`/admin/reservations/${id}/status`, 'PATCH', { status }),
  updateAdminReservationTiming: (id, timingData) => 
    apiRequest(`/admin/reservations/${id}/timing`, 'PATCH', timingData),
  getAdminOrders: (status = 'ALL', search = '') => 
    apiRequest(`/admin/orders?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`),
  updateAdminOrderStatus: (id, status, payment_status) => 
    apiRequest(`/admin/orders/${id}/status`, 'PATCH', { status, payment_status }),
  getAdminCustomers: () => apiRequest('/admin/customers'),
  getAdminAnalytics: () => apiRequest('/admin/analytics'),

  // Phase 13: Owner Table Control APIs
  getAdminTables: (date = '', time = '') =>
    apiRequest(`/admin/tables?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`, 'GET', null, null, { 'x-admin-token': 'admin-secret' }),
  createAdminTable: (tableData) =>
    apiRequest('/admin/tables', 'POST', tableData, null, { 'x-admin-token': 'admin-secret' }),
  updateAdminTable: (id, tableData) =>
    apiRequest(`/admin/tables/${id}`, 'PATCH', tableData, null, { 'x-admin-token': 'admin-secret' }),
  deleteAdminTable: (id) =>
    apiRequest(`/admin/tables/${id}`, 'DELETE', null, null, { 'x-admin-token': 'admin-secret' })
};

export default api;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Utensils, QrCode, BookOpen, Users, Settings,
  TrendingUp, CheckCircle2, Clock, XCircle, Flame, Plus, Edit2, Trash2,
  DollarSign, ShieldCheck, Check, AlertCircle, Eye, RefreshCw, LogOut,
  Search, Filter, ArrowUpDown, ChevronRight, ShoppingBag, Award, BarChart3,
  Menu, X, ExternalLink, Phone, Mail, UserCheck, Save
} from 'lucide-react';
import api from '../../services/api';
import FadeUp from '../../components/animations/FadeUp';

const OWNER_SIDEBAR_TABS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'bookings', label: 'Bookings & Timings', icon: Calendar },
  { id: 'orders', label: 'Orders', icon: QrCode },
  { id: 'tables', label: 'Tables', icon: Utensils },
  { id: 'menu', label: 'Items & Prices', icon: BookOpen },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real Database Metrics State
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalOrders: 0,
    todayOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalCustomers: 0,
    totalRevenue: '₹0',
    todayRevenue: '₹0'
  });

  // Database Collections
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Search & Filters
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [menuSearch, setMenuSearch] = useState('');

  // Phase 13: Owner Table Management State
  const [adminTables, setAdminTables] = useState([]);
  const [adminTableDate, setAdminTableDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [adminTableTime, setAdminTableTime] = useState('12:00 PM');
  const [tableLoading, setTableLoading] = useState(false);
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [newTableForm, setNewTableForm] = useState({
    tableNumber: '',
    capacity: '4',
    zone: 'Main Dining'
  });
  const [editingCapacityTableId, setEditingCapacityTableId] = useState(null);
  const [editingCapacityValue, setEditingCapacityValue] = useState(4);

  // Timing Modal State for Customer Arrival & Leaving Times
  const [timingModalReservation, setTimingModalReservation] = useState(null);
  const [arrivalTimeInput, setArrivalTimeInput] = useState('');
  const [leavingTimeInput, setLeavingTimeInput] = useState('');

  // Item Price Edit State
  const [editingPriceItemId, setEditingPriceItemId] = useState(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');

  // Detail Modals
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Menu Modal State
  const [isAddMenuModalOpen, setIsAddMenuModalOpen] = useState(false);
  const [menuForm, setMenuForm] = useState({
    name: '',
    category: 'Main Course',
    price: '799',
    description: '',
    image: ''
  });

  // Owner Profile
  const storedOwnerUserStr = localStorage.getItem('nowait_owner_user');
  const ownerUser = storedOwnerUserStr ? JSON.parse(storedOwnerUserStr) : { name: 'Restaurant Owner', email: 'owner@nowait.local' };

  // Phase 13: Load Admin Tables with Real Seating Breakdown for Date & Time
  const loadAdminTables = async (date = adminTableDate, time = adminTableTime) => {
    setTableLoading(true);
    try {
      const res = await api.getAdminTables(date, time);
      if (res?.data) setAdminTables(res.data);
    } catch (err) {
      console.error('[Owner Dashboard Tables Error]', err);
    } finally {
      setTableLoading(false);
    }
  };

  // Load All Admin Data from Backend APIs (SQLite Database)
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Stats
      const statsRes = await api.getAdminStats().catch(() => null);
      if (statsRes?.data) setStats(statsRes.data);

      // 2. Reservations
      const resRes = await api.getAdminReservations(bookingStatusFilter, bookingSearch).catch(() => null);
      if (resRes?.data) setReservations(resRes.data);

      // 3. Orders
      const orderRes = await api.getAdminOrders(orderStatusFilter, orderSearch).catch(() => null);
      if (orderRes?.data) setOrders(orderRes.data);

      // 4. Customers
      const custRes = await api.getAdminCustomers().catch(() => null);
      if (custRes?.data) setCustomers(custRes.data);

      // 5. Menu Items (from SQLite database)
      const menuRes = await api.getMenu().catch(() => null);
      if (menuRes?.data) setMenuItems(menuRes.data);

      // 6. Analytics
      const analyticsRes = await api.getAdminAnalytics().catch(() => null);
      if (analyticsRes?.data) setAnalyticsData(analyticsRes.data);

      // 7. Phase 13: Admin Tables
      await loadAdminTables(adminTableDate, adminTableTime);
    } catch (err) {
      console.error('[Owner Dashboard Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeTab, bookingStatusFilter, orderStatusFilter]);

  useEffect(() => {
    if (activeTab === 'tables') {
      loadAdminTables(adminTableDate, adminTableTime);
    }
  }, [activeTab, adminTableDate, adminTableTime]);

  // Handle Logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of the Owner Dashboard?')) {
      localStorage.removeItem('nowait_owner_token');
      localStorage.removeItem('nowait_owner_user');
      navigate('/owner/login');
    }
  };

  // Phase 13: Owner Toggle Table Availability (AVAILABLE <-> UNAVAILABLE)
  const handleToggleOwnerStatus = async (table) => {
    const newStatus = table.ownerStatus === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
    try {
      await api.updateAdminTable(table.id, { owner_status: newStatus });
      setAdminTables((prev) =>
        prev.map((t) => (t.id === table.id ? { ...t, ownerStatus: newStatus } : t))
      );
    } catch (err) {
      alert(`Failed to update owner status: ${err.message}`);
    }
  };

  // Phase 13: Owner Toggle Active State (Soft Deactivate / Reactivate)
  const handleToggleTableActive = async (table) => {
    const willDeactivate = table.isActive;
    const confirmPrompt = willDeactivate
      ? `Deactivate Table ${table.table_number}? Historical bookings and orders remain safe, but customers will not be able to book this table.`
      : `Reactivate Table ${table.table_number}? Table will become available for customer bookings.`;

    if (!window.confirm(confirmPrompt)) return;

    try {
      if (willDeactivate) {
        await api.deleteAdminTable(table.id);
        setAdminTables((prev) =>
          prev.map((t) => (t.id === table.id ? { ...t, isActive: false, ownerStatus: 'UNAVAILABLE' } : t))
        );
      } else {
        await api.updateAdminTable(table.id, { is_active: true, owner_status: 'AVAILABLE' });
        setAdminTables((prev) =>
          prev.map((t) => (t.id === table.id ? { ...t, isActive: true, ownerStatus: 'AVAILABLE' } : t))
        );
      }
    } catch (err) {
      alert(`Failed to update table active state: ${err.message}`);
    }
  };

  // Phase 13: Change Table Capacity
  const handleSaveCapacity = async (tableId) => {
    const cap = parseInt(editingCapacityValue, 10);
    if (!cap || cap < 1) {
      alert('Seating capacity must be at least 1 guest.');
      return;
    }
    try {
      await api.updateAdminTable(tableId, { capacity: cap });
      setAdminTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, capacity: cap, availableSeats: Math.max(0, cap - (t.reservedSeats || 0)) } : t))
      );
      setEditingCapacityTableId(null);
    } catch (err) {
      alert(`Failed to update table capacity: ${err.message}`);
    }
  };

  // Phase 13: Add New Table
  const handleAddTableSubmit = async (e) => {
    e.preventDefault();
    if (!newTableForm.tableNumber.trim()) {
      alert('Please enter a valid table number (e.g. Table 09 or 09).');
      return;
    }
    try {
      const res = await api.createAdminTable({
        tableNumber: newTableForm.tableNumber.trim(),
        capacity: parseInt(newTableForm.capacity, 10) || 4,
        zone: newTableForm.zone || 'Main Dining'
      });
      alert(res.message || 'Table added successfully!');
      setIsAddTableModalOpen(false);
      setNewTableForm({ tableNumber: '', capacity: '4', zone: 'Main Dining' });
      loadAdminTables(adminTableDate, adminTableTime);
    } catch (err) {
      alert(`Failed to create new table: ${err.message}`);
    }
  };

  // Reservation Status Update
  const handleUpdateBookingStatus = async (id, newStatus) => {
    try {
      await api.updateAdminReservationStatus(id, newStatus);
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking((prev) => ({ ...prev, status: newStatus }));
      }
      const statsRes = await api.getAdminStats();
      if (statsRes?.data) setStats(statsRes.data);
    } catch (err) {
      alert(`Failed to update booking status: ${err.message}`);
    }
  };

  // Reservation Customer Arrival & Leaving Time Update
  const handleSaveTiming = async (e) => {
    e.preventDefault();
    if (!timingModalReservation) return;

    try {
      await api.updateAdminReservationTiming(timingModalReservation.id, {
        arrival_time: arrivalTimeInput || 'Not yet arrived',
        leaving_time: leavingTimeInput || 'Not yet left'
      });

      setReservations((prev) =>
        prev.map((r) =>
          r.id === timingModalReservation.id
            ? { ...r, arrival_time: arrivalTimeInput || 'Not yet arrived', leaving_time: leavingTimeInput || 'Not yet left' }
            : r
        )
      );

      setTimingModalReservation(null);
      alert('Customer Arrival and Leaving times updated successfully!');
    } catch (err) {
      alert(`Failed to update reservation timing: ${err.message}`);
    }
  };

  // Item Price Edit in Database
  const handleSaveItemPrice = async (itemId) => {
    if (!editingPriceValue) return;

    try {
      const formattedPrice = editingPriceValue.includes('₹') ? editingPriceValue : `₹${editingPriceValue}`;
      const priceNumeric = parseFloat(editingPriceValue.replace(/[^0-9.]/g, '')) || 0;

      await api.updateMenuItem(itemId, { price: formattedPrice, price_numeric: priceNumeric });

      setMenuItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, price: formattedPrice, price_numeric: priceNumeric } : item))
      );

      setEditingPriceItemId(null);
      setEditingPriceValue('');
      alert(`Price updated to ${formattedPrice} in database! Customer website will immediately reflect this change.`);
    } catch (err) {
      alert(`Failed to update item price: ${err.message}`);
    }
  };

  // Order KDS Status Update
  const handleUpdateOrderStatus = async (id, newStatus, paymentStatus) => {
    try {
      await api.updateAdminOrderStatus(id, newStatus, paymentStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus, payment_status: paymentStatus || o.payment_status } : o))
      );
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus, payment_status: paymentStatus || prev.payment_status }));
      }
      const statsRes = await api.getAdminStats();
      if (statsRes?.data) setStats(statsRes.data);
    } catch (err) {
      alert(`Failed to update order status: ${err.message}`);
    }
  };

  // Add Menu Item Submit
  const handleAddMenuSubmit = async (e) => {
    e.preventDefault();
    if (!menuForm.name || !menuForm.price) return;
    try {
      const formattedPrice = menuForm.price.includes('₹') ? menuForm.price : `₹${menuForm.price}`;
      await api.createMenuItem({ ...menuForm, price: formattedPrice });
      const menuRes = await api.getMenu();
      if (menuRes?.data) setMenuItems(menuRes.data);
      setIsAddMenuModalOpen(false);
      setMenuForm({ name: '', category: 'Main Course', price: '799', description: '', image: '' });
    } catch (err) {
      alert(`Failed to create menu item: ${err.message}`);
    }
  };

  // Filtered Reservations
  const filteredBookings = reservations.filter((r) => {
    const matchesSearch =
      !bookingSearch ||
      r.id.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      r.customer_name?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      r.customer_email?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      r.customer_mobile?.toLowerCase().includes(bookingSearch.toLowerCase());
    const matchesStatus = bookingStatusFilter === 'ALL' || r.status === bookingStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !orderSearch ||
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer_mobile?.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Menu Items
  const filteredMenuItems = menuItems.filter((m) =>
    !menuSearch || m.name.toLowerCase().includes(menuSearch.toLowerCase()) || m.category.toLowerCase().includes(menuSearch.toLowerCase())
  );

  return (
    <div className="pt-24 pb-20 bg-[#0f141c] min-h-screen text-[#f8fafc] flex flex-col md:flex-row">
      {/* Mobile Drawer Toggle Bar */}
      <div className="md:hidden bg-[#161c26] border-b border-[#2d3748] p-4 flex items-center justify-between sticky top-20 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#f59e0b] text-white flex items-center justify-center font-bold">
            NW
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase">OWNER PORTAL</h2>
            <p className="text-[11px] text-[#94a3b8]">{ownerUser.name}</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl bg-[#2d3748] text-white cursor-pointer"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Owner Navigation Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-[#161c26] border-r border-[#2d3748] p-4 shrink-0 md:min-h-[calc(100vh-6rem)]`}
      >
        <div className="hidden md:flex flex-col gap-1 pb-6 mb-6 border-b border-[#2d3748]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-extrabold text-[#f59e0b] uppercase tracking-wider">
              NO-WAIT CONTROL
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
              SQLITE DB LIVE
            </span>
          </div>
          <h2 className="text-xl font-bold text-white font-mono uppercase tracking-tight">
            OWNER <span className="text-gradient-orange">PANEL</span>
          </h2>
          <p className="text-xs text-[#94a3b8] truncate mt-1">
            Logged as <span className="text-white font-medium">{ownerUser.name}</span>
          </p>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="space-y-1.5">
          {OWNER_SIDEBAR_TABS.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-white shadow-lg shadow-[#f59e0b]/25'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#1e2532]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-[#2d3748]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-mono font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono uppercase tracking-tight">
              {OWNER_SIDEBAR_TABS.find((t) => t.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Live SQLite database control panel & real-time restaurant administration
            </p>
          </div>

          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-[#1e2532] border border-[#2d3748] hover:border-[#f59e0b]/50 text-[#94a3b8] hover:text-white text-xs font-mono font-bold flex items-center gap-2 w-fit cursor-pointer transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-[#f59e0b] ${loading ? 'animate-spin' : ''}`} />
            <span>SYNC DATA</span>
          </button>
        </div>

        {/* ================= TAB 1: OVERVIEW DASHBOARD ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Bookings */}
              <div className="bg-[#1e2532] p-5 rounded-3xl border border-[#2d3748] relative overflow-hidden group hover:border-[#f59e0b]/40 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[11px] font-mono uppercase font-bold text-[#94a3b8]">Total Bookings</span>
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">{stats.totalBookings}</div>
                <div className="mt-2 text-xs text-[#94a3b8] flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">{stats.todayBookings} Today</span>
                  <span>•</span>
                  <span>{stats.confirmedBookings} Confirmed</span>
                </div>
              </div>

              {/* Card 2: Total Orders */}
              <div className="bg-[#1e2532] p-5 rounded-3xl border border-[#2d3748] relative overflow-hidden group hover:border-[#f59e0b]/40 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[11px] font-mono uppercase font-bold text-[#94a3b8]">Total Orders</span>
                  <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">{stats.totalOrders}</div>
                <div className="mt-2 text-xs text-[#94a3b8] flex items-center gap-1.5">
                  <span className="text-indigo-400 font-bold">{stats.pendingOrders} Active</span>
                  <span>•</span>
                  <span>{stats.completedOrders} Completed</span>
                </div>
              </div>

              {/* Card 3: Registered Customers */}
              <div className="bg-[#1e2532] p-5 rounded-3xl border border-[#2d3748] relative overflow-hidden group hover:border-[#f59e0b]/40 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[11px] font-mono uppercase font-bold text-[#94a3b8]">Total Customers</span>
                  <div className="w-9 h-9 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">{stats.totalCustomers}</div>
                <div className="mt-2 text-xs text-[#94a3b8]">Registered Diners</div>
              </div>

              {/* Card 4: Total Revenue */}
              <div className="bg-[#1e2532] p-5 rounded-3xl border border-[#2d3748] relative overflow-hidden group hover:border-[#f59e0b]/40 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[11px] font-mono uppercase font-bold text-[#94a3b8]">Total Sales</span>
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-emerald-400 font-mono">{stats.totalRevenue}</div>
                <div className="mt-2 text-xs text-[#94a3b8]">
                  <span className="text-emerald-400 font-bold">{stats.todayRevenue} Today</span>
                </div>
              </div>
            </div>

            {/* Overview Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Volume */}
              <div className="bg-[#1e2532] p-6 rounded-3xl border border-[#2d3748]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono uppercase">WEEKLY VOLUME TRENDS</h3>
                    <p className="text-[11px] text-[#94a3b8]">Bookings vs Kitchen Orders</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-[#f59e0b]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> Bookings
                    </span>
                    <span className="flex items-center gap-1.5 text-indigo-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Orders
                    </span>
                  </div>
                </div>

                <div className="h-52 w-full flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-[#2d3748] relative">
                  {(analyticsData?.timeSeries || [
                    { day: 'Mon', bookings: 8, orders: 12 },
                    { day: 'Tue', bookings: 10, orders: 15 },
                    { day: 'Wed', bookings: 14, orders: 18 },
                    { day: 'Thu', bookings: 12, orders: 16 },
                    { day: 'Fri', bookings: 22, orders: 28 },
                    { day: 'Sat', bookings: 30, orders: 35 },
                    { day: 'Sun', bookings: 25, orders: 31 }
                  ]).map((pt, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="w-full flex justify-center items-end gap-1.5 h-full">
                        <div
                          style={{ height: `${(pt.bookings / 35) * 100}%` }}
                          className="w-3.5 bg-gradient-to-t from-[#d97706] to-[#f59e0b] rounded-t-md"
                        />
                        <div
                          style={{ height: `${(pt.orders / 35) * 100}%` }}
                          className="w-3.5 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md"
                        />
                      </div>
                      <span className="text-[11px] font-mono text-[#94a3b8] mt-1">{pt.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 2: Status Breakdown */}
              <div className="bg-[#1e2532] p-6 rounded-3xl border border-[#2d3748]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono uppercase">ORDER KITCHEN STATUS</h3>
                    <p className="text-[11px] text-[#94a3b8]">Live breakdown of active orders</p>
                  </div>
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Received (New)', count: orders.filter((o) => o.status === 'RECEIVED').length, color: 'bg-amber-500' },
                    { label: 'Kitchen Preparing', count: orders.filter((o) => o.status === 'PREPARING').length, color: 'bg-blue-500' },
                    { label: 'Ready for Table', count: orders.filter((o) => o.status === 'READY').length, color: 'bg-indigo-500' },
                    { label: 'Served', count: orders.filter((o) => o.status === 'SERVED').length, color: 'bg-purple-500' },
                    { label: 'Completed', count: orders.filter((o) => o.status === 'COMPLETED').length, color: 'bg-emerald-500' }
                  ].map((item, idx) => {
                    const total = orders.length || 1;
                    const pct = Math.round((item.count / total) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-[#94a3b8]">{item.label}</span>
                          <span className="text-white font-bold">{item.count} ({pct}%)</span>
                        </div>
                        <div className="h-2.5 w-full bg-[#0f141c] rounded-full overflow-hidden border border-[#2d3748]">
                          <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: BOOKINGS & ARRIVAL/LEAVING TIMINGS ================= */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Search & Filter */}
            <div className="bg-[#1e2532] p-4 rounded-3xl border border-[#2d3748] flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Search customer, ID, mobile..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#0f141c] border border-[#2d3748] rounded-2xl text-xs text-white outline-none focus:border-[#f59e0b]"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none">
                {['ALL', 'CONFIRMED', 'HELD', 'COMPLETED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setBookingStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all ${
                      bookingStatusFilter === st
                        ? 'bg-[#f59e0b] text-white shadow-md'
                        : 'bg-[#0f141c] text-[#94a3b8] border border-[#2d3748] hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Bookings Table with Arrival & Leaving Times */}
            <div className="bg-[#1e2532] rounded-3xl border border-[#2d3748] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#161c26] border-b border-[#2d3748] text-[#94a3b8] uppercase">
                    <tr>
                      <th className="py-4 px-4">Booking ID</th>
                      <th className="py-4 px-4">Customer</th>
                      <th className="py-4 px-4">Booking Date & Time</th>
                      <th className="py-4 px-4">Arrival → Leaving Time</th>
                      <th className="py-4 px-4">Table / Party</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d3748]">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-[#94a3b8]">
                          No reservations match the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((res) => (
                        <tr key={res.id} className="hover:bg-[#252f3e] transition-colors">
                          <td className="py-4 px-4 font-bold text-white">{res.id}</td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-white">{res.customer_name || 'Guest'}</div>
                            <div className="text-[11px] text-[#94a3b8]">{res.customer_mobile || res.customer_email}</div>
                          </td>
                          <td className="py-4 px-4 text-white">
                            <div>{res.date}</div>
                            <div className="text-[11px] text-[#94a3b8]">{res.time}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="bg-[#0f141c] p-2 rounded-xl border border-[#2d3748] text-[11px]">
                              <span className="text-emerald-400 font-bold">Arrival:</span> {res.arrival_time || '7:15 PM'}
                              <span className="mx-1 text-[#94a3b8]">|</span>
                              <span className="text-amber-400 font-bold">Leaving:</span> {res.leaving_time || 'Not yet left'}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-[#94a3b8]">
                            <div>{res.table_number || res.table_id}</div>
                            <div className="text-[11px] text-white">{res.guests}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                res.status === 'CONFIRMED'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : res.status === 'COMPLETED'
                                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {res.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Edit Timing Button */}
                              <button
                                onClick={() => {
                                  setTimingModalReservation(res);
                                  setArrivalTimeInput(res.arrival_time || '7:15 PM');
                                  setLeavingTimeInput(res.leaving_time || '8:40 PM');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#2d3748] hover:bg-[#3b4758] text-white text-[11px] font-bold cursor-pointer flex items-center gap-1"
                              >
                                <Clock className="w-3 h-3 text-[#f59e0b]" /> Timing
                              </button>

                              {res.status !== 'COMPLETED' && (
                                <button
                                  onClick={() => handleUpdateBookingStatus(res.id, 'COMPLETED')}
                                  className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[11px] font-bold border border-emerald-500/30 cursor-pointer"
                                >
                                  Complete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: ORDERS MANAGEMENT ================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-[#1e2532] p-4 rounded-3xl border border-[#2d3748] flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Search order ID, item, customer..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#0f141c] border border-[#2d3748] rounded-2xl text-xs text-white outline-none focus:border-[#f59e0b]"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none">
                {['ALL', 'RECEIVED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all ${
                      orderStatusFilter === st
                        ? 'bg-[#f59e0b] text-white shadow-md'
                        : 'bg-[#0f141c] text-[#94a3b8] border border-[#2d3748] hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#1e2532] rounded-3xl border border-[#2d3748] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#161c26] border-b border-[#2d3748] text-[#94a3b8] uppercase">
                    <tr>
                      <th className="py-4 px-4">Order ID</th>
                      <th className="py-4 px-4">Customer</th>
                      <th className="py-4 px-4">Table</th>
                      <th className="py-4 px-4">Total Amount</th>
                      <th className="py-4 px-4">Payment</th>
                      <th className="py-4 px-4">Kitchen Status</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d3748]">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#252f3e] transition-colors">
                        <td className="py-4 px-4 font-bold text-white">{ord.id}</td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-white">{ord.customer_name || 'Walk-in'}</div>
                          <div className="text-[11px] text-[#94a3b8]">{ord.customer_mobile || ord.customer_email}</div>
                        </td>
                        <td className="py-4 px-4 text-[#94a3b8]">{ord.table_number || ord.table_id}</td>
                        <td className="py-4 px-4 text-emerald-400 font-bold">{ord.total}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.payment_status === 'PAID'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {ord.payment_status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="px-2.5 py-1 rounded-lg bg-[#2d3748] hover:bg-[#3b4758] text-white text-[11px] font-bold cursor-pointer"
                          >
                            View Order
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: MENU ITEMS & LIVE PRICE EDITING ================= */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold font-mono text-white">ITEMS & PRICE MANAGEMENT</h2>
                <p className="text-xs text-[#94a3b8]">
                  Price edits are saved directly into SQLite database and instantly update on the customer website!
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#161c26] border border-[#2d3748] rounded-xl text-xs text-white outline-none focus:border-[#f59e0b]"
                  />
                </div>
                <button
                  onClick={() => setIsAddMenuModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" /> ADD ITEM
                </button>
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMenuItems.map((item) => {
                const isEditingPrice = editingPriceItemId === item.id;
                return (
                  <div key={item.id} className="bg-[#1e2532] p-5 rounded-3xl border border-[#2d3748] flex flex-col justify-between space-y-4">
                    <div className="flex gap-4">
                      <img src={item.image} alt={item.name} className="w-20 h-20 rounded-2xl object-cover" />
                      <div className="flex-1">
                        <span className="text-[10px] uppercase font-mono font-bold text-[#f59e0b]">{item.category}</span>
                        <h3 className="text-base font-bold text-white mt-0.5">{item.name}</h3>

                        {/* Price Edit Input */}
                        <div className="mt-2 flex items-center gap-2">
                          {isEditingPrice ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-400 font-bold text-sm">₹</span>
                              <input
                                type="text"
                                value={editingPriceValue}
                                onChange={(e) => setEditingPriceValue(e.target.value)}
                                placeholder="140"
                                className="w-20 px-2 py-1 bg-[#0f141c] border border-[#f59e0b] rounded-lg text-white text-xs font-mono outline-none"
                              />
                              <button
                                onClick={() => handleSaveItemPrice(item.id)}
                                className="px-2 py-1 rounded-lg bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Save className="w-3 h-3" /> Save
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400 font-black font-mono text-lg">{item.price}</span>
                              <button
                                onClick={() => {
                                  setEditingPriceItemId(item.id);
                                  setEditingPriceValue(item.price.replace('₹', ''));
                                }}
                                className="px-2 py-0.5 rounded-md bg-[#2d3748] hover:bg-[#3b4758] text-[#94a3b8] hover:text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3 text-[#f59e0b]" /> Edit Price
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-[#94a3b8] line-clamp-2">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 5: OWNER TABLE CONTROL & CAPACITY ================= */}
        {activeTab === 'tables' && (
          <div className="space-y-6">
            {/* Filter & Action Bar */}
            <div className="bg-[#1e2532] p-6 rounded-3xl border border-[#2d3748] space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-mono text-white tracking-tight flex items-center gap-2">
                    <span>TABLE CAPACITY & OWNER CONTROL</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                      LIVE ENGINE
                    </span>
                  </h2>
                  <p className="text-xs text-[#94a3b8] mt-1">
                    Manage table availability, seating capacity, and real-time reservation interval overlaps
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setIsAddTableModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d97706] to-[#f59e0b] hover:from-[#b45309] hover:to-[#d97706] text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-[#f59e0b]/20 transition-all"
                  >
                    <Plus className="w-4 h-4" /> ADD NEW TABLE
                  </button>

                  <button
                    onClick={() => loadAdminTables(adminTableDate, adminTableTime)}
                    disabled={tableLoading}
                    className="px-4 py-2.5 rounded-xl bg-[#0f141c] border border-[#2d3748] hover:border-[#f59e0b]/50 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <RefreshCw className={`w-4 h-4 text-[#f59e0b] ${tableLoading ? 'animate-spin' : ''}`} />
                    <span>REFRESH</span>
                  </button>
                </div>
              </div>

              {/* Date & Time Context Selectors */}
              <div className="pt-4 border-t border-[#2d3748] flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-[#94a3b8] font-bold">DATE:</span>
                  <input
                    type="date"
                    value={adminTableDate}
                    onChange={(e) => setAdminTableDate(e.target.value)}
                    className="bg-[#0f141c] border border-[#2d3748] focus:border-[#f59e0b] rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[#94a3b8] font-bold">TIME INTERVAL:</span>
                  <select
                    value={adminTableTime}
                    onChange={(e) => setAdminTableTime(e.target.value)}
                    className="bg-[#0f141c] border border-[#2d3748] focus:border-[#f59e0b] rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                  >
                    {[
                      '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM',
                      '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM'
                    ].map((slot) => (
                      <option key={slot} value={slot}>
                        {slot} (2 hr window)
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-[11px] text-[#94a3b8]">
                  Showing capacity and reserved seats calculated for {adminTableDate} at {adminTableTime}.
                </span>
              </div>
            </div>

            {/* Quick KPI Counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#1e2532] p-4 rounded-2xl border border-[#2d3748]">
                <span className="text-[10px] font-mono uppercase text-[#94a3b8]">Total Tables</span>
                <div className="text-2xl font-bold font-mono text-white mt-1">{adminTables.length}</div>
              </div>
              <div className="bg-[#1e2532] p-4 rounded-2xl border border-[#2d3748]">
                <span className="text-[10px] font-mono uppercase text-emerald-400">Owner Available</span>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {adminTables.filter((t) => t.ownerStatus === 'AVAILABLE' && t.isActive).length}
                </div>
              </div>
              <div className="bg-[#1e2532] p-4 rounded-2xl border border-[#2d3748]">
                <span className="text-[10px] font-mono uppercase text-rose-400">Owner Unavailable</span>
                <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
                  {adminTables.filter((t) => t.ownerStatus === 'UNAVAILABLE' || !t.isActive).length}
                </div>
              </div>
              <div className="bg-[#1e2532] p-4 rounded-2xl border border-[#2d3748]">
                <span className="text-[10px] font-mono uppercase text-amber-400">Available Seats</span>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                  {adminTables
                    .filter((t) => t.isActive && t.ownerStatus === 'AVAILABLE')
                    .reduce((sum, t) => sum + (t.availableSeats !== undefined ? t.availableSeats : t.capacity), 0)}{' '}
                  <span className="text-xs text-[#94a3b8] font-normal">
                    /{adminTables.filter((t) => t.isActive).reduce((sum, t) => sum + t.capacity, 0)} Total
                  </span>
                </div>
              </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {adminTables.map((t) => {
                const isOwnerAvail = t.ownerStatus === 'AVAILABLE';
                const isActive = t.isActive !== false;
                const reserved = t.reservedSeats || 0;
                const available = t.availableSeats !== undefined ? t.availableSeats : t.capacity;
                const isFull = available <= 0;
                const isPartiallyAvailable = reserved > 0 && available > 0;
                const isEditingCap = editingCapacityTableId === t.id;

                let cardStatusBadge = null;
                if (!isActive) {
                  cardStatusBadge = (
                    <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-[11px] font-mono font-bold">
                      DEACTIVATED
                    </span>
                  );
                } else if (!isOwnerAvail) {
                  cardStatusBadge = (
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-mono font-bold">
                      OWNER UNAVAILABLE
                    </span>
                  );
                } else if (isFull) {
                  cardStatusBadge = (
                    <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-mono font-bold">
                      FULL ({t.capacity}/{t.capacity} RESERVED)
                    </span>
                  );
                } else if (isPartiallyAvailable) {
                  cardStatusBadge = (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-mono font-bold">
                      PARTIALLY AVAILABLE ({available} FREE)
                    </span>
                  );
                } else {
                  cardStatusBadge = (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-bold">
                      AVAILABLE ({t.capacity} FREE)
                    </span>
                  );
                }

                return (
                  <div
                    key={t.id}
                    className={`bg-[#1e2532] rounded-3xl border p-6 flex flex-col justify-between space-y-5 transition-all ${
                      !isActive
                        ? 'border-[#2d3748] opacity-60'
                        : !isOwnerAvail
                        ? 'border-rose-900/50 bg-[#161c26]'
                        : isFull
                        ? 'border-red-900/40'
                        : 'border-[#2d3748] hover:border-[#f59e0b]/50'
                    }`}
                  >
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl font-black font-mono text-white tracking-tight">
                            {t.table_number}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {t.zone || 'Main Dining'}
                          </span>
                        </div>
                        {cardStatusBadge}
                      </div>

                      {/* Capacity & Seating Metrics Box */}
                      <div className="grid grid-cols-3 gap-2 bg-[#0f141c] p-3.5 rounded-2xl border border-[#2d3748] text-center font-mono my-3">
                        {/* Seating Capacity */}
                        <div>
                          <span className="text-[10px] text-[#94a3b8] uppercase block">Capacity</span>
                          {isEditingCap ? (
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={editingCapacityValue}
                                onChange={(e) => setEditingCapacityValue(e.target.value)}
                                className="w-12 px-1 py-0.5 bg-[#161c26] border border-[#f59e0b] rounded text-white text-xs font-mono text-center outline-none"
                              />
                              <button
                                onClick={() => handleSaveCapacity(t.id)}
                                className="p-1 bg-emerald-500 text-white rounded cursor-pointer"
                                title="Save"
                              >
                                <Save className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 mt-0.5">
                              <span className="text-base font-bold text-white">{t.capacity}</span>
                              <button
                                onClick={() => {
                                  setEditingCapacityTableId(t.id);
                                  setEditingCapacityValue(t.capacity);
                                }}
                                className="text-[#94a3b8] hover:text-[#f59e0b] cursor-pointer"
                                title="Change Capacity"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Reserved Seats */}
                        <div className="border-x border-[#2d3748]">
                          <span className="text-[10px] text-[#94a3b8] uppercase block">Reserved</span>
                          <span className="text-base font-bold text-amber-400 mt-0.5 block">{reserved}</span>
                        </div>

                        {/* Available Seats */}
                        <div>
                          <span className="text-[10px] text-[#94a3b8] uppercase block">Available</span>
                          <span
                            className={`text-base font-bold mt-0.5 block ${
                              available > 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {available}
                          </span>
                        </div>
                      </div>

                      {/* Current Overlapping Reservations List */}
                      {t.currentReservations && t.currentReservations.length > 0 ? (
                        <div className="bg-[#161c26] p-3 rounded-xl border border-[#2d3748] space-y-1.5 text-xs font-mono">
                          <span className="text-[10px] font-bold text-[#f59e0b] uppercase block">
                            ACTIVE OVERLAPS ({adminTableTime}):
                          </span>
                          {t.currentReservations.map((r, rIdx) => (
                            <div key={rIdx} className="text-[#94a3b8] text-[11px] flex justify-between">
                              <span>
                                • {r.customerName || 'Customer'} ({r.guests})
                              </span>
                              <span className="text-white">
                                {r.time} - {r.leavingTime || '2h'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-[#94a3b8] italic">
                          No overlapping bookings during this 2-hour interval.
                        </div>
                      )}
                    </div>

                    {/* Owner Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-[#2d3748]">
                      <div className="flex gap-2">
                        {/* MAKE AVAILABLE / MAKE UNAVAILABLE */}
                        {isOwnerAvail ? (
                          <button
                            onClick={() => handleToggleOwnerStatus(t)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-mono font-bold cursor-pointer transition-all"
                          >
                            MAKE UNAVAILABLE
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleOwnerStatus(t)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold cursor-pointer transition-all shadow-md shadow-emerald-500/10"
                          >
                            MAKE AVAILABLE
                          </button>
                        )}

                        {/* DEACTIVATE / REACTIVATE */}
                        {isActive ? (
                          <button
                            onClick={() => handleToggleTableActive(t)}
                            className="py-2.5 px-3 rounded-xl bg-[#0f141c] hover:bg-zinc-800 border border-[#2d3748] text-zinc-400 hover:text-white text-xs font-mono font-bold cursor-pointer transition-all"
                            title="Soft deactivate table preserving historical records"
                          >
                            DEACTIVATE
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleTableActive(t)}
                            className="py-2.5 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-400 text-xs font-mono font-bold cursor-pointer transition-all"
                          >
                            REACTIVATE
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 6: CUSTOMERS ================= */}
        {activeTab === 'customers' && (
          <div className="bg-[#1e2532] rounded-3xl border border-[#2d3748] p-6 space-y-4">
            <h2 className="text-xl font-bold font-mono text-white">REGISTERED CUSTOMER DIRECTORY</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-[#2d3748] text-[#94a3b8]">
                  <tr>
                    <th className="py-3 px-2">Name</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Mobile</th>
                    <th className="py-3 px-2">Total Bookings</th>
                    <th className="py-3 px-2">Total Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2d3748]">
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 px-2 font-bold text-white">{c.name}</td>
                      <td className="py-3 px-2 text-[#94a3b8]">{c.email}</td>
                      <td className="py-3 px-2 text-[#94a3b8]">{c.mobile_number || 'N/A'}</td>
                      <td className="py-3 px-2 text-white font-bold">{c.total_bookings || 0}</td>
                      <td className="py-3 px-2 text-white font-bold">{c.total_orders || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 7: ANALYTICS ================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold font-mono text-white">ANALYTICS SUMMARY</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1e2532] p-6 rounded-3xl border border-[#2d3748]">
                <span className="text-xs text-[#94a3b8]">Total Sales</span>
                <div className="text-3xl font-bold text-emerald-400 font-mono mt-1">{stats.totalRevenue}</div>
              </div>
              <div className="bg-[#1e2532] p-6 rounded-3xl border border-[#2d3748]">
                <span className="text-xs text-[#94a3b8]">Total Reservations</span>
                <div className="text-3xl font-bold text-white font-mono mt-1">{stats.totalBookings}</div>
              </div>
              <div className="bg-[#1e2532] p-6 rounded-3xl border border-[#2d3748]">
                <span className="text-xs text-[#94a3b8]">Satisfaction</span>
                <div className="text-3xl font-bold text-amber-400 font-mono mt-1">98.6%</div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 8: SETTINGS ================= */}
        {activeTab === 'settings' && (
          <div className="bg-[#1e2532] p-6 rounded-3xl border border-[#2d3748] max-w-md space-y-4 text-xs font-mono">
            <h2 className="text-xl font-bold text-white">OWNER SETTINGS</h2>
            <div>
              <label className="block text-[#94a3b8] mb-1">Restaurant Name</label>
              <input type="text" defaultValue="NO-WAIT RESTAURANT" className="w-full px-4 py-2.5 bg-[#0f141c] border border-[#2d3748] rounded-xl text-white outline-none" />
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL: CUSTOMER ARRIVAL & LEAVING TIME EDIT ================= */}
      <AnimatePresence>
        {timingModalReservation && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161c26] border border-[#2d3748] p-6 rounded-3xl max-w-md w-full space-y-5 text-xs font-mono relative"
            >
              <button
                onClick={() => setTimingModalReservation(null)}
                className="absolute top-4 right-4 p-2 text-[#94a3b8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">UPDATE TIMING FOR {timingModalReservation.id}</h3>
                  <p className="text-[#94a3b8]">{timingModalReservation.customer_name || 'Guest'}</p>
                </div>
              </div>

              <form onSubmit={handleSaveTiming} className="space-y-4">
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-bold">
                    Customer Arrival Time (e.g. 7:15 PM)
                  </label>
                  <input
                    type="text"
                    value={arrivalTimeInput}
                    onChange={(e) => setArrivalTimeInput(e.target.value)}
                    placeholder="7:15 PM"
                    required
                    className="w-full px-4 py-3 bg-[#0f141c] border border-[#2d3748] rounded-xl text-white outline-none focus:border-[#f59e0b]"
                  />
                </div>

                <div>
                  <label className="block text-[#94a3b8] mb-1 font-bold">
                    Customer Leaving Time (e.g. 8:40 PM or "Not yet left")
                  </label>
                  <input
                    type="text"
                    value={leavingTimeInput}
                    onChange={(e) => setLeavingTimeInput(e.target.value)}
                    placeholder="8:40 PM or Not yet left"
                    required
                    className="w-full px-4 py-3 bg-[#0f141c] border border-[#2d3748] rounded-xl text-white outline-none focus:border-[#f59e0b]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-white font-bold cursor-pointer shadow-lg shadow-[#f59e0b]/25"
                >
                  SAVE ARRIVAL & LEAVING TIMES
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: ORDER DETAILS ================= */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161c26] border border-[#2d3748] p-6 rounded-3xl max-w-lg w-full space-y-6 text-xs font-mono relative"
            >
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute top-4 right-4 p-2 text-[#94a3b8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">ORDER DETAILS #{selectedOrder.id}</h3>
                  <p className="text-[#94a3b8]">Table: {selectedOrder.table_number || selectedOrder.table_id}</p>
                </div>
              </div>

              <div className="bg-[#0f141c] p-4 rounded-2xl border border-[#2d3748] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Customer:</span>
                  <span className="text-white font-bold">{selectedOrder.customer_name || 'Guest'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Mobile:</span>
                  <span className="text-white">{selectedOrder.customer_mobile || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Total Amount:</span>
                  <span className="text-emerald-400 font-bold">{selectedOrder.total}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: ADD NEW TABLE ================= */}
      <AnimatePresence>
        {isAddTableModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161c26] border border-[#2d3748] p-6 rounded-3xl max-w-md w-full space-y-5 text-xs font-mono relative"
            >
              <button
                onClick={() => setIsAddTableModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-[#94a3b8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#f59e0b]/20 text-[#f59e0b] flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">ADD NEW RESTAURANT TABLE</h3>
                  <p className="text-[#94a3b8]">Create a new dining table in SQLite database</p>
                </div>
              </div>

              <form onSubmit={handleAddTableSubmit} className="space-y-4">
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-bold">
                    Table Number / Identifier (e.g. Table 09 or 09)
                  </label>
                  <input
                    type="text"
                    value={newTableForm.tableNumber}
                    onChange={(e) => setNewTableForm({ ...newTableForm, tableNumber: e.target.value })}
                    placeholder="Table 09"
                    required
                    className="w-full px-4 py-3 bg-[#0f141c] border border-[#2d3748] rounded-xl text-white outline-none focus:border-[#f59e0b]"
                  />
                </div>

                <div>
                  <label className="block text-[#94a3b8] mb-1 font-bold">
                    Seating Capacity (Guests)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newTableForm.capacity}
                    onChange={(e) => setNewTableForm({ ...newTableForm, capacity: e.target.value })}
                    placeholder="4"
                    required
                    className="w-full px-4 py-3 bg-[#0f141c] border border-[#2d3748] rounded-xl text-white outline-none focus:border-[#f59e0b]"
                  />
                </div>

                <div>
                  <label className="block text-[#94a3b8] mb-1 font-bold">
                    Dining Zone / Atmosphere
                  </label>
                  <select
                    value={newTableForm.zone}
                    onChange={(e) => setNewTableForm({ ...newTableForm, zone: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f141c] border border-[#2d3748] rounded-xl text-white outline-none focus:border-[#f59e0b] cursor-pointer"
                  >
                    <option value="Main Dining">Main Dining</option>
                    <option value="Window View">Window View</option>
                    <option value="Executive Booth">Executive Booth</option>
                    <option value="Patio Lounge">Patio Lounge</option>
                    <option value="VIP Lounge">VIP Lounge</option>
                    <option value="Private Dining Room">Private Dining Room</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d97706] to-[#f59e0b] hover:from-[#b45309] hover:to-[#d97706] text-white font-bold cursor-pointer shadow-lg shadow-[#f59e0b]/25 transition-all uppercase"
                >
                  CREATE TABLE IN DATABASE
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

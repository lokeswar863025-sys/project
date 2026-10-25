import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, ShoppingBag, Plus, Minus, Check, Sparkles, AlertTriangle, ArrowRight, Clock, Star, CreditCard, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { SAMPLE_MENU, MENU_CATEGORIES } from '../data/sampleMenu';
import {
  TABLE_MAP,
  normalizeTableParam,
  validateTable,
  calculateCartTotals,
  placeOrder,
  ORDER_STATUS
} from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import CartDrawer from '../components/CartDrawer';
import OrderStatusTracker from '../components/OrderStatusTracker';
import PaymentModal from '../components/PaymentModal';
import FadeUp from '../components/animations/FadeUp';
import api from '../services/api';

export default function QROrderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // URL Table Detection (/qr-order?table=T04 or table=04)
  const rawTableParam = searchParams.get('table') || 'T04';
  const reservationIdParam = searchParams.get('reservationId');
  const tableId = normalizeTableParam(rawTableParam);
  const tableObj = validateTable(tableId);

  // Reservation Verification State (Phase 13: Customer must have confirmed reservation)
  const [activeReservation, setActiveReservation] = useState(null);
  const [hasValidReservation, setHasValidReservation] = useState(false);
  const [checkingReservation, setCheckingReservation] = useState(true);

  // States
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState(ORDER_STATUS.RECEIVED);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Verify Customer Reservation
  useEffect(() => {
    let isMounted = true;
    setCheckingReservation(true);

    if (!user) {
      setHasValidReservation(false);
      setActiveReservation(null);
      setCheckingReservation(false);
      return;
    }

    api.getMyReservations(user.uid)
      .then((res) => {
        if (!isMounted) return;
        if (res.data && Array.isArray(res.data)) {
          // Find matching confirmed reservation for this user and table (or specific reservationId)
          const confirmed = res.data.filter((r) => r.status === 'CONFIRMED');
          let match = null;
          if (reservationIdParam) {
            match = confirmed.find((r) => r.id === reservationIdParam);
          }
          if (!match) {
            match = confirmed.find((r) => r.table_id === tableId);
          }
          if (!match && confirmed.length > 0) {
            // Check if user has an active confirmed reservation for today
            const todayStr = new Date().toISOString().split('T')[0];
            match = confirmed.find((r) => r.date === todayStr) || confirmed[0];
          }

          if (match) {
            setActiveReservation(match);
            setHasValidReservation(true);
            if (match.table_id !== tableId && !reservationIdParam) {
              setSearchParams({ table: match.table_id, reservationId: match.id });
            }
          } else {
            setHasValidReservation(false);
            setActiveReservation(null);
          }
        } else {
          setHasValidReservation(false);
          setActiveReservation(null);
        }
      })
      .catch((err) => {
        console.warn('Reservation check warning:', err.message);
        setHasValidReservation(false);
      })
      .finally(() => {
        if (isMounted) setCheckingReservation(false);
      });

    return () => { isMounted = false; };
  }, [user, tableId, reservationIdParam]);

  // Filtered menu
  const filteredMenu = activeCategory === 'All'
    ? SAMPLE_MENU
    : SAMPLE_MENU.filter((m) => m.category === activeCategory);

  // Cart operations
  const handleAddToCart = async (item) => {
    if (!hasValidReservation) {
      setOrderError('PLEASE RESERVE A TABLE BEFORE ORDERING FOOD.');
      return;
    }

    let updatedCart = [];
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        updatedCart = prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      } else {
        updatedCart = [...prev, { ...item, quantity: 1 }];
      }
      return updatedCart;
    });

    // Auto-create/update backend order & open payment QR modal
    triggerPaymentModalForCart(updatedCart.length > 0 ? updatedCart : [...cart, { ...item, quantity: 1 }]);
  };

  const handleUpdateQuantity = (id, newQty) => {
    if (!hasValidReservation) return;
    if (newQty <= 0) {
      handleRemoveItem(id);
      return;
    }
    const updated = cart.map((i) => (i.id === id ? { ...i, quantity: newQty } : i));
    setCart(updated);
    if (updated.length > 0) {
      triggerPaymentModalForCart(updated);
    }
  };

  const handleRemoveItem = (id) => {
    const updated = cart.filter((i) => i.id !== id);
    setCart(updated);
  };

  // Phase 11 & Phase 13 Payment QR Trigger with Reservation Association
  const triggerPaymentModalForCart = async (cartItems) => {
    if (!cartItems || cartItems.length === 0) return;
    if (!hasValidReservation) {
      setOrderError('PLEASE RESERVE A TABLE BEFORE ORDERING FOOD.');
      return;
    }

    setIsSubmitting(true);
    setOrderError('');

    try {
      // Backend API call verifying customer confirmed reservation & server-side totals
      const res = await api.createOrder({
        tableId: activeReservation?.table_id || tableId || 'T04',
        reservationId: activeReservation?.id,
        items: cartItems.map((c) => ({ id: c.id, quantity: c.quantity })),
        customerName: user?.displayName || activeReservation?.customer_name || 'Diner',
        customerMobile: user?.mobile || activeReservation?.customer_mobile || ''
      }, user?.uid);

      if (res.data) {
        setPlacedOrder({
          id: res.data.id,
          tableName: tableObj ? tableObj.name : `Table ${tableId}`,
          tableZone: tableObj ? tableObj.zone : 'Main Dining',
          customerName: res.data.customer_name || 'Diner',
          subtotal: res.data.subtotal,
          tax: res.data.tax,
          total: res.data.total,
          paymentReference: res.data.payment_reference,
          paymentStatus: res.data.payment_status || 'PENDING',
          items: res.data.items || cartItems
        });
        setIsPaymentModalOpen(true);
      }
    } catch (err) {
      if (err.status === 403 || err.message?.includes('RESERVE A TABLE BEFORE ORDERING')) {
        setOrderError(err.message || 'PLEASE RESERVE A TABLE BEFORE ORDERING FOOD.');
        setHasValidReservation(false);
      } else {
        // Fallback local calculation
        const localTotals = calculateCartTotals(cartItems);
        const localOrder = placeOrder({
          tableId: activeReservation?.table_id || tableId || 'T04',
          reservationId: activeReservation?.id,
          cartItems,
          customerName: user?.displayName || 'Diner',
          userId: user?.uid || 'guest-qr'
        });
        setPlacedOrder(localOrder);
        setIsPaymentModalOpen(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const cartTotals = calculateCartTotals(cart);
  const totalCartItemsCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="pt-28 pb-32 bg-[#050505] min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Invalid Table URL Warning Banner */}
        {!tableObj && (
          <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between gap-4 font-mono">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>Unrecognized table parameter in URL. Select your active dining table:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.keys(TABLE_MAP).map((tId) => (
                <button
                  key={tId}
                  onClick={() => setSearchParams({ table: tId })}
                  className="px-2.5 py-1 rounded bg-[#111111] border border-[#252525] text-white hover:text-[#FF4D00] text-xs font-mono font-bold"
                >
                  {tId}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ORDER CONFIRMATION & LIVE TRACKER VIEW */}
        {placedOrder && !isPaymentModalOpen ? (
          <FadeUp className="max-w-4xl mx-auto space-y-8">
            {/* Header Banner */}
            <div className="bg-[#111111] p-8 rounded-3xl border border-[#FF4D00]/50 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <span className="text-xs uppercase tracking-widest font-mono font-extrabold text-[#FF4D00]">
                DISPATCHED TO KITCHEN
              </span>
              <h1 className="mt-1 text-4xl font-extrabold text-white font-mono uppercase">
                ORDER RECEIVED
              </h1>
              <p className="mt-2 text-sm text-[#A1A1A1]">
                Your table order has been transmitted directly to our chefs.
              </p>

              {/* Order Info Card */}
              <div className="mt-6 p-6 rounded-2xl bg-[#050505] border border-[#252525] text-left space-y-3 font-mono text-xs">
                <div className="flex justify-between pb-3 border-b border-[#252525]">
                  <span className="text-[#A1A1A1]">Order ID:</span>
                  <span className="text-[#FF4D00] font-bold">{placedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1A1]">Assigned Table:</span>
                  <span className="text-white font-bold">{placedOrder.tableName} ({placedOrder.tableZone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1A1]">Customer Name:</span>
                  <span className="text-white font-bold">{placedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1A1]">Payment Reference:</span>
                  <span className="text-emerald-400 font-bold">{placedOrder.paymentReference || 'NW-PAY-20260811-0001'}</span>
                </div>

                {/* Line Items */}
                <div className="pt-3 border-t border-[#252525] space-y-2">
                  <span className="text-[#A1A1A1] block mb-1">Ordered Dishes:</span>
                  {placedOrder.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-white">
                      <span>{it.quantity}× {it.itemName || it.name}</span>
                      <span className="text-[#FF7A00]">{it.price}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-3 border-t border-[#252525] text-sm text-white font-bold">
                  <span>Grand Total (incl. Tax):</span>
                  <span className="text-[#FF4D00] text-base">{placedOrder.total}</span>
                </div>
              </div>

              {/* Online Payment QR Trigger */}
              <div className="mt-6">
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full py-4 rounded-2xl bg-[#050505] hover:bg-[#111111] border border-[#FF4D00] text-[#FF4D00] hover:text-white font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg font-mono"
                >
                  <QrCode className="w-5 h-5 text-[#FF4D00]" />
                  PAY BILL VIA ONLINE PAYMENT QR ({placedOrder.total})
                </button>
              </div>
            </div>

            {/* Live Order Status Tracker */}
            <OrderStatusTracker
              currentStatus={orderStatus}
              onStatusChange={(newStatus) => setOrderStatus(newStatus)}
            />

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/orders"
                className="px-8 py-4 rounded-full bg-[#111111] border border-[#FF4D00] text-white hover:text-[#FF4D00] font-extrabold text-sm font-mono tracking-wide shadow-xl flex items-center gap-2 hover:scale-105 transition-all"
              >
                <ShoppingBag className="w-4 h-4 text-[#FF4D00]" />
                VIEW ORDER HISTORY
              </Link>
            </div>
          </FadeUp>
        ) : checkingReservation ? (
          <div className="py-24 text-center font-mono text-sm text-[#FF4D00] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF4D00]" />
            <span>VERIFYING TABLE RESERVATION STATUS...</span>
          </div>
        ) : !hasValidReservation ? (
          <FadeUp className="max-w-2xl mx-auto my-12 bg-[#111111] p-8 sm:p-12 rounded-3xl border border-amber-500/40 text-center shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest font-mono font-extrabold text-[#FF4D00]">
                RESERVATION REQUIRED
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono uppercase mt-2">
                PLEASE RESERVE A TABLE BEFORE ORDERING FOOD.
              </h2>
              <p className="mt-3 text-sm text-[#A1A1A1] leading-relaxed">
                A confirmed table reservation is required before ordering food at {tableObj ? tableObj.name : `Table ${tableId}`}. Please reserve your table first to enjoy seamless dining with zero wait times.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/book"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-extrabold text-xs font-mono shadow-xl shadow-[#FF4D00]/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                BOOK A TABLE
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/menu"
                className="w-full sm:w-auto px-6 py-4 rounded-full bg-[#050505] border border-[#252525] hover:border-[#FF4D00]/50 text-[#A1A1A1] hover:text-white font-bold text-xs font-mono transition-all"
              >
                VIEW MENU SHOWCASE
              </Link>
            </div>
          </FadeUp>
        ) : (
          <>
            {/* Table Header Section */}
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111111] border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold mb-4">
                <CheckCircle2 className="w-4 h-4" />
                ORDER FOOD FOR {tableObj ? tableObj.name.toUpperCase() : `TABLE ${tableId}`} — RESERVATION #{activeReservation?.id}
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold text-white font-mono tracking-tight">
                TOUCHLESS <span className="text-gradient-orange">DIGITAL MENU</span>
              </h1>
              
              <p className="mt-3 text-base text-[#A1A1A1]">
                Reservation confirmed for {activeReservation?.customer_name || 'Valued Diner'} ({activeReservation?.guests || '2 Guests'}). Select your signature dishes to send to the kitchen.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-10">
              {MENU_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white shadow-lg shadow-[#FF4D00]/25'
                      : 'bg-[#111111] text-[#A1A1A1] border border-[#252525] hover:text-white hover:border-[#FF4D00]/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Food Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredMenu.map((item) => {
                const inCart = cart.find((i) => i.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-[#111111] rounded-2xl border border-[#252525] overflow-hidden hover:border-[#FF4D00]/40 transition-colors duration-300 flex flex-col group shadow-xl"
                  >
                    {/* Food Image */}
                    <div className="relative h-52 overflow-hidden bg-[#050505]">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#050505]/80 backdrop-blur-md text-[11px] font-mono font-bold text-white border border-[#252525]">
                        {item.category}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-[#FF7A00] transition-colors">
                          {item.name}
                        </h3>
                        <p className="mt-2 text-xs text-[#A1A1A1] leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Price & ADD TO TABLE Controls */}
                      <div className="mt-6 pt-4 border-t border-[#252525] flex items-center justify-between">
                        <div>
                          <span className="text-xs text-[#A1A1A1] block font-mono">Price</span>
                          <span className="text-2xl font-black text-white font-mono">{item.price}</span>
                        </div>

                        {inCart ? (
                          <div className="flex items-center gap-2 bg-[#050505] p-1.5 rounded-xl border border-[#FF4D00]">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, inCart.quantity - 1)}
                              className="w-8 h-8 rounded-lg bg-[#111111] text-white flex items-center justify-center hover:text-[#FF4D00] cursor-pointer"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-mono font-bold text-white px-2">
                              {inCart.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, inCart.quantity + 1)}
                              className="w-8 h-8 rounded-lg bg-[#111111] text-white flex items-center justify-center hover:text-[#FF4D00] cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAddToCart(item)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-mono font-extrabold text-xs shadow-md shadow-[#FF4D00]/20 cursor-pointer"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            ADD TO TABLE
                          </motion.button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && !placedOrder && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 left-4 right-4 z-40 max-w-2xl mx-auto bg-[#111111]/95 backdrop-blur-md border border-[#FF4D00] p-4 rounded-2xl shadow-2xl flex items-center justify-between font-mono"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF4D00] flex items-center justify-center text-white font-bold">
              {totalCartItemsCount}
            </div>
            <div>
              <div className="text-xs text-[#A1A1A1]">Total Table Bill</div>
              <div className="text-lg font-black text-white">{cartTotals.totalFormatted}</div>
            </div>
          </div>

          <button
            onClick={() => triggerPaymentModalForCart(cart)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white text-xs font-mono font-extrabold shadow-lg shadow-[#FF4D00]/30 flex items-center gap-2 cursor-pointer"
          >
            <QrCode className="w-4 h-4" /> VIEW PAYMENT QR
          </button>
        </motion.div>
      )}

      {/* DYNAMIC PAYMENT QR MODAL */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        orderId={placedOrder?.id}
        tableNumber={tableObj ? tableObj.name.replace('Table ', '') : '04'}
        items={placedOrder?.items || cart}
        subtotal={placedOrder?.subtotal || cartTotals.subtotalFormatted}
        tax={placedOrder?.tax || cartTotals.taxFormatted}
        total={placedOrder?.total || cartTotals.totalFormatted}
        paymentReference={placedOrder?.paymentReference}
        paymentStatus={placedOrder?.paymentStatus || 'PENDING'}
        onPaymentSuccess={(payData) => {
          setOrderStatus(ORDER_STATUS.PREPARING);
          if (placedOrder) {
            setPlacedOrder((prev) => prev ? { ...prev, paymentStatus: 'PAID' } : null);
          }
        }}
      />
    </div>
  );
}

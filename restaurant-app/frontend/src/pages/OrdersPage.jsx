import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, QrCode, Search, RefreshCw, Eye, ArrowRight, AlertCircle, CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserOrders } from '../services/orderService';
import { SAMPLE_MENU } from '../data/sampleMenu';
import api from '../services/api';
import CartDrawer from '../components/CartDrawer';
import FadeUp from '../components/animations/FadeUp';

const STATUS_FILTERS = ['All', 'Completed', 'Preparing', 'Cancelled'];

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);

  // Cart Drawer State for "Order Again"
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderAgainNotice, setOrderAgainNotice] = useState('');

  const fetchOrders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      // Primary DB call with customer data isolation
      const res = await api.getMyOrders(user.uid, { status: activeFilter, search: searchQuery });
      if (res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.warn('API Fetch failed, using local orders store fallback:', err.message);
      const localOrders = getUserOrders(user.uid);
      setOrders(localOrders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, activeFilter]);

  // Client-side search filter
  const filteredOrders = orders.filter((ord) => {
    // Status Filter
    if (activeFilter !== 'All') {
      if (activeFilter === 'Completed' && ord.status !== 'COMPLETED' && ord.status !== 'SERVED') return false;
      if (activeFilter === 'Preparing' && ord.status !== 'PREPARING' && ord.status !== 'RECEIVED') return false;
      if (activeFilter === 'Cancelled' && ord.status !== 'CANCELLED') return false;
    }

    // Search Filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchesId = ord.id?.toLowerCase().includes(q);
    const matchesTable = ord.table_id?.toLowerCase().includes(q) || ord.table_number?.toLowerCase().includes(q);
    const matchesDish = ord.items?.some((it) => (it.itemName || it.name)?.toLowerCase().includes(q));

    return matchesId || matchesTable || matchesDish;
  });

  // ORDER AGAIN FEATURE HANDLER
  const handleOrderAgain = (oldOrder) => {
    setOrderAgainNotice('');
    if (!oldOrder.items || oldOrder.items.length === 0) return;

    const availableItemsToAdd = [];
    let unavailableCount = 0;

    oldOrder.items.forEach((item) => {
      // Match item in canonical menu database
      const canonical = SAMPLE_MENU.find((m) => m.id === (item.menuItemId || item.id) || m.name === (item.itemName || item.name));
      if (canonical) {
        availableItemsToAdd.push({
          ...canonical,
          quantity: item.quantity
        });
      } else {
        unavailableCount++;
      }
    });

    if (availableItemsToAdd.length > 0) {
      setCart(availableItemsToAdd);
      setIsCartOpen(true);
      if (unavailableCount > 0) {
        setOrderAgainNotice(`${unavailableCount} dish(es) are no longer on the current menu.`);
      }
    } else {
      alert('The items from this previous order are currently unavailable on the menu.');
    }
  };

  const handleUpdateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i)));
  };

  const handleRemoveItem = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="pt-32 pb-24 bg-[#050505] min-h-screen text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center">
          <span className="text-xs uppercase tracking-widest font-mono font-extrabold text-[#FF4D00]">
            DINING RECEIPT HISTORY
          </span>
          <h1 className="mt-2 text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight uppercase">
            MY <span className="text-gradient-orange">ORDERS</span>
          </h1>
          <p className="mt-3 text-base text-[#A1A1A1]">
            Your complete dining and ordering history.
          </p>
        </div>

        {/* SEARCH BAR & STATUS FILTER TABS */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-[#252525]">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#A1A1A1] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order # or Food Item..."
              className="w-full bg-[#111111] border border-[#252525] focus:border-[#FF4D00] text-white text-xs font-mono rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full sm:w-auto">
            {STATUS_FILTERS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-4 py-2.5 rounded-full text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilter === tab
                    ? 'bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white shadow-md'
                    : 'bg-[#111111] text-[#A1A1A1] border border-[#252525] hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ORDERS LIST & EMPTY STATES */}
        <div className="mt-8">
          {loading ? (
            <div className="py-20 text-center text-[#A1A1A1] font-mono text-sm">
              <RefreshCw className="w-8 h-8 text-[#FF4D00] animate-spin mx-auto mb-3" />
              Loading your orders history...
            </div>
          ) : filteredOrders.length === 0 ? (
            /* EMPTY STATE */
            <FadeUp className="p-12 text-center bg-[#111111] rounded-3xl border border-[#252525] space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#050505] border border-[#252525] text-[#252525] flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8 text-[#FF4D00]" />
              </div>

              <h3 className="text-2xl font-bold text-white font-mono uppercase">NO ORDERS YET</h3>
              <p className="text-sm text-[#A1A1A1] max-w-md mx-auto">
                Your previous orders will appear here once you place your first order.
              </p>

              <div className="pt-2">
                <Link
                  to="/menu"
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-mono text-xs font-bold shadow-lg shadow-[#FF4D00]/25 inline-flex items-center gap-2"
                >
                  EXPLORE MENU <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </FadeUp>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-6 sm:p-8 rounded-3xl bg-[#111111] border border-[#252525] hover:border-[#FF4D00]/40 transition-all space-y-6 shadow-xl"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#252525]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF4D00] to-[#FF7A00] flex items-center justify-center text-white font-bold text-sm shadow-md">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-white font-mono">ORDER #{ord.id}</h3>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold ${
                            ord.status === 'COMPLETED' || ord.status === 'SERVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            ord.status === 'CANCELLED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/30'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                        <div className="text-xs text-[#A1A1A1] font-mono mt-1">
                          Table: <strong className="text-white">{ord.table_number || ord.tableName || ord.table_id}</strong> • Date: <strong className="text-[#FF7A00]">{new Date(ord.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono text-[#A1A1A1] block">Total Paid</span>
                      <span className="text-2xl font-black text-white font-mono">{ord.total}</span>
                    </div>
                  </div>

                  {/* Line Items List (Historical Purchase Prices) */}
                  <div className="space-y-2 font-mono text-xs text-[#A1A1A1] bg-[#050505] p-4 rounded-2xl border border-[#252525]">
                    <span className="text-white font-bold block mb-2">Ordered Dishes (Historical Price at Purchase):</span>
                    {ord.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between py-1 border-b border-[#252525] last:border-none">
                        <span className="text-white">{it.quantity}× {it.itemName || it.name}</span>
                        <span className="text-[#FF7A00] font-bold">{it.price}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => setSelectedOrderModal(ord)}
                      className="px-4 py-2.5 rounded-xl bg-[#050505] border border-[#252525] hover:border-[#FF4D00]/50 text-white font-mono text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-[#FF4D00]" /> VIEW DETAILS
                    </button>

                    <button
                      onClick={() => handleOrderAgain(ord)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-mono text-xs font-extrabold flex items-center gap-2 shadow-md hover:scale-105 transition-transform cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" /> ORDER AGAIN
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ORDER DETAILS MODAL (/orders/:orderId) */}
      {selectedOrderModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111111] border border-[#252525] rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
            <h3 className="text-2xl font-bold text-white font-mono uppercase border-b border-[#252525] pb-4">
              ORDER DETAILS #{selectedOrderModal.id}
            </h3>

            <div className="mt-6 space-y-3 font-mono text-xs text-[#A1A1A1]">
              <div className="flex justify-between py-1.5 border-b border-[#252525]">
                <span>Order Number:</span>
                <span className="text-[#FF4D00] font-bold">#{selectedOrderModal.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#252525]">
                <span>Customer Name:</span>
                <span className="text-white font-bold">{selectedOrderModal.customer_name || user?.displayName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#252525]">
                <span>Assigned Table:</span>
                <span className="text-white font-bold">{selectedOrderModal.table_number || selectedOrderModal.table_id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#252525]">
                <span>Order Status:</span>
                <span className="text-emerald-400 font-bold">{selectedOrderModal.status}</span>
              </div>

              {/* Line items with historical purchase prices */}
              <div className="pt-3 border-t border-[#252525] space-y-2">
                <span className="text-white block font-bold">Purchased Items:</span>
                {selectedOrderModal.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-white py-1">
                    <span>{it.quantity}× {it.itemName || it.name} ({it.price})</span>
                    <span className="text-[#FF7A00] font-bold">{it.subtotal || it.price}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#252525] space-y-1.5">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-white">{selectedOrderModal.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (5% GST):</span>
                  <span className="text-white">{selectedOrderModal.tax}</span>
                </div>
                <div className="flex justify-between text-sm text-white font-bold pt-2 border-t border-[#252525]">
                  <span>Grand Total:</span>
                  <span className="text-[#FF4D00] text-base">{selectedOrderModal.total}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderModal(null)}
              className="mt-8 w-full py-4 rounded-xl bg-[#252525] hover:bg-[#FF4D00] text-white font-mono font-bold text-xs transition-colors"
            >
              CLOSE DETAILS
            </button>
          </div>
        </div>
      )}

      {/* CART DRAWER FOR ORDER AGAIN */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onPlaceOrder={() => {
          setIsCartOpen(false);
          navigate('/qr-order?table=T04');
        }}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Mail, ShieldCheck, Calendar, QrCode, Phone, User, Edit3, ShoppingBag, ArrowRight, CheckCircle2, Clock, X, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserReservations } from '../services/bookingService';
import { getUserOrders } from '../services/orderService';
import api from '../services/api';
import FadeUp from '../components/animations/FadeUp';

export default function ProfilePage() {
  const { user, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editMobile, setEditMobile] = useState(user?.mobile || '9876543210');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.displayName || '');
      setEditMobile(user.mobile || '9876543210');

      const uid = user.uid || user.id;
      // Fetch user's isolated reservations and orders
      const res = getUserReservations(uid);
      const ord = getUserOrders(uid);
      setReservations(res);
      setOrders(ord);

      // Attempt async backend fetch
      api.getMyOrders(uid)
        .then((res) => { if (res.data) setOrders(res.data); })
        .catch(() => {});
      api.getMyReservations(uid)
        .then((res) => { if (res.data) setReservations(res.data); })
        .catch(() => {});
    }
  }, [user]);

  const handleUpdateProfileSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess(false);

    if (!editName.trim()) {
      setEditError('Please enter your Name.');
      return;
    }

    const cleanDigits = editMobile.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 10) {
      setEditError('Please enter a valid 10-digit Mobile Number.');
      return;
    }

    try {
      await updateUserProfile({ name: editName.trim(), mobileNumber: cleanDigits });
      setEditSuccess(true);
      setTimeout(() => {
        setEditSuccess(false);
        setIsEditModalOpen(false);
      }, 1200);
    } catch (error) {
      setEditError(error.message || 'Could not update your profile. Please try again.');
    }
  };

  const activeReservations = reservations.filter((r) => r.status === 'CONFIRMED');
  const upcomingReservation = activeReservations[0] || null;
  const lastOrder = orders[0] || null;

  return (
    <div className="pt-32 pb-24 bg-[#050505] min-h-screen text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Page Header */}
        <div className="text-center">
          <span className="text-xs uppercase tracking-widest font-mono font-extrabold text-[#FF4D00]">
            CUSTOMER ACCOUNT DASHBOARD
          </span>
          <h1 className="mt-2 text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight uppercase">
            MY <span className="text-gradient-orange">ACCOUNT & PROFILE</span>
          </h1>
        </div>

        {/* PROFILE CARD */}
        <div className="bg-[#111111] p-8 rounded-3xl border border-[#252525] shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-[#252525]">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User Avatar'}
                  className="w-24 h-24 rounded-2xl border-2 border-[#FF4D00] object-cover shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FF4D00] to-[#FF7A00] text-white font-bold text-3xl flex items-center justify-center shadow-xl">
                  {user?.displayName?.charAt(0) || 'U'}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <h2 className="text-2xl font-bold text-white font-mono uppercase">
                    {user?.displayName || 'Valued Diner'}
                  </h2>
                  <span className="px-3 py-1 rounded-full bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/30 text-[10px] font-mono font-bold">
                    CUSTOMER ACCOUNT
                  </span>
                </div>

                <p className="text-xs text-[#A1A1A1] flex items-center justify-center sm:justify-start gap-2 font-mono">
                  <Phone className="w-4 h-4 text-[#FF7A00]" />
                  Mobile: <strong className="text-white">{user?.mobile || '9876543210'}</strong>
                </p>

                {user?.email && !user.email.endsWith('@customer.nowait.local') && (
                  <p className="text-xs text-[#A1A1A1] flex items-center justify-center sm:justify-start gap-2 font-mono">
                    <Mail className="w-4 h-4 text-[#FF4D00]" />
                    {user.email}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-[#050505] border border-[#FF4D00] text-[#FF4D00] hover:text-white font-mono font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Edit3 className="w-4 h-4" /> EDIT PROFILE
              </button>

              <button
                onClick={logout}
                className="px-5 py-2.5 rounded-2xl bg-[#252525] hover:bg-rose-600 text-white font-mono font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>

          {/* CUSTOMER SUMMARY METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <Link
              to="/orders"
              className="p-5 rounded-2xl bg-[#050505] border border-[#252525] hover:border-[#FF4D00]/50 transition-all group"
            >
              <div className="flex items-center justify-between text-[#A1A1A1] mb-2 font-mono text-xs">
                <span>Total Orders</span>
                <ShoppingBag className="w-4 h-4 text-[#FF4D00]" />
              </div>
              <div className="text-3xl font-black text-white font-mono">{orders.length}</div>
              <span className="text-[11px] text-[#FF7A00] font-mono group-hover:underline">View My Orders →</span>
            </Link>

            <Link
              to="/reservations"
              className="p-5 rounded-2xl bg-[#050505] border border-[#252525] hover:border-[#FF4D00]/50 transition-all group"
            >
              <div className="flex items-center justify-between text-[#A1A1A1] mb-2 font-mono text-xs">
                <span>Total Reservations</span>
                <Calendar className="w-4 h-4 text-[#FF4D00]" />
              </div>
              <div className="text-3xl font-black text-white font-mono">{reservations.length}</div>
              <span className="text-[11px] text-[#FF7A00] font-mono group-hover:underline">View My Reservations →</span>
            </Link>

            <div className="p-5 rounded-2xl bg-[#050505] border border-[#252525]">
              <div className="flex items-center justify-between text-[#A1A1A1] mb-2 font-mono text-xs">
                <span>Upcoming Booking</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              {upcomingReservation ? (
                <div>
                  <div className="text-sm font-bold text-white font-mono">{upcomingReservation.tableName}</div>
                  <div className="text-[11px] text-[#FF7A00] font-mono">{upcomingReservation.date} @ {upcomingReservation.timeSlot}</div>
                </div>
              ) : (
                <div className="text-xs text-[#A1A1A1] font-mono">No active booking</div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-[#050505] border border-[#252525]">
              <div className="flex items-center justify-between text-[#A1A1A1] mb-2 font-mono text-xs">
                <span>Last Order</span>
                <QrCode className="w-4 h-4 text-[#FF7A00]" />
              </div>
              {lastOrder ? (
                <div>
                  <div className="text-sm font-bold text-white font-mono">#{lastOrder.id} ({lastOrder.total})</div>
                  <div className="text-[11px] text-emerald-400 font-mono">{lastOrder.status}</div>
                </div>
              ) : (
                <div className="text-xs text-[#A1A1A1] font-mono">No order history</div>
              )}
            </div>
          </div>
        </div>

        {/* CUSTOMER NAVIGATION HUB BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link
            to="/orders"
            className="p-6 rounded-3xl bg-[#111111] border border-[#252525] hover:border-[#FF4D00]/50 transition-all flex items-center justify-between group shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF4D00] to-[#FF7A00] flex items-center justify-center text-white">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-mono uppercase group-hover:text-[#FF7A00] transition-colors">MY ORDERS</h3>
                <p className="text-xs text-[#A1A1A1]">View dining & receipt history</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#A1A1A1] group-hover:text-white group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/reservations"
            className="p-6 rounded-3xl bg-[#111111] border border-[#252525] hover:border-[#FF4D00]/50 transition-all flex items-center justify-between group shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-mono uppercase group-hover:text-emerald-400 transition-colors">MY RESERVATIONS</h3>
                <p className="text-xs text-[#A1A1A1]">Manage table bookings</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#A1A1A1] group-hover:text-white group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/qr-order?table=T04"
            className="p-6 rounded-3xl bg-[#111111] border border-[#252525] hover:border-[#FF4D00]/50 transition-all flex items-center justify-between group shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-mono uppercase group-hover:text-[#FF7A00] transition-colors">QR MENU ORDER</h3>
                <p className="text-xs text-[#A1A1A1]">Order food at table</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#A1A1A1] group-hover:text-white group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#252525] rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#050505] border border-[#252525] text-[#A1A1A1] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-bold text-white font-mono uppercase mb-6">EDIT CUSTOMER PROFILE</h3>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{editError}</span>
              </div>
            )}

            {editSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#A1A1A1] mb-2 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-[#050505] border border-[#252525] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              {user?.email && !user.email.endsWith('@customer.nowait.local') && (
                <div>
                  <label className="block text-[#A1A1A1] mb-2 uppercase">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full bg-[#050505] border border-[#252525] rounded-xl px-4 py-3.5 text-[#A1A1A1] text-sm opacity-60 cursor-not-allowed"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#A1A1A1] mb-2 uppercase">Mobile Number (10 Digits)</label>
                <input
                  type="tel"
                  required
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  placeholder="Mobile Number"
                  className="w-full bg-[#050505] border border-[#252525] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#FF4D00]/30 cursor-pointer mt-4"
              >
                SAVE PROFILE CHANGES
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

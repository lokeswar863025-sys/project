import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Utensils, Trash2, ArrowRight, RefreshCw, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUserReservations, cancelReservation, TABLE_STATUS } from '../services/bookingService';
import api from '../services/api';
import FadeUp from '../components/animations/FadeUp';

const RESERVATION_FILTERS = ['Upcoming', 'Past', 'Cancelled'];

export default function ReservationsPage() {
  const { user } = useAuth();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Upcoming');

  const fetchReservations = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const uid = user.uid || user.id;
    try {
      const res = await api.getMyReservations(uid);
      if (res.data) {
        setReservations(res.data);
      }
    } catch (e) {
      const localRes = getUserReservations(uid);
      setReservations(localRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [user]);

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this reservation? This will free up the table.')) {
      try {
        await api.cancelReservation(id, user?.uid || user?.id);
      } catch (e) {
        cancelReservation(id);
      }
      fetchReservations();
    }
  };

  // Filter reservations
  const filteredReservations = reservations.filter((r) => {
    if (activeFilter === 'Upcoming') return r.status === 'CONFIRMED' || r.status === 'HELD';
    if (activeFilter === 'Past') return r.status === 'COMPLETED';
    if (activeFilter === 'Cancelled') return r.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="pt-32 pb-24 bg-[#050505] min-h-screen text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center">
          <span className="text-xs uppercase tracking-widest font-mono font-extrabold text-[#FF4D00]">
            NO-WAIT TABLE PRE-BOOKINGS
          </span>
          <h1 className="mt-2 text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight uppercase">
            MY <span className="text-gradient-orange">RESERVATIONS</span>
          </h1>
          <p className="mt-3 text-base text-[#A1A1A1]">
            Manage your upcoming dining bookings and pre-arrival reservations.
          </p>
        </div>

        {/* FILTER TABS & BOOK BUTTON */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-[#252525]">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {RESERVATION_FILTERS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-5 py-2.5 rounded-full text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilter === tab
                    ? 'bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white shadow-md'
                    : 'bg-[#111111] text-[#A1A1A1] border border-[#252525] hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <Link
            to="/book"
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-mono text-xs font-bold shadow-lg shadow-[#FF4D00]/25 flex items-center gap-2"
          >
            + BOOK A TABLE
          </Link>
        </div>

        {/* RESERVATIONS LIST & EMPTY STATE */}
        <div className="mt-8">
          {loading ? (
            <div className="py-20 text-center text-[#A1A1A1] font-mono text-sm">
              <RefreshCw className="w-8 h-8 text-[#FF4D00] animate-spin mx-auto mb-3" />
              Loading your reservations...
            </div>
          ) : filteredReservations.length === 0 ? (
            /* EMPTY STATE */
            <FadeUp className="p-12 text-center bg-[#111111] rounded-3xl border border-[#252525] space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#050505] border border-[#252525] text-[#252525] flex items-center justify-center mx-auto">
                <Calendar className="w-8 h-8 text-[#FF4D00]" />
              </div>

              <h3 className="text-2xl font-bold text-white font-mono uppercase">NO RESERVATIONS YET</h3>
              <p className="text-sm text-[#A1A1A1] max-w-md mx-auto">
                Book a table and enjoy a no-wait dining experience.
              </p>

              <div className="pt-2">
                <Link
                  to="/book"
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-mono text-xs font-bold shadow-lg shadow-[#FF4D00]/25 inline-flex items-center gap-2"
                >
                  BOOK A TABLE <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </FadeUp>
          ) : (
            <div className="space-y-4">
              {filteredReservations.map((res) => {
                const isCancelled = res.status === TABLE_STATUS.CANCELLED;
                return (
                  <div
                    key={res.id}
                    className={`p-6 sm:p-8 rounded-3xl border transition-all ${
                      isCancelled
                        ? 'bg-[#080808] border-[#1E1E1E] opacity-60'
                        : 'bg-[#111111] border-[#252525] hover:border-[#FF4D00]/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-white font-mono">
                            {res.tableName || res.table_number || res.tableId}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold ${
                              isCancelled
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {res.status}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-mono text-[#A1A1A1]">
                          <span>Party: <strong className="text-white">{res.guestCount || res.guests}</strong></span>
                          <span>•</span>
                          <span>Time: <strong className="text-[#FF7A00]">{res.timeSlot || res.time}</strong></span>
                          <span>•</span>
                          <span>Date: <strong className="text-white">{res.date}</strong></span>
                        </div>

                        <div className="mt-2 text-[11px] font-mono text-[#A1A1A1]/60">
                          Reservation ID: {res.id}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/qr-order?table=${res.tableId || res.table_id || 'T04'}`}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white text-xs font-mono font-bold shadow-md"
                        >
                          PRE-ORDER FOOD
                        </Link>

                        {!isCancelled && (
                          <button
                            onClick={() => handleCancel(res.id)}
                            className="px-3.5 py-2.5 rounded-xl bg-rose-600/10 border border-rose-500/30 text-rose-300 hover:bg-rose-600 hover:text-white text-xs font-mono font-bold transition-colors cursor-pointer"
                          >
                            CANCEL
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

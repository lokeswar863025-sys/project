import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, CheckCircle2, ChevronRight, ArrowLeft, Utensils, AlertTriangle, ShieldCheck, User, Phone, ShoppingBag, QrCode, ArrowRight, Sparkles, Plus, Check, LogOut, Loader2, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  RESTAURANT_TABLES,
  TIME_SLOTS,
  GUEST_OPTIONS,
  TABLE_STATUS,
  isTableAvailable,
  createReservation,
  calculateLeavingTime,
  getLeavingTimeOptions,
  parseTimeToMinutes
} from '../services/bookingService';
import { SAMPLE_MENU } from '../data/sampleMenu';
import { placeOrder } from '../services/orderService';
import api from '../services/api';
import FadeUp from '../components/animations/FadeUp';

export default function BookPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Date helper (Today's date as default min)
  const todayStr = new Date().toISOString().split('T')[0];

  // Wizard state
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[0]);
  const [selectedLeavingTime, setSelectedLeavingTime] = useState(calculateLeavingTime(TIME_SLOTS[0], 2));
  const [selectedGuests, setSelectedGuests] = useState(GUEST_OPTIONS[1]); // Default 2 Guests
  const [selectedTableId, setSelectedTableId] = useState(null);
  
  // Real-Time Table Availability States
  const [realtimeTables, setRealtimeTables] = useState([]);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [hasAnyTableForGuests, setHasAnyTableForGuests] = useState(true);
  const [hasAvailableSlotsForDate, setHasAvailableSlotsForDate] = useState(true);
  const [slotClickNotice, setSlotClickNotice] = useState('');
  const [apiErrorMsg, setApiErrorMsg] = useState('');

  // Customer Contact Info
  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [customerMobile, setCustomerMobile] = useState(user?.mobile || '');
  const [formError, setFormError] = useState('');

  // Confirmation result state
  const [confirmedReservation, setConfirmedReservation] = useState(null);

  // Pre-order food state on confirmation page
  const [preOrderCart, setPreOrderCart] = useState([]);
  const [preOrderSubmitted, setPreOrderSubmitted] = useState(false);

  // Leaving time options generator
  const leavingTimeOpts = getLeavingTimeOptions(selectedTimeSlot, 2);

  // FETCH REAL-TIME TABLE CAPACITY & AVAILABILITY FROM BACKEND API
  const fetchRealTimeAvailability = async () => {
    setIsCheckingAvailability(true);
    setSlotClickNotice('');
    setApiErrorMsg('');

    const numGuests = parseInt(selectedGuests.replace(/[^0-9]/g, ''), 10) || 2;

    try {
      const res = await api.getTableAvailability(selectedDate, selectedTimeSlot, selectedLeavingTime, numGuests, 2);
      if (res.success) {
        setHasAnyTableForGuests(res.hasAnyTableForGuests !== false);
        setHasAvailableSlotsForDate(res.hasAvailableSlotsForDate !== false);

        const newMap = {};
        if (res.slots) {
          res.slots.forEach((s) => {
            newMap[s.time] = s.status;
          });
        }
        setAvailabilityMap(newMap);

        if (res.tables && Array.isArray(res.tables)) {
          setRealtimeTables(res.tables);
        }
      }
    } catch (err) {
      console.warn('Real-time API availability fallback:', err.message);
      // Fallback local availability calculation
      const fallbackMap = {};
      const suitable = RESTAURANT_TABLES.filter((t) => t.capacity >= numGuests);

      if (suitable.length === 0) {
        setHasAnyTableForGuests(false);
      } else {
        setHasAnyTableForGuests(true);
        let availCount = 0;
        TIME_SLOTS.forEach((slot) => {
          const avail = suitable.some((t) => isTableAvailable(t.id, selectedDate, slot, null, selectedGuests));
          fallbackMap[slot] = avail ? 'AVAILABLE' : 'UNAVAILABLE';
          if (avail) availCount++;
        });
        setHasAvailableSlotsForDate(availCount > 0);
      }
      setAvailabilityMap(fallbackMap);
      setRealtimeTables(
        RESTAURANT_TABLES.map((t) => ({
          tableId: t.id,
          tableNumber: t.name,
          capacity: t.capacity,
          reservedSeats: 0,
          availableSeats: t.capacity,
          ownerStatus: 'AVAILABLE',
          ownerAvailable: true,
          isActive: true,
          zone: t.zone,
          status: t.capacity >= numGuests ? 'AVAILABLE' : 'NOT_ENOUGH_SEATS',
          statusMessage: t.capacity >= numGuests ? `${t.capacity} SEATS AVAILABLE` : `ONLY ${t.capacity} SEATS AVAILABLE`,
          canSelect: t.capacity >= numGuests
        }))
      );
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Auto-sync customer details from logged-in user
  useEffect(() => {
    if (user) {
      const name = user.displayName || user.name || '';
      const mob = user.mobile || user.mobileNumber || user.phone || '';
      if (name && !customerName) setCustomerName(name);
      if (mob && !customerMobile) setCustomerMobile(mob);
    }
  }, [user]);

  useEffect(() => {
    fetchRealTimeAvailability();
  }, [selectedDate, selectedTimeSlot, selectedLeavingTime, selectedGuests]);

  useEffect(() => {
    const defaultLeaving = calculateLeavingTime(selectedTimeSlot, 2);
    setSelectedLeavingTime(defaultLeaving);
  }, [selectedTimeSlot]);

  const handleTimeSlotClick = (time) => {
    setSlotClickNotice('');
    const status = availabilityMap[time] || 'AVAILABLE';

    if (status === 'UNAVAILABLE') {
      setSlotClickNotice(`⚠ NO TABLES AVAILABLE FOR ${time}. Please select another time slot.`);
      return;
    }

    setSelectedTimeSlot(time);
    const newLeaving = calculateLeavingTime(time, 2);
    setSelectedLeavingTime(newLeaving);
  };

  const handleNextStep = () => {
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleConfirmBooking = async () => {
    setFormError('');

    if (!selectedTableId) {
      setFormError('Please select an available dining table from Step 4.');
      return;
    }

    const nameToUse = customerName.trim() || user?.displayName || user?.name || 'Customer Diner';
    const mobileToUse = customerMobile.trim() || user?.mobile || user?.mobileNumber || user?.phone || '';
    const userIdToUse = user?.uid || user?.id || (mobileToUse ? `user-${mobileToUse}` : 'guest-user');

    try {
      // Backend API booking call with atomic race-condition & capacity validation
      const res = await api.createReservation({
        tableId: selectedTableId,
        date: selectedDate,
        time: selectedTimeSlot,
        leavingTime: selectedLeavingTime,
        guests: selectedGuests,
        customerName: nameToUse,
        customerMobile: mobileToUse,
        userId: userIdToUse
      }, userIdToUse);

      if (res.data) {
        const confirmedData = {
          id: res.data.id,
          customerName: res.data.customer_name || nameToUse,
          customerMobile: res.data.customer_mobile || mobileToUse,
          tableId: selectedTableId,
          tableName: selectedTableObj ? (selectedTableObj.tableNumber || selectedTableObj.name) : `Table ${selectedTableId}`,
          tableZone: selectedTableObj ? selectedTableObj.zone : 'Main Dining',
          date: selectedDate,
          timeSlot: selectedTimeSlot,
          leavingTime: selectedLeavingTime
        };

        // Sync to client local storage as fallback
        try {
          const stored = JSON.parse(localStorage.getItem('nowait_reservations_v1') || '[]');
          localStorage.setItem('nowait_reservations_v1', JSON.stringify([
            {
              id: res.data.id,
              userId: user?.uid || user?.id || 'guest-user',
              customerName: confirmedData.customerName,
              customerMobile: confirmedData.customerMobile,
              tableId: selectedTableId,
              tableName: confirmedData.tableName,
              date: selectedDate,
              timeSlot: selectedTimeSlot,
              leavingTime: selectedLeavingTime,
              guestCount: selectedGuests,
              status: 'CONFIRMED',
              createdAt: new Date().toISOString()
            },
            ...stored
          ]));
        } catch (e) {}

        setConfirmedReservation(confirmedData);
        setStep(6);
      }
    } catch (err) {
      if (err.status === 409 || err.message?.includes('available seats') || err.message?.includes('already reserved') || err.message?.includes('Double booking')) {
        setFormError(err.message || `SORRY, THE SELECTED TABLE NO LONGER HAS ENOUGH AVAILABLE SEATS. Please choose another table or time.`);
        fetchRealTimeAvailability(); // Refresh real-time availability
      } else {
        setFormError(err.message || 'Unable to confirm reservation. Please verify availability and try again.');
        fetchRealTimeAvailability();
      }
    }
  };

  const handleAddFoodPreOrder = (item) => {
    setPreOrderCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handlePlacePreOrderSubmit = () => {
    if (preOrderCart.length === 0 || !confirmedReservation) return;

    placeOrder({
      tableId: confirmedReservation.tableId,
      reservationId: confirmedReservation.id,
      cartItems: preOrderCart,
      customerName: confirmedReservation.customerName,
      userId: user?.uid || 'guest-user'
    });

    setPreOrderSubmitted(true);
  };

  const selectedTableObj = realtimeTables.find((t) => (t.tableId || t.id) === selectedTableId) ||
    RESTAURANT_TABLES.find((t) => t.id === selectedTableId);
  const isSelectedTimeAvailable = (availabilityMap[selectedTimeSlot] || 'AVAILABLE') === 'AVAILABLE';

  return (
    <div className="pt-32 pb-24 bg-[#050505] min-h-screen text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center">
          <span className="text-xs uppercase tracking-widest font-extrabold text-[#FF4D00]">
            NO-WAIT PRE-ARRIVAL SYSTEM
          </span>
          <h1 className="mt-2 text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight">
            BOOK YOUR <span className="text-gradient-orange">TABLE</span>
          </h1>
          <p className="mt-3 text-base text-[#A1A1A1]">
            Your table will be ready when you arrive. Scan, order, and avoid waiting.
          </p>
        </div>

        {/* Wizard Progress Steps Indicator */}
        {step <= 5 && (
          <div className="mt-10 mb-12">
            <div className="flex items-center justify-between max-w-2xl mx-auto text-xs font-mono text-[#A1A1A1]">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#FF4D00] font-bold' : ''}`}>
                <span className="w-6 h-6 rounded-full bg-[#111111] border border-[#252525] flex items-center justify-center">1</span>
                <span>Date</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#252525]" />
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#FF4D00] font-bold' : ''}`}>
                <span className="w-6 h-6 rounded-full bg-[#111111] border border-[#252525] flex items-center justify-center">2</span>
                <span>Time & Leaving</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#252525]" />
              <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#FF4D00] font-bold' : ''}`}>
                <span className="w-6 h-6 rounded-full bg-[#111111] border border-[#252525] flex items-center justify-center">3</span>
                <span>Guests</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#252525]" />
              <div className={`flex items-center gap-2 ${step >= 4 ? 'text-[#FF4D00] font-bold' : ''}`}>
                <span className="w-6 h-6 rounded-full bg-[#111111] border border-[#252525] flex items-center justify-center">4</span>
                <span>Table</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#252525]" />
              <div className={`flex items-center gap-2 ${step >= 5 ? 'text-[#FF4D00] font-bold' : ''}`}>
                <span className="w-6 h-6 rounded-full bg-[#111111] border border-[#252525] flex items-center justify-center">5</span>
                <span>Confirm</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: DATE SELECTION */}
        {step === 1 && (
          <FadeUp className="bg-[#111111] p-8 rounded-3xl border border-[#252525] shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-[#252525] pb-4">
              <Calendar className="w-6 h-6 text-[#FF4D00]" />
              <h2 className="text-xl font-bold text-white font-mono uppercase">STEP 1 — SELECT DATE</h2>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#A1A1A1] uppercase mb-2">Reservation Date</label>
              <input
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-[#050505] border border-[#252525] rounded-2xl px-5 py-4 text-white text-lg font-mono focus:outline-none focus:border-[#FF4D00]"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNextStep}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-bold text-xs shadow-lg shadow-[#FF4D00]/25 flex items-center gap-2 cursor-pointer"
              >
                SELECT TIME & LEAVING <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </FadeUp>
        )}

        {/* STEP 2: ARRIVAL TIME WITH REAL-TIME COLOR CODED AVAILABILITY */}
        {step === 2 && (
          <FadeUp className="bg-[#111111] p-8 rounded-3xl border border-[#252525] shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#252525] pb-4">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-[#FF4D00]" />
                <h2 className="text-xl font-bold text-white font-mono uppercase">STEP 2 — ARRIVAL & LEAVING TIME</h2>
              </div>

              {/* VISUAL AVAILABILITY LEGEND BAR */}
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  AVAILABLE
                </span>
                <span className="flex items-center gap-1.5 text-[#FF7A00]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D00] shadow-[0_0_8px_#FF4D00]" />
                  SELECTED
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                  UNAVAILABLE
                </span>
              </div>
            </div>

            {/* NO TABLES FOR GUEST COUNT WARNING */}
            {!hasAnyTableForGuests && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <div>
                  <strong className="block text-white">NO TABLES AVAILABLE FOR {selectedGuests.toUpperCase()}</strong>
                  <span>Please reduce party size or choose another booking date.</span>
                </div>
              </div>
            )}

            {/* NO TABLES AVAILABLE FOR DATE WARNING */}
            {hasAnyTableForGuests && !hasAvailableSlotsForDate && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  <div>
                    <strong className="block text-white font-bold">NO TABLES AVAILABLE FOR THIS DATE</strong>
                    <span>All tables are fully booked for {selectedDate}. Please choose another date.</span>
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl bg-[#050505] border border-rose-500/40 text-white text-xs font-bold whitespace-nowrap"
                >
                  CHANGE DATE
                </button>
              </div>
            )}

            {/* CLICKED UNAVAILABLE SLOT ALERT MESSAGE */}
            {slotClickNotice && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{slotClickNotice}</span>
              </div>
            )}

            {/* ARRIVAL TIME SELECTION BUTTONS WITH COLOR CODING */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-mono text-[#A1A1A1] uppercase">1. Select Arrival Time</label>
                {isCheckingAvailability && (
                  <span className="text-[11px] font-mono text-[#FF4D00] flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> CHECKING REAL-TIME AVAILABILITY...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {TIME_SLOTS.map((time) => {
                  const isSelected = selectedTimeSlot === time;
                  const slotStatus = availabilityMap[time] || 'AVAILABLE';
                  const isAvailable = slotStatus === 'AVAILABLE';

                  return (
                    <button
                      key={time}
                      onClick={() => handleTimeSlotClick(time)}
                      className={`py-3.5 px-2 rounded-2xl font-mono text-xs font-bold transition-all relative flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white border-2 border-white shadow-xl shadow-[#FF4D00]/30 scale-105 z-10'
                          : isAvailable
                          ? 'bg-[#050505] text-white border-2 border-emerald-500/40 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10'
                          : 'bg-rose-950/20 text-rose-400 border border-rose-500/30 opacity-60 cursor-not-allowed hover:bg-rose-900/30'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          isSelected ? 'bg-white' : isAvailable ? 'bg-emerald-400' : 'bg-rose-500'
                        }`} />
                        <span>{time}</span>
                      </div>

                      <span className={`text-[9px] font-mono font-extrabold uppercase ${
                        isSelected ? 'text-white/90' : isAvailable ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isSelected ? 'SELECTED' : isAvailable ? 'AVAILABLE' : 'BOOKED'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CUSTOMER LEAVING TIME SELECTION (UP TO 2 HOURS MAX) */}
            <div className="pt-4 border-t border-[#252525]">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-mono text-white uppercase flex items-center gap-1.5 font-bold">
                  <LogOut className="w-4 h-4 text-[#FF7A00]" /> 2. Select Your Leaving Time (Max Limit: 2 Hours)
                </label>
                <span className="text-[11px] font-mono text-[#FF4D00] font-bold">TABLE FREED AT LEAVING TIME</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {leavingTimeOpts.map((opt) => {
                  const isSelected = selectedLeavingTime === opt.time;
                  return (
                    <button
                      key={opt.time}
                      onClick={() => setSelectedLeavingTime(opt.time)}
                      className={`p-3.5 rounded-xl text-left font-mono transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#FF4D00]/20 to-[#FF7A00]/20 border-[#FF4D00] text-white shadow-md'
                          : 'bg-[#050505] border-[#252525] text-[#A1A1A1] hover:text-white hover:border-[#FF4D00]/40'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{opt.time}</div>
                      <div className="text-[10px] text-[#FF7A00] mt-0.5">{opt.label.split('(')[1]?.replace(')', '')}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SELECTION SUMMARY BADGE */}
            <div className="p-4 rounded-2xl bg-[#050505] border border-[#252525] flex items-center justify-between text-xs font-mono">
              <span className="text-[#A1A1A1]">Arrival: <strong className="text-white">{selectedTimeSlot}</strong></span>
              <span className="text-[#FF4D00]">➔</span>
              <span className="text-[#A1A1A1]">Leaving Time: <strong className="text-emerald-400">{selectedLeavingTime}</strong></span>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={handlePrevStep}
                className="px-6 py-3 rounded-full bg-[#050505] border border-[#252525] text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> BACK
              </button>
              <button
                disabled={!isSelectedTimeAvailable || !hasAvailableSlotsForDate}
                onClick={handleNextStep}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-bold text-xs shadow-lg shadow-[#FF4D00]/25 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                SELECT GUESTS <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </FadeUp>
        )}

        {/* STEP 3: GUEST COUNT */}
        {step === 3 && (
          <FadeUp className="bg-[#111111] p-8 rounded-3xl border border-[#252525] shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#252525] pb-4">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-[#FF4D00]" />
                <h2 className="text-xl font-bold text-white font-mono uppercase">STEP 3 — NUMBER OF GUESTS</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {GUEST_OPTIONS.map((guestOpt) => (
                <button
                  key={guestOpt}
                  onClick={() => setSelectedGuests(guestOpt)}
                  className={`py-5 rounded-2xl font-mono text-sm font-bold transition-all cursor-pointer ${
                    selectedGuests === guestOpt
                      ? 'bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white shadow-lg shadow-[#FF4D00]/25'
                      : 'bg-[#050505] text-[#A1A1A1] border border-[#252525] hover:text-white hover:border-[#FF4D00]/40'
                  }`}
                >
                  {guestOpt}
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={handlePrevStep}
                className="px-6 py-3 rounded-full bg-[#050505] border border-[#252525] text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> BACK
              </button>
              <button
                onClick={handleNextStep}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-bold text-xs shadow-lg shadow-[#FF4D00]/25 flex items-center gap-2 cursor-pointer"
              >
                CHOOSE TABLE <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </FadeUp>
        )}

        {/* STEP 4: VISUAL REAL-TIME TABLE SELECTION */}
        {step === 4 && (
          <FadeUp className="bg-[#111111] p-8 rounded-3xl border border-[#252525] shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#252525] pb-4">
              <div className="flex items-center gap-3">
                <Utensils className="w-6 h-6 text-[#FF4D00]" />
                <div>
                  <h2 className="text-xl font-bold text-white font-mono uppercase">STEP 4 — CHOOSE YOUR TABLE</h2>
                  <p className="text-xs font-mono text-[#A1A1A1]">
                    {selectedDate} • {selectedTimeSlot} ➔ {selectedLeavingTime} • {selectedGuests}
                  </p>
                </div>
              </div>

              {isCheckingAvailability && (
                <div className="flex items-center gap-2 text-xs font-mono text-[#FF4D00]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>CHECKING TABLE AVAILABILITY...</span>
                </div>
              )}
            </div>

            {/* Warning if no table has enough seats for this time */}
            {realtimeTables.length > 0 && realtimeTables.filter((t) => t.canSelect).length === 0 && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  <div>
                    <strong className="block text-white font-bold">NO TABLES AVAILABLE FOR THIS TIME</strong>
                    <span>All tables are currently reserved or unavailable for {selectedTimeSlot}. Please choose another time.</span>
                  </div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl bg-[#050505] border border-rose-500/40 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                >
                  CHANGE TIME
                </button>
              </div>
            )}

            {/* Dynamic Real-time Table Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(realtimeTables.length > 0 ? realtimeTables : RESTAURANT_TABLES).map((tableItem) => {
                const tableId = tableItem.tableId || tableItem.id;
                const tableName = tableItem.tableNumber || tableItem.name || `Table ${tableId}`;
                const capacity = tableItem.capacity || 2;
                const reservedSeats = tableItem.reservedSeats !== undefined ? tableItem.reservedSeats : 0;
                const availableSeats = tableItem.availableSeats !== undefined ? tableItem.availableSeats : capacity;
                const ownerStatus = tableItem.ownerStatus || 'AVAILABLE';
                const status = tableItem.status || (availableSeats >= 2 ? 'AVAILABLE' : 'NOT_ENOUGH_SEATS');
                const canSelect = tableItem.canSelect !== undefined ? tableItem.canSelect : (status === 'AVAILABLE' || status === 'PARTIALLY_AVAILABLE');
                const isSelected = selectedTableId === tableId;
                const zone = tableItem.zone || 'Main Dining';

                // Determine border and indicator styles
                let cardStyle = 'bg-[#050505] border-[#252525] hover:border-[#FF4D00]/50';
                let badgeStyle = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
                let badgeText = `${availableSeats} SEATS AVAILABLE`;

                if (isSelected) {
                  cardStyle = 'bg-gradient-to-br from-[#1A0A00] to-[#111111] border-2 border-[#FF4D00] shadow-xl shadow-[#FF4D00]/30 scale-105 z-10';
                  badgeStyle = 'bg-[#FF4D00] text-white';
                  badgeText = 'SELECTED';
                } else if (ownerStatus === 'UNAVAILABLE') {
                  cardStyle = 'bg-[#080808] border-red-950/40 opacity-50 cursor-not-allowed';
                  badgeStyle = 'bg-zinc-800 text-zinc-400 border-zinc-700';
                  badgeText = 'OWNER UNAVAILABLE';
                } else if (availableSeats <= 0) {
                  cardStyle = 'bg-[#080808] border-rose-950/40 opacity-50 cursor-not-allowed';
                  badgeStyle = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
                  badgeText = 'FULL';
                } else if (!canSelect) {
                  cardStyle = 'bg-[#080808] border-amber-950/40 opacity-60 cursor-not-allowed';
                  badgeStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                  badgeText = tableItem.statusMessage || `ONLY ${availableSeats} SEATS AVAILABLE`;
                } else if (status === 'PARTIALLY_AVAILABLE') {
                  cardStyle = 'bg-[#050505] border-amber-500/40 hover:border-amber-400';
                  badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                  badgeText = `${availableSeats} SEATS AVAILABLE`;
                }

                return (
                  <div
                    key={tableId}
                    onClick={() => {
                      if (canSelect) setSelectedTableId(tableId);
                    }}
                    className={`p-5 rounded-2xl border text-left transition-all duration-300 relative flex flex-col justify-between ${cardStyle} ${
                      canSelect ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}
                  >
                    <div>
                      {/* Table Header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-bold font-mono text-white uppercase">{tableName}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeStyle}`}>
                          {badgeText}
                        </span>
                      </div>

                      {/* Capacity & Seating Breakdown */}
                      <div className="text-xs text-[#A1A1A1] font-mono space-y-1.5 my-3">
                        <div className="flex justify-between">
                          <span>Capacity:</span>
                          <strong className="text-white">{capacity} Guests</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Reserved:</span>
                          <strong className={reservedSeats > 0 ? 'text-amber-400' : 'text-white'}>
                            {reservedSeats} Guests
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Available:</span>
                          <strong className={availableSeats > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {availableSeats} Guests
                          </strong>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-[#252525]">
                          <span>Zone:</span>
                          <span className="text-[#FF7A00] font-bold">{zone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button Indicator */}
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={!canSelect}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canSelect) setSelectedTableId(tableId);
                        }}
                        className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#FF4D00] text-white shadow-md'
                            : canSelect
                            ? 'bg-[#111111] hover:bg-[#FF4D00] text-white border border-[#252525]'
                            : 'bg-zinc-900/50 text-zinc-500 border border-zinc-800'
                        }`}
                      >
                        {isSelected
                          ? 'SELECTED'
                          : ownerStatus === 'UNAVAILABLE'
                          ? 'OWNER UNAVAILABLE'
                          : availableSeats <= 0
                          ? 'FULL'
                          : !canSelect
                          ? 'NOT ENOUGH SEATS'
                          : 'SELECT TABLE'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={handlePrevStep}
                className="px-6 py-3 rounded-full bg-[#050505] border border-[#252525] text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> BACK
              </button>
              <button
                disabled={!selectedTableId}
                onClick={handleNextStep}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-bold text-xs shadow-lg shadow-[#FF4D00]/25 flex items-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                ENTER DETAILS <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </FadeUp>
        )}

        {/* STEP 5: CUSTOMER DETAILS & SUMMARY CONFIRMATION */}
        {step === 5 && (
          <FadeUp className="bg-[#111111] p-8 rounded-3xl border border-[#252525] shadow-2xl space-y-6">
            <div className="border-b border-[#252525] pb-4">
              <h2 className="text-xl font-bold text-white font-mono uppercase">STEP 5 — CUSTOMER DETAILS & CONFIRMATION</h2>
              <p className="text-xs text-[#A1A1A1] mt-1">Please review your reservation details and confirm your table booking.</p>
            </div>

            {formError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {/* CUSTOMER CONTACT DETAILS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#A1A1A1] uppercase mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#FF4D00]" /> Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#050505] border border-[#252525] rounded-xl px-4 py-3.5 text-white font-mono text-sm focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A1A1A1] uppercase mb-2 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#FF4D00]" /> Mobile Number (10 Digits)
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full bg-[#050505] border border-[#252525] rounded-xl px-4 py-3.5 text-white font-mono text-sm focus:outline-none focus:border-[#FF4D00]"
                />
              </div>
            </div>

            {/* Reservation Summary Breakdown Card */}
            <div className="p-6 rounded-2xl bg-[#050505] border border-[#252525] space-y-3 font-mono text-xs text-[#A1A1A1]">
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="text-white font-bold">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Arrival Time:</span>
                <span className="text-[#FF7A00] font-bold">{selectedTimeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span>Selected Leaving Time:</span>
                <span className="text-emerald-400 font-bold">{selectedLeavingTime} (Table Free)</span>
              </div>
              <div className="flex justify-between">
                <span>Party Size:</span>
                <span className="text-white font-bold">{selectedGuests}</span>
              </div>
              <div className="flex justify-between">
                <span>Selected Table:</span>
                <span className="text-white font-bold">
                  {selectedTableObj ? (selectedTableObj.tableNumber || selectedTableObj.name) : (selectedTableId ? `Table ${selectedTableId}` : 'None')}{' '}
                  ({selectedTableObj?.zone || 'Main Dining'})
                </span>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={handlePrevStep}
                className="px-6 py-3 rounded-full bg-[#050505] border border-[#252525] text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> BACK
              </button>
              <button
                onClick={handleConfirmBooking}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-bold text-xs shadow-lg shadow-[#FF4D00]/30 cursor-pointer"
              >
                CONFIRM TABLE RESERVATION
              </button>
            </div>
          </FadeUp>
        )}

        {/* STEP 6: CONFIRMATION SUCCESS */}
        {step === 6 && confirmedReservation && (
          <FadeUp className="bg-[#111111] p-8 rounded-3xl border border-emerald-500/40 text-center shadow-2xl space-y-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest font-mono font-extrabold text-emerald-400">
                RESERVATION CONFIRMED
              </span>
              <h2 className="text-3xl font-extrabold text-white font-mono uppercase mt-1">TABLE RESERVED</h2>
            </div>

            {/* Receipt Breakdown Card */}
            <div className="p-6 rounded-2xl bg-[#050505] border border-[#252525] text-left space-y-3 font-mono text-xs max-w-md mx-auto shadow-inner">
              <div className="flex justify-between">
                <span className="text-[#A1A1A1]">Reservation ID:</span>
                <span className="text-[#FF4D00] font-bold">{confirmedReservation.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1A1]">Guest Name:</span>
                <span className="text-white font-bold">{confirmedReservation.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1A1]">Mobile Number:</span>
                <span className="text-white font-bold">{confirmedReservation.customerMobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1A1]">Reserved Table:</span>
                <span className="text-white font-bold">{confirmedReservation.tableName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1A1]">Date & Arrival:</span>
                <span className="text-[#FF7A00] font-bold">{confirmedReservation.date} @ {confirmedReservation.timeSlot}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#252525]">
                <span className="text-[#A1A1A1]">Customer Leaving Time:</span>
                <span className="text-emerald-400 font-bold">{confirmedReservation.leavingTime || selectedLeavingTime} (Table Free)</span>
              </div>
            </div>

            {/* PRE-ORDER FOOD FOR THIS RESERVED TABLE SECTION */}
            <div className="pt-4 border-t border-[#252525] space-y-6 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/30 text-[11px] font-mono font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    EXCLUSIVE PRE-ARRIVAL DINING
                  </div>
                  <h3 className="text-xl font-bold text-white font-mono uppercase">
                    ORDER FOOD FOR {confirmedReservation.tableName.toUpperCase()}
                  </h3>
                  <p className="text-xs text-[#A1A1A1]">
                    Pre-select your signature dishes so they start preparing prior to your arrival.
                  </p>
                </div>

                <Link
                  to={`/qr-order?table=${confirmedReservation.tableId}&reservationId=${confirmedReservation.id}`}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-extrabold text-xs font-mono shadow-xl shadow-[#FF4D00]/30 flex items-center justify-center gap-2 hover:scale-105 transition-transform cursor-pointer whitespace-nowrap"
                >
                  <ShoppingBag className="w-4 h-4" />
                  ORDER FOOD FOR {confirmedReservation.tableName ? confirmedReservation.tableName.toUpperCase() : `TABLE ${confirmedReservation.tableId}`}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* QUICK FOOD SELECTION DISH CARDS */}
              {preOrderSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-lg font-bold text-white font-mono">FOOD PRE-ORDER TRANSMITTED!</h4>
                  <p className="text-xs text-[#A1A1A1]">
                    Your food order for {confirmedReservation.tableName} has been scheduled.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {SAMPLE_MENU.slice(0, 3).map((dish) => {
                      const inCart = preOrderCart.find((i) => i.id === dish.id);
                      return (
                        <div key={dish.id} className="p-4 rounded-2xl bg-[#050505] border border-[#252525] flex flex-col justify-between space-y-3">
                          <div>
                            <img src={dish.image} alt={dish.name} className="w-full h-28 object-cover rounded-xl mb-2" />
                            <h4 className="text-xs font-bold text-white font-mono line-clamp-1">{dish.name}</h4>
                            <span className="text-xs font-black text-[#FF4D00] font-mono">{dish.price}</span>
                          </div>

                          <button
                            onClick={() => handleAddFoodPreOrder(dish)}
                            className={`w-full py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                              inCart
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#111111] hover:bg-[#FF4D00] text-white border border-[#252525]'
                            }`}
                          >
                            {inCart ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> ADDED ({inCart.quantity})
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" /> ADD TO TABLE
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {preOrderCart.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[#050505] border border-[#FF4D00]/40 flex items-center justify-between">
                      <div className="text-xs font-mono">
                        <span className="text-[#A1A1A1]">Selected Items: </span>
                        <strong className="text-white">{preOrderCart.reduce((sum, i) => sum + i.quantity, 0)} Dishes</strong>
                      </div>

                      <button
                        onClick={handlePlacePreOrderSubmit}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white text-xs font-mono font-extrabold shadow-md cursor-pointer"
                      >
                        SUBMIT FOOD ORDER TO {confirmedReservation.tableName.toUpperCase()}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-center gap-4 border-t border-[#252525]">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-full bg-[#050505] border border-[#252525] text-white text-xs font-bold font-mono hover:border-[#FF4D00]/50"
              >
                BOOK ANOTHER TABLE
              </button>
            </div>
          </FadeUp>
        )}

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import SlideIn from './animations/SlideIn';

export default function BookingPreviewSection() {
  const [selectedGuests, setSelectedGuests] = useState('2 Guests');
  const [selectedTime, setSelectedTime] = useState('07:30 PM');
  const [selectedDate, setSelectedDate] = useState('Today');

  return (
    <section className="py-24 bg-[#050505] relative overflow-hidden">
      {/* Background Accent Orb */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#FF4D00]/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column Text Content */}
          <SlideIn direction="left" className="lg:col-span-6">
            <span className="text-xs uppercase tracking-widest font-extrabold text-[#FF4D00]">
              PRE-ARRIVAL RESERVATION
            </span>
            <h2 className="mt-2 text-4xl sm:text-6xl font-extrabold text-white uppercase font-mono tracking-tight leading-tight">
              YOUR TABLE. <br />
              <span className="text-gradient-orange">YOUR TIME.</span>
            </h2>
            <p className="mt-4 text-lg text-[#A1A1A1] leading-relaxed">
              Why wait for a table when you can reserve one before you arrive?
            </p>
            <p className="mt-2 text-sm text-[#A1A1A1]/80 leading-relaxed">
              Select your favorite dining zone, specify seating count, and lock in your time. When you step into NO-WAIT, your personal dining table is ready.
            </p>

            {/* Benefit Bullets */}
            <div className="mt-8 flex flex-col gap-3">
              {[
                'Instant table allocation with zero waiting area queues',
                'Pre-assign dietary preferences and special celebrations',
                'Free instant cancellation up to 30 mins before seating'
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 text-sm text-white font-medium">
                  <CheckCircle2 className="w-5 h-5 text-[#FF4D00] flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-fit">
                <Link
                  to="/book"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-extrabold text-base tracking-wide shadow-xl shadow-[#FF4D00]/30 transition-all duration-300"
                >
                  <Calendar className="w-5 h-5" />
                  BOOK YOUR TABLE
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </div>
          </SlideIn>

          {/* Right Column Interactive Booking Card Preview */}
          <SlideIn direction="right" className="lg:col-span-6">
            <div className="bg-[#111111] p-8 rounded-3xl border border-[#252525] shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-6 border-b border-[#252525]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#FF4D00] animate-ping" />
                  <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                    LIVE TABLE AVAILABILITY
                  </span>
                </div>
                <span className="text-xs font-mono text-[#A1A1A1] bg-[#050505] px-3 py-1 rounded-full border border-[#252525]">
                  VIP & Standard Seating
                </span>
              </div>

              {/* Interactive Quick Pickers */}
              <div className="mt-6 space-y-4">
                
                {/* Date Selector */}
                <div>
                  <label className="text-xs font-mono text-[#A1A1A1] mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#FF4D00]" />
                    SELECT DATE
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Today', 'Tomorrow', 'This Weekend'].map((dateOption) => (
                      <button
                        key={dateOption}
                        onClick={() => setSelectedDate(dateOption)}
                        className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          selectedDate === dateOption
                            ? 'bg-[#FF4D00]/20 border-[#FF4D00] text-white'
                            : 'bg-[#050505] border-[#252525] text-[#A1A1A1] hover:text-white'
                        }`}
                      >
                        {dateOption}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Guest Count */}
                <div>
                  <label className="text-xs font-mono text-[#A1A1A1] mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#FF7A00]" />
                    GUESTS
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['2 Guests', '4 Guests', '6 Guests', '8+ VIP'].map((guestOption) => (
                      <button
                        key={guestOption}
                        onClick={() => setSelectedGuests(guestOption)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          selectedGuests === guestOption
                            ? 'bg-[#FF4D00]/20 border-[#FF4D00] text-white'
                            : 'bg-[#050505] border-[#252525] text-[#A1A1A1] hover:text-white'
                        }`}
                      >
                        {guestOption}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <label className="text-xs font-mono text-[#A1A1A1] mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#FF4D00]" />
                    PREFERRED TIME
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['06:00 PM', '07:30 PM', '09:00 PM'].map((timeOption) => (
                      <button
                        key={timeOption}
                        onClick={() => setSelectedTime(timeOption)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          selectedTime === timeOption
                            ? 'bg-[#FF4D00]/20 border-[#FF4D00] text-white'
                            : 'bg-[#050505] border-[#252525] text-[#A1A1A1] hover:text-white'
                        }`}
                      >
                        {timeOption}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Reservation Status Preview */}
              <div className="mt-8 p-4 rounded-2xl bg-[#050505] border border-[#252525] flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#A1A1A1]">Selected Reservation</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {selectedDate} • {selectedGuests} • {selectedTime}
                  </div>
                </div>
                <Link
                  to="/book"
                  className="px-4 py-2 rounded-xl bg-[#FF4D00] hover:bg-[#FF7A00] text-white font-bold text-xs transition-colors"
                >
                  CONFIRM
                </Link>
              </div>

            </div>
          </SlideIn>

        </div>
      </div>
    </section>
  );
}

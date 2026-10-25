import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, QrCode, ShieldCheck, Database, LayoutDashboard, UserCheck, Sparkles, ArrowRight, CreditCard, ShoppingBag, User, Clock } from 'lucide-react';

export default function AllPhasesHub() {
  const phases = [
    {
      phase: 'PHASE 1 & 2',
      title: 'Design System & Landing',
      desc: 'Dark glassmorphism, Framer Motion animations & responsive UI.',
      link: '/menu',
      badge: 'FRONTEND UI',
      icon: Sparkles,
      color: 'from-amber-500 to-orange-500'
    },
    {
      phase: 'PHASE 3',
      title: 'Google & Mobile Auth',
      desc: 'Customer authentication with Name, Email & Mobile validation.',
      link: '/login',
      badge: 'AUTHENTICATION',
      icon: UserCheck,
      color: 'from-[#FF4D00] to-[#FF7A00]'
    },
    {
      phase: 'PHASE 4',
      title: 'Table Pre-Booking & Leaving Time',
      desc: '5-Step wizard, date/time picker, leaving time selector (2h max) & double-booking prevention.',
      link: '/book',
      badge: 'PRE-ARRIVAL',
      icon: Calendar,
      color: 'from-orange-500 to-rose-500'
    },
    {
      phase: 'PHASE 5 & 11',
      title: 'QR Menu & Dynamic Payment QR',
      desc: 'ADD TO TABLE triggers server-side price security calculation and dynamic UPI payment QR.',
      link: '/qr-order?table=T04',
      badge: 'QR & PAYMENTS',
      icon: QrCode,
      color: 'from-emerald-500 to-teal-500'
    },
    {
      phase: 'PHASE 6 & 11',
      title: 'Admin Dashboard & Payment KDS',
      desc: 'Kitchen order dispatch, payment status (PAID/PENDING), table statuses & menu CRUD.',
      link: '/admin',
      badge: 'ADMIN PORTAL',
      icon: LayoutDashboard,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      phase: 'PHASE 7 & 8',
      title: 'Backend & SQLite DB',
      desc: 'Express REST API, relational database tables (users, orders, payments, reservations).',
      link: 'http://localhost:5000/api/health',
      isExternal: true,
      badge: 'REST API & SQL',
      icon: Database,
      color: 'from-sky-500 to-blue-600'
    },
    {
      phase: 'PHASE 9',
      title: 'Order History & Isolation',
      desc: 'Customer order history, search, filtering & Order Again feature.',
      link: '/orders',
      badge: 'ORDER HISTORY',
      icon: ShoppingBag,
      color: 'from-rose-500 to-pink-600'
    },
    {
      phase: 'PHASE 9',
      title: 'Customer Profile & Dashboard',
      desc: 'User account dashboard, mobile validation & reservation history.',
      link: '/profile',
      badge: 'CUSTOMER PROFILE',
      icon: User,
      color: 'from-teal-500 to-emerald-600'
    },
    {
      phase: 'LEAVING TIME',
      title: 'Table Liberation System',
      desc: 'Customer selects leaving time up to 2h max to make table available for next guest.',
      link: '/book',
      badge: 'TABLE FREED',
      icon: Clock,
      color: 'from-amber-600 to-orange-600'
    }
  ];

  return (
    <section className="py-20 bg-[#0B0B0B] border-y border-[#252525] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF4D00]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111111] border border-[#FF4D00]/40 text-[#FF4D00] text-xs font-mono font-bold">
            <Sparkles className="w-4 h-4" />
            UNIFIED SYSTEM MASTER PORTAL (ALL PHASES COMBINED)
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight">
            ALL PHASES <span className="text-gradient-orange">COMBINED HUB</span>
          </h2>
          <p className="text-base text-[#A1A1A1]">
            Access every module of the NO-WAIT restaurant system from this single unified master link.
          </p>
        </div>

        {/* Phase Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {phases.map((p, idx) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                className="p-6 rounded-3xl bg-[#111111] border border-[#252525] hover:border-[#FF4D00]/50 transition-all flex flex-col justify-between shadow-xl group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-extrabold text-[#FF4D00] tracking-wider">
                      {p.phase}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#050505] text-[#A1A1A1] border border-[#252525] text-[10px] font-mono font-bold">
                      {p.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} text-white flex items-center justify-center shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white font-mono group-hover:text-[#FF7A00] transition-colors">
                      {p.title}
                    </h3>
                  </div>

                  <p className="text-xs text-[#A1A1A1] leading-relaxed mb-6 font-sans">
                    {p.desc}
                  </p>
                </div>

                {p.isExternal ? (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 rounded-2xl bg-[#050505] hover:bg-[#FF4D00] text-white border border-[#252525] hover:border-[#FF4D00] font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    TEST BACKEND API <ArrowRight className="w-4 h-4" />
                  </a>
                ) : (
                  <Link
                    to={p.link}
                    className="w-full py-3 rounded-2xl bg-[#050505] group-hover:bg-[#FF4D00] text-white border border-[#252525] group-hover:border-[#FF4D00] font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    LAUNCH MODULE <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, Smartphone, Sparkles, Zap, ArrowRight } from 'lucide-react';
import ScaleIn from './animations/ScaleIn';
import SlideIn from './animations/SlideIn';

export default function QROrderingSection() {
  return (
    <section className="py-24 bg-[#0B0B0B] relative overflow-hidden border-y border-[#252525]">
      {/* Background Lighting */}
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF7A00]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column Graphic & QR Card */}
          <ScaleIn className="lg:col-span-6 flex justify-center order-2 lg:order-1">
            <div className="relative w-full max-w-md">
              {/* Outer Glowing Box */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#FF4D00]/30 to-[#FF7A00]/10 rounded-3xl blur-2xl transform rotate-3 scale-105 pointer-events-none" />
              
              <div className="relative bg-[#111111] p-8 rounded-3xl border border-[#252525] text-center shadow-2xl overflow-hidden">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#050505] text-[#FF4D00] text-xs font-mono font-bold border border-[#252525] mb-6">
                  <Zap className="w-3.5 h-3.5" />
                  INSTANT TABLE SYNCHRONIZATION
                </div>

                {/* Smartphone + QR Image Mockup */}
                <div className="relative mx-auto w-64 h-64 rounded-2xl overflow-hidden bg-[#050505] border border-[#252525] p-4 flex flex-col items-center justify-center group shadow-inner">
                  <img
                    src="/images/qr_mockup.png"
                    alt="NO-WAIT Table QR Code Scan"
                    className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Overlay QR Scanner Line Effect */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#FF4D00] to-transparent shadow-[0_0_15px_#FF4D00] animate-bounce top-1/3 pointer-events-none" />
                </div>

                {/* Table ID Indicator */}
                <div className="mt-6 flex items-center justify-between px-4 py-3 bg-[#050505] rounded-xl border border-[#252525]">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-[#FF4D00]" />
                    <span className="text-xs font-mono font-bold text-white">TABLE #12 - VIP PATIO</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    ● ACTIVE SESSION
                  </span>
                </div>
              </div>
            </div>
          </ScaleIn>

          {/* Right Column Text Content */}
          <SlideIn direction="right" className="lg:col-span-6 order-1 lg:order-2">
            <span className="text-xs uppercase tracking-widest font-extrabold text-[#FF4D00]">
              AT-TABLE TOUCHLESS DINING
            </span>
            <h2 className="mt-2 text-4xl sm:text-6xl font-extrabold text-white uppercase font-mono tracking-tight leading-tight">
              SCAN. ORDER. <br />
              <span className="text-gradient-orange">DONE.</span>
            </h2>
            
            <p className="mt-4 text-xl font-medium text-white">
              Every table has its own QR code. Scan it, explore the menu and place your order directly from your phone.
            </p>
            
            <p className="mt-3 text-base text-[#A1A1A1] leading-relaxed">
              No signal delay, no waiting for physical menus, no requesting waiters for re-orders. Modify dishes, add extra drinks, or request check split directly with a single tap.
            </p>

            {/* Micro Feature Matrix */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#111111] border border-[#252525]">
                <Smartphone className="w-5 h-5 text-[#FF4D00] mb-2" />
                <h4 className="text-sm font-bold text-white">No App Download</h4>
                <p className="text-xs text-[#A1A1A1] mt-1">Runs straight in mobile browser.</p>
              </div>
              <div className="p-4 rounded-xl bg-[#111111] border border-[#252525]">
                <Sparkles className="w-5 h-5 text-[#FF7A00] mb-2" />
                <h4 className="text-sm font-bold text-white">Live Kitchen Dispatch</h4>
                <p className="text-xs text-[#A1A1A1] mt-1">Orders sync live to chef screens.</p>
              </div>
            </div>

            <div className="mt-10">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-fit">
                <Link
                  to="/qr-order"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#111111] hover:bg-[#1a1a1a] border border-[#252525] hover:border-[#FF4D00]/60 text-white font-extrabold text-base tracking-wide shadow-xl transition-all duration-300"
                >
                  <QrCode className="w-5 h-5 text-[#FF4D00]" />
                  TRY QR ORDERING
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </div>

          </SlideIn>

        </div>
      </div>
    </section>
  );
}

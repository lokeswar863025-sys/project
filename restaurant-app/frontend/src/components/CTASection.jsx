import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Sparkles } from 'lucide-react';
import FadeUp from './animations/FadeUp';

export default function CTASection() {
  return (
    <section className="py-24 bg-[#050505] relative overflow-hidden">
      {/* Glow Center Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF4D00]/20 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <FadeUp>
          <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-b from-[#111111] to-[#0B0B0B] border border-[#252525] shadow-2xl relative overflow-hidden">
            
            {/* Top Decorative Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#050505] border border-[#FF4D00]/40 text-[#FF4D00] text-xs font-mono font-bold mb-6">
              <Sparkles className="w-4 h-4" />
              ELEVATE YOUR DINING HABITS
            </div>

            {/* Heading */}
            <h2 className="text-4xl sm:text-6xl font-black text-white uppercase font-mono tracking-tight leading-tight">
              STOP WAITING. <br />
              <span className="text-gradient-orange">START DINING.</span>
            </h2>

            {/* Subtext */}
            <p className="mt-4 max-w-xl mx-auto text-base sm:text-xl text-[#A1A1A1] leading-relaxed">
              Book your table and experience a faster, seamless, and luxurious way to dine.
            </p>

            {/* CTA Button */}
            <div className="mt-8 flex justify-center">
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: '0 0 35px rgba(255, 77, 0, 0.45)' }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full"
              >
                <Link
                  to="/book"
                  className="px-10 py-5 rounded-full bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-extrabold text-lg tracking-wide flex items-center gap-3 shadow-2xl transition-all duration-300"
                >
                  <Calendar className="w-6 h-6" />
                  BOOK A TABLE
                  <ArrowRight className="w-6 h-6" />
                </Link>
              </motion.div>
            </div>

          </div>
        </FadeUp>
      </div>
    </section>
  );
}

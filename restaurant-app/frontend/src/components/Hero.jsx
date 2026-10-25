import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Utensils, QrCode, ArrowRight, Sparkles } from 'lucide-react';
import FadeUp from './animations/FadeUp';
import FadeIn from './animations/FadeIn';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-28 pb-16 overflow-hidden bg-[#050505]">
      
      {/* Background Animated Gradient / Glow Orbs with Motion Floating */}
      <motion.div
        animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF4D00]/15 rounded-full blur-[140px] pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, 20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[#FF7A00]/10 rounded-full blur-[120px] pointer-events-none"
      />

      {/* Hero Image Background with Subtle Scale Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-30">
        <motion.img
          initial={{ scale: 1.12 }}
          animate={{ scale: 1.0 }}
          transition={{ duration: 7, ease: 'easeOut' }}
          src="/images/hero_bg.png"
          alt="NO-WAIT Restaurant Ambiance"
          className="w-full h-full object-cover object-center filter contrast-125 brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-[#050505]" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        
        {/* Top Tagline Pill */}
        <FadeUp delay={0.1}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#111111]/90 border border-[#FF4D00]/40 backdrop-blur-md mb-6 shadow-lg">
            <Sparkles className="w-4 h-4 text-[#FF4D00]" />
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-white">
              Next-Gen Fine Dining Experience
            </span>
          </div>
        </FadeUp>

        {/* Brand Name Title */}
        <FadeUp delay={0.2}>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-white uppercase font-mono">
            NO<span className="text-[#FF4D00]">-</span>WAIT
          </h1>
        </FadeUp>

        {/* Main Headline */}
        <FadeUp delay={0.3}>
          <h2 className="mt-3 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gradient">
            ARRIVE. ORDER. ENJOY.
          </h2>
        </FadeUp>

        {/* Subtitle */}
        <FadeIn delay={0.4}>
          <p className="mt-4 text-xl sm:text-2xl font-medium text-[#FF7A00]">
            Your table is ready before you arrive.
          </p>
        </FadeIn>

        {/* Supporting Description */}
        <FadeIn delay={0.5}>
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-[#A1A1A1] leading-relaxed">
            Reserve your table before you arrive. Scan. Order. Enjoy your meal without standing in a queue.
          </p>
        </FadeIn>

        {/* Main CTA Buttons */}
        <FadeUp delay={0.6} className="mt-8 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center">
            
            {/* Button 1: BOOK A TABLE */}
            <motion.div
              whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(255, 77, 0, 0.4)' }}
              whileTap={{ scale: 0.96 }}
              className="w-full sm:w-auto rounded-full"
            >
              <Link
                to="/book"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-extrabold text-base tracking-wide flex items-center justify-center gap-3 shadow-xl transition-all duration-300"
              >
                <Calendar className="w-5 h-5" />
                BOOK A TABLE
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            {/* Button 2: VIEW MENU */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="w-full sm:w-auto rounded-full"
            >
              <Link
                to="/menu"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#111111] hover:bg-[#1a1a1a] text-white border border-[#252525] hover:border-[#FF4D00]/50 font-bold text-base tracking-wide flex items-center justify-center gap-3 shadow-lg transition-all duration-300"
              >
                <Utensils className="w-5 h-5 text-[#FF4D00]" />
                VIEW MENU
              </Link>
            </motion.div>
          </div>
        </FadeUp>

        {/* Smaller Secondary Action */}
        <FadeIn delay={0.7} className="mt-6">
          <Link
            to="/qr-order"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#A1A1A1] hover:text-white transition-colors duration-200 group py-1.5 px-4 rounded-xl hover:bg-[#111111]/80 border border-transparent hover:border-[#252525]"
          >
            <QrCode className="w-4 h-4 text-[#FF4D00] group-hover:scale-110 transition-transform" />
            <span>Already at your table?</span>
            <span className="text-[#FF4D00] underline underline-offset-4 font-bold group-hover:text-[#FF7A00]">
              SCAN & ORDER
            </span>
          </Link>
        </FadeIn>

      </div>
    </section>
  );
}

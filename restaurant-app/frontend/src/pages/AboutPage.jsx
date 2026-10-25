import React from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Shield, Flame, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="pt-32 pb-24 bg-[#050505] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center">
          <span className="text-xs uppercase tracking-widest font-extrabold text-[#FF4D00]">
            OUR PHILOSOPHY
          </span>
          <h1 className="mt-2 text-4xl sm:text-6xl font-extrabold text-white font-mono tracking-tight">
            REDEFINING <span className="text-gradient-orange">MODERN DINING</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#A1A1A1] max-w-2xl mx-auto">
            NO-WAIT was born out of a simple belief: Exceptional culinary experiences should never be compromised by unnecessary standing in queues.
          </p>
        </div>

        {/* Brand Core Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#111111] p-8 rounded-3xl border border-[#252525]">
            <Flame className="w-10 h-10 text-[#FF4D00] mb-4" />
            <h3 className="text-xl font-bold text-white font-mono">Culinary Mastery</h3>
            <p className="mt-3 text-xs text-[#A1A1A1] leading-relaxed">
              Every dish is crafted by Michelin-starred culinary talent using ethically sourced local ingredients.
            </p>
          </div>

          <div className="bg-[#111111] p-8 rounded-3xl border border-[#252525]">
            <Award className="w-10 h-10 text-[#FF7A00] mb-4" />
            <h3 className="text-xl font-bold text-white font-mono">Touchless Precision</h3>
            <p className="mt-3 text-xs text-[#A1A1A1] leading-relaxed">
              Proprietary QR & real-time seat reservation algorithms eliminate friction from order placement to bill settling.
            </p>
          </div>

          <div className="bg-[#111111] p-8 rounded-3xl border border-[#252525]">
            <Shield className="w-10 h-10 text-[#FF4D00] mb-4" />
            <h3 className="text-xl font-bold text-white font-mono">Vip Standard</h3>
            <p className="mt-3 text-xs text-[#A1A1A1] leading-relaxed">
              Every customer is treated to a seamless VIP experience without waiting rooms or physical line counters.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

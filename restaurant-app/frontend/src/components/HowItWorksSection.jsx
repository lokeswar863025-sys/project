import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, QrCode, Utensils } from 'lucide-react';
import FadeUp from './animations/FadeUp';

const STEPS = [
  {
    step: 'STEP 01',
    title: 'BOOK',
    subtitle: 'Reserve your table online.',
    icon: Calendar,
    description: 'Select your preferred table, date, and time slot in advance to guarantee zero wait time upon arrival.'
  },
  {
    step: 'STEP 02',
    title: 'ARRIVE',
    subtitle: 'Reach the restaurant at your selected time.',
    icon: MapPin,
    description: 'Walk straight in. Your reserved table is prepped and waiting specifically for you and your guests.'
  },
  {
    step: 'STEP 03',
    title: 'SCAN',
    subtitle: 'Scan the QR code placed on your table.',
    icon: QrCode,
    description: 'Instantly view our interactive digital menu with detailed descriptions, ingredients, and chef recommendations.'
  },
  {
    step: 'STEP 04',
    title: 'ORDER',
    subtitle: 'Choose your food and place your order.',
    icon: Utensils,
    description: 'Submit your culinary selections directly to the kitchen with zero waiter delays and live order status updates.'
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 bg-[#050505] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <FadeUp delay={0.1}>
            <span className="text-xs uppercase tracking-widest font-extrabold text-[#FF7A00]">
              SIMPLE 4-STEP PROCESS
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold text-white uppercase font-mono tracking-tight">
              HOW IT <span className="text-[#FF4D00]">WORKS</span>
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[#A1A1A1]">
              Designed for high efficiency and effortless luxury dining.
            </p>
          </FadeUp>
        </div>

        {/* Steps Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          
          {/* Connector Line on Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#252525] to-transparent -translate-y-6 z-0" />

          {STEPS.map((stepItem, idx) => {
            const StepIcon = stepItem.icon;
            return (
              <FadeUp key={stepItem.step} delay={idx * 0.15}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="relative z-10 bg-[#111111] p-6 rounded-2xl border border-[#252525] hover:border-[#FF4D00]/50 transition-all duration-300 flex flex-col justify-between h-full shadow-lg"
                >
                  <div>
                    {/* Step Badge & Icon */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-full bg-[#050505] text-[#FF4D00] border border-[#252525]">
                        {stepItem.step}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-[#050505] border border-[#252525] flex items-center justify-center text-white">
                        <StepIcon className="w-5 h-5 text-[#FF7A00]" />
                      </div>
                    </div>

                    {/* Title & Subtitle */}
                    <h3 className="text-2xl font-black text-white font-mono tracking-wide">
                      {stepItem.title}
                    </h3>
                    <h4 className="mt-1 text-sm font-semibold text-[#FF4D00]">
                      {stepItem.subtitle}
                    </h4>
                    <p className="mt-3 text-xs text-[#A1A1A1] leading-relaxed">
                      {stepItem.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#252525]/60 flex items-center gap-2 text-[11px] font-mono text-[#A1A1A1]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D00]" />
                    <span>Phase {idx + 1} Ready</span>
                  </div>
                </motion.div>
              </FadeUp>
            );
          })}
        </div>

      </div>
    </section>
  );
}

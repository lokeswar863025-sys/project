import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, QrCode, UtensilsCrossed } from 'lucide-react';
import FadeUp from './animations/FadeUp';

const CARDS = [
  {
    icon: Calendar,
    title: 'Reserve Before You Arrive',
    description: 'Choose your date, time and table before reaching the restaurant.',
    gradient: 'from-[#FF4D00]/20 to-transparent'
  },
  {
    icon: QrCode,
    title: 'Scan & Order',
    description: 'Scan the QR code at your table and order directly from your phone.',
    gradient: 'from-[#FF7A00]/20 to-transparent'
  },
  {
    icon: UtensilsCrossed,
    title: 'Enjoy Without Waiting',
    description: 'Your table and ordering experience are prepared before you sit down.',
    gradient: 'from-[#FF4D00]/20 to-transparent'
  }
];

export default function ExperienceSection() {
  return (
    <section className="py-24 bg-[#0B0B0B] relative overflow-hidden border-y border-[#252525]">
      {/* Background Accent Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#252525_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto">
          <FadeUp delay={0.1}>
            <p className="text-xs uppercase tracking-widest font-extrabold text-[#FF4D00] mb-2">
              THE NO-WAIT EXPERIENCE
            </p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase font-mono">
              NO QUEUES. NO WAITING. <br className="hidden sm:inline" />
              <span className="text-gradient-orange">JUST GOOD FOOD.</span>
            </h2>
          </FadeUp>
        </div>

        {/* 3 Animated Feature Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <FadeUp key={card.title} delay={idx * 0.15}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="relative group p-8 rounded-2xl bg-[#111111] border border-[#252525] hover:border-[#FF4D00]/60 transition-all duration-300 shadow-xl overflow-hidden h-full flex flex-col justify-between"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />

                  <div>
                    {/* Icon Container */}
                    <div className="w-14 h-14 rounded-2xl bg-[#050505] border border-[#252525] flex items-center justify-center text-[#FF4D00] group-hover:scale-110 group-hover:bg-[#FF4D00] group-hover:text-white transition-all duration-300 shadow-inner">
                      <Icon className="w-7 h-7 stroke-[2.2]" />
                    </div>

                    {/* Card Content */}
                    <h3 className="mt-6 text-xl font-bold text-white group-hover:text-[#FF7A00] transition-colors">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-sm text-[#A1A1A1] leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  {/* Bottom Corner Accent Glow */}
                  <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[#FF4D00]/5 rounded-full blur-xl group-hover:bg-[#FF4D00]/20 transition-all duration-300" />
                </motion.div>
              </FadeUp>
            );
          })}
        </div>

      </div>
    </section>
  );
}

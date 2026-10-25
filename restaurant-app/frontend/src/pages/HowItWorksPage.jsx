import React from 'react';
import HowItWorksSection from '../components/HowItWorksSection';
import QROrderingSection from '../components/QROrderingSection';

export default function HowItWorksPage() {
  return (
    <div className="pt-24 bg-[#050505] min-h-screen">
      <div className="py-12 text-center max-w-3xl mx-auto px-4">
        <span className="text-xs uppercase tracking-widest font-extrabold text-[#FF4D00]">
          THE ARCHITECTURE OF ZERO WAITING
        </span>
        <h1 className="mt-2 text-4xl sm:text-6xl font-extrabold text-white font-mono tracking-tight">
          HOW <span className="text-gradient-orange">NO-WAIT WORKS</span>
        </h1>
        <p className="mt-4 text-base text-[#A1A1A1]">
          Learn how our pre-arrival booking and at-table QR technology sync seamlessly with kitchen operations.
        </p>
      </div>

      <HowItWorksSection />
      <QROrderingSection />
    </div>
  );
}

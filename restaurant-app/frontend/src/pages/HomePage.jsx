import React from 'react';
import Hero from '../components/Hero';
import AllPhasesHub from '../components/AllPhasesHub';
import ExperienceSection from '../components/ExperienceSection';
import HowItWorksSection from '../components/HowItWorksSection';
import MenuPreviewSection from '../components/MenuPreviewSection';
import BookingPreviewSection from '../components/BookingPreviewSection';
import QROrderingSection from '../components/QROrderingSection';
import CTASection from '../components/CTASection';

export default function HomePage() {
  return (
    <>
      {/* Section 1: Hero */}
      <Hero />

      {/* Unified All-Phases Portal Hub */}
      <AllPhasesHub />

      {/* Section 2: The NO-WAIT Experience */}
      <ExperienceSection />

      {/* Section 3: How It Works */}
      <HowItWorksSection />

      {/* Section 4: Menu Preview */}
      <MenuPreviewSection />

      {/* Section 5: Table Booking Preview */}
      <BookingPreviewSection />

      {/* Section 6: QR Ordering Section */}
      <QROrderingSection />

      {/* Section 7: Call to Action */}
      <CTASection />
    </>
  );
}

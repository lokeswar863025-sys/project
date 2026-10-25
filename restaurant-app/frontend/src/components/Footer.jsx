import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Phone, Mail, MapPin, Instagram, Facebook, Twitter, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-[#252525] text-[#A1A1A1] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#252525]">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3 w-fit">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4D00] to-[#FF7A00] flex items-center justify-center text-white shadow-lg shadow-[#FF4D00]/25">
                <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-2xl font-extrabold tracking-wider text-white font-mono">
                NO-WAIT
              </span>
            </Link>
            <p className="text-sm font-semibold text-white">
              "Arrive. Order. Enjoy. No Waiting."
            </p>
            <p className="text-xs text-[#A1A1A1] max-w-sm leading-relaxed">
              Eliminating dining wait times with smart pre-arrival reservations and instant touchless table QR ordering technology.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link to="/" className="hover:text-[#FF4D00] transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/menu" className="hover:text-[#FF4D00] transition-colors">Menu</Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-[#FF4D00] transition-colors">Book a Table</Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-[#FF4D00] transition-colors">How It Works</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#FF4D00] transition-colors">About</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white mb-4">
              Contact Us
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#FF4D00] flex-shrink-0" />
                <span>+1 (555) 019-2834</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#FF7A00] flex-shrink-0" />
                <span>concierge@nowait-restaurant.local</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FF4D00] flex-shrink-0 mt-0.5" />
                <span>100 Gourmet Boulevard, Suite 400, Culinary City</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white mb-4">
              Social Media
            </h4>
            <div className="flex items-center gap-3">
              <a
                href="#instagram"
                className="w-9 h-9 rounded-xl bg-[#111111] border border-[#252525] flex items-center justify-center text-white hover:text-[#FF4D00] hover:border-[#FF4D00]/50 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#facebook"
                className="w-9 h-9 rounded-xl bg-[#111111] border border-[#252525] flex items-center justify-center text-white hover:text-[#FF4D00] hover:border-[#FF4D00]/50 transition-all"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#twitter"
                className="w-9 h-9 rounded-xl bg-[#111111] border border-[#252525] flex items-center justify-center text-white hover:text-[#FF4D00] hover:border-[#FF4D00]/50 transition-all"
                aria-label="X (Twitter)"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>

            <div className="mt-6 pt-4 border-t border-[#252525]">
              <Link
                to="/qr-order"
                className="text-xs font-mono font-bold text-[#FF4D00] hover:text-[#FF7A00] flex items-center gap-1"
              >
                Test Table QR Scanner <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Rights */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A1A1A1]/60 gap-4">
          <p>© {new Date().getFullYear()} NO-WAIT RESTAURANT. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Cookie Settings</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

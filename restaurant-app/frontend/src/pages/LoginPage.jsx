import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, ShieldCheck, AlertCircle, Loader2, User, Phone, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { user, loginUser, loading, error, clearError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const from = location.state?.from?.pathname || '/';

  // Form Inputs: Name, Mobile Number (Gmail removed)
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [inputError, setInputError] = useState('');

  // If user is already authenticated, redirect
  React.useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setInputError('');

    if (!customerName.trim()) {
      setInputError('Please enter your Full Name.');
      return;
    }
    const cleanDigits = customerMobile.replace(/[^0-9]/g, '');
    if (!cleanDigits || cleanDigits.length < 10) {
      setInputError('Please enter a valid 10-digit Mobile Number.');
      return;
    }

    const loggedInUser = await loginUser(customerName.trim(), cleanDigits);
    if (loggedInUser) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="pt-32 pb-24 bg-[#050505] min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#111111] p-8 sm:p-10 rounded-3xl border border-[#252525] shadow-2xl text-center"
      >
        
        {/* Brand Logo */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF4D00] to-[#FF7A00] flex items-center justify-center text-white mx-auto shadow-lg shadow-[#FF4D00]/30 mb-6">
          <UtensilsCrossed className="w-7 h-7 stroke-[2.5]" />
        </div>

        {/* Heading: CUSTOMER LOGIN */}
        <h1 className="text-3xl font-extrabold text-white font-mono uppercase tracking-tight">
          CUSTOMER <span className="text-[#FF4D00]">LOGIN</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-sm text-[#A1A1A1] leading-relaxed">
          Enter your full name and mobile number to continue.
        </p>

        {/* Error Alerts */}
        {(error || inputError) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3 text-left font-mono"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{inputError || error}</span>
              <button
                onClick={() => {
                  setInputError('');
                  clearError();
                }}
                className="block mt-1 text-[11px] underline font-bold hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}

        {/* MANDATORY CUSTOMER FORM: NAME & MOBILE NUMBER */}
        <form onSubmit={handleSignInSubmit} className="mt-6 space-y-4 text-left font-mono text-xs">
          <div>
            <label className="block text-[#A1A1A1] mb-2 uppercase flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#FF4D00]" /> Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-[#050505] border border-[#252525] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#FF4D00]"
            />
          </div>

          <div>
            <label className="block text-[#A1A1A1] mb-2 uppercase flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#FF4D00]" /> Mobile Number <span className="text-rose-400">*</span>
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              value={customerMobile}
              onChange={(e) => setCustomerMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
              className="w-full bg-[#050505] border border-[#252525] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#FF4D00]"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#FF4D00]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                LOGGING IN...
              </>
            ) : (
              <>
                CONTINUE TO NO-WAIT <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Security Badge */}
        <div className="mt-8 pt-4 border-t border-[#252525] text-center text-[11px] text-[#A1A1A1]/70 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#FF4D00]" />
          <span>256-Bit Encrypted Customer Verification</span>
        </div>

      </motion.div>
    </div>
  );
}

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, ShieldCheck, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { user, loginUser, loading, error, clearError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const from = location.state?.from?.pathname || '/';

  // If user is already authenticated, redirect
  React.useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSignIn = async () => {
    if (await loginUser()) navigate(from, { replace: true });
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
          Sign in securely with your Google account to book tables and manage orders.
        </p>

        {/* Error Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3 text-left font-mono"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
              <button
                onClick={() => {
                  clearError();
                }}
                className="block mt-1 text-[11px] underline font-bold hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}

        <div className="mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleSignIn}
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
                CONTINUE WITH GOOGLE <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>

        {/* Security Badge */}
        <div className="mt-8 pt-4 border-t border-[#252525] text-center text-[11px] text-[#A1A1A1]/70 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#FF4D00]" />
          <span>Account verified securely through Firebase and Google</span>
        </div>

      </motion.div>
    </div>
  );
}

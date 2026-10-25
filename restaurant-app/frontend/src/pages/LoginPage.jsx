import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, ShieldCheck, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { user, loginUser, registerUser, loading, error, clearError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || '/';
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearError();
    setFormError('');
    if (name.trim().length < 2) {
      setFormError('Please enter your name.');
      return;
    }
    const digits = mobileNumber.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      setFormError('Enter a mobile number with 10 to 15 digits.');
      return;
    }
    const appUser = isRegistering
      ? await registerUser(name, digits)
      : await loginUser(name, digits);
    if (appUser) navigate(from, { replace: true });
  };

  const switchMode = () => {
    setIsRegistering((value) => !value);
    setFormError('');
    clearError();
  };

  return (
    <div className="pt-32 pb-24 bg-[#050505] min-h-screen flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111111] p-8 sm:p-10 rounded-3xl border border-[#252525] shadow-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF4D00] to-[#FF7A00] flex items-center justify-center text-white mx-auto shadow-lg shadow-[#FF4D00]/30 mb-6">
          <UtensilsCrossed className="w-7 h-7 stroke-[2.5]" />
        </div>
        <h1 className="text-3xl font-extrabold text-white font-mono uppercase tracking-tight">
          {isRegistering ? 'CREATE ' : 'CUSTOMER '}<span className="text-[#FF4D00]">{isRegistering ? 'ACCOUNT' : 'LOGIN'}</span>
        </h1>
        <p className="mt-2 text-sm text-[#A1A1A1] leading-relaxed">
          {isRegistering ? 'Create an account with your name and mobile number.' : 'Enter your name and mobile number to continue.'}
        </p>

        {(error || formError) && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3 text-left">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1"><span>{formError || error}</span>
            <button onClick={() => { setFormError(''); clearError(); }} className="block mt-1 text-[11px] underline font-bold">Dismiss</button>
          </div>
        </motion.div>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
          <label className="block text-xs text-[#A1A1A1]">FULL NAME
            <input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full bg-[#050505] border border-[#252525] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#FF4D00]" />
          </label>
          <label className="block text-xs text-[#A1A1A1]">MOBILE NUMBER
            <input required type="tel" inputMode="tel" autoComplete="tel" minLength={10} maxLength={20} value={mobileNumber} onChange={(event) => setMobileNumber(event.target.value)}
              className="mt-2 w-full bg-[#050505] border border-[#252525] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#FF4D00]" />
          </label>
          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#FF4D00]/30 flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />PLEASE WAIT…</> : <>{isRegistering ? 'CREATE ACCOUNT' : 'SIGN IN'} <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <button type="button" onClick={switchMode} className="mt-5 text-xs text-[#FF7A00] hover:text-white underline">
          {isRegistering ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>
        <div className="mt-8 pt-4 border-t border-[#252525] text-center text-[11px] text-[#A1A1A1]/70 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#FF4D00]" />
          <span>Mobile numbers are not verified by SMS in this demo.</span>
        </div>
      </motion.div>
    </div>
  );
}

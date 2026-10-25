import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Utensils, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function OwnerLoginPage() {
  const navigate = useNavigate();
  const { user, loginUser, loading: authLoading, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (user?.role === 'ADMIN') navigate('/admin', { replace: true });
  }, [user, navigate]);

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    const signedInUser = await loginUser();
    if (signedInUser?.role !== 'ADMIN') setError('This account is not the configured restaurant administrator.');
    setLoading(false);
  };

  return (
    <div className="pt-28 pb-20 bg-[#050505] min-h-screen flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#111111] p-8 rounded-3xl border border-[#252525] shadow-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF4D00] to-[#FF7A00] text-white flex items-center justify-center mx-auto mb-4">
          <Utensils className="w-8 h-8" />
        </div>
        <span className="text-xs uppercase font-mono font-extrabold text-[#FF4D00] tracking-wider">NO-WAIT EXECUTIVE PORTAL</span>
        <h1 className="text-3xl font-extrabold text-white mt-2 uppercase">OWNER <span className="text-gradient-orange">LOGIN</span></h1>
        <p className="text-sm text-[#A1A1A1] mt-3">Use the Google account configured by the restaurant administrator.</p>
        {(error || authError) && <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex gap-3 text-left">
          <AlertCircle className="w-5 h-5 shrink-0" /><span>{authError || error}</span>
        </div>}
        <button type="button" onClick={handleSignIn} disabled={loading || authLoading}
          className="w-full mt-7 py-4 rounded-2xl bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          {loading || authLoading ? 'CHECKING ACCOUNT…' : <>SIGN IN WITH GOOGLE <ArrowRight className="w-4 h-4" /></>}
        </button>
        <div className="mt-6 pt-5 border-t border-[#252525] text-xs text-[#A1A1A1] flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Administrator access is checked by the server
        </div>
      </motion.div>
    </div>
  );
}

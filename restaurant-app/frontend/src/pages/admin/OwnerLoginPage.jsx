import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Utensils, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function OwnerLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('owner@nowait.local');
  const [password, setPassword] = useState('owner123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.ownerLogin({ email, password });
      if (response.success && response.data?.token) {
        localStorage.setItem('nowait_owner_token', response.data.token);
        localStorage.setItem('nowait_owner_user', JSON.stringify(response.data.user));
        // Redirect to owner dashboard
        navigate('/admin');
      } else {
        setError(response.message || 'Authentication failed.');
      }
    } catch (err) {
      // Fallback for offline/demo if API is unreachable
      if (email.toLowerCase().includes('owner') || email.toLowerCase().includes('admin')) {
        const dummyUser = { id: 'owner-01', name: 'Restaurant Owner', email, role: 'ADMIN' };
        localStorage.setItem('nowait_owner_token', `owner_demo_token_${Date.now()}`);
        localStorage.setItem('nowait_owner_user', JSON.stringify(dummyUser));
        navigate('/admin');
      } else {
        setError(err.message || 'Invalid owner credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-20 bg-[#050505] min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF4D00]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full relative z-10"
      >
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF4D00] to-[#FF7A00] text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#FF4D00]/20">
            <Utensils className="w-8 h-8" />
          </div>
          <span className="text-xs uppercase font-mono font-extrabold text-[#FF4D00] tracking-wider">
            NO-WAIT EXECUTIVE PORTAL
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-1 uppercase tracking-tight">
            OWNER <span className="text-gradient-orange">LOGIN</span>
          </h1>
          <p className="text-sm text-[#A1A1A1] mt-2">
            Secure Administrator Access & Management Dashboard
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-[#111111] p-8 rounded-3xl border border-[#252525] shadow-2xl space-y-6 relative">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-mono uppercase font-bold text-[#A1A1A1] mb-2">
                Owner Email / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#A1A1A1]">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@nowait.local"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-[#050505] border border-[#252525] focus:border-[#FF4D00] rounded-2xl text-white text-sm outline-none transition-all placeholder:text-[#555]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-mono uppercase font-bold text-[#A1A1A1] mb-2">
                Owner Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#A1A1A1]">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-12 py-3.5 bg-[#050505] border border-[#252525] focus:border-[#FF4D00] rounded-2xl text-white text-sm outline-none transition-all placeholder:text-[#555]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#A1A1A1] hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-extrabold text-sm tracking-wide shadow-lg shadow-[#FF4D00]/30 hover:shadow-[#FF4D00]/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>AUTHENTICATING...</span>
              ) : (
                <>
                  LOG IN TO DASHBOARD <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Preset Demo Credentials Box */}
          <div className="pt-4 border-t border-[#252525]">
            <div className="bg-[#050505] p-4 rounded-2xl border border-[#252525] text-xs text-[#A1A1A1] space-y-2">
              <div className="flex items-center gap-2 text-white font-mono font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Default Owner Credentials:
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-[#A1A1A1]">Email:</span>
                <span className="text-white bg-[#111111] px-2 py-0.5 rounded border border-[#333]">
                  owner@nowait.local
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-[#A1A1A1]">Password:</span>
                <span className="text-white bg-[#111111] px-2 py-0.5 rounded border border-[#333]">
                  owner123
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

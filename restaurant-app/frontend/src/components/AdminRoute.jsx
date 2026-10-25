import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const ownerToken = localStorage.getItem('nowait_owner_token');
  const storedOwnerUserStr = localStorage.getItem('nowait_owner_user');
  
  let storedOwnerUser = null;
  try {
    if (storedOwnerUserStr) storedOwnerUser = JSON.parse(storedOwnerUserStr);
  } catch (e) {}

  const isOwnerAuthenticated = Boolean(ownerToken) || 
    Boolean(storedOwnerUser) || 
    user?.role === 'ADMIN' || 
    user?.email?.toLowerCase().includes('owner') ||
    user?.email?.toLowerCase().includes('admin');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-[#FF4D00] animate-spin mb-4" />
        <p className="text-sm font-mono text-[#A1A1A1]">Verifying Owner Authorization Credentials...</p>
      </div>
    );
  }

  if (!isOwnerAuthenticated) {
    return <Navigate to="/owner/login" state={{ from: location }} replace />;
  }

  return children;
}

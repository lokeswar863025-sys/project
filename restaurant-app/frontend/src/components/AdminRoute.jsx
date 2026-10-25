import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const isOwnerAuthenticated = user?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-[#FF4D00] animate-spin mb-4" />
        <p className="text-sm font-mono text-[#A1A1A1]">Checking administrator access…</p>
      </div>
    );
  }

  if (!isOwnerAuthenticated) {
    return <Navigate to="/owner/login" state={{ from: location }} replace />;
  }

  return children;
}

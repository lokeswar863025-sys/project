import React, { createContext, useContext, useState, useEffect } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Monitor Auth State & load persisted customer session
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('no_wait_customer_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {}

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Auth State listener warning:', error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Customer Name & Mobile Sign-In Handler (Gmail removed from requirements)
  const loginUser = async (param1, param2, param3) => {
    setAuthError(null);
    setLoading(true);

    let displayName = '';
    let email = '';
    let mobile = '';

    if (param3 !== undefined) {
      // Legacy 3-arg call: (customEmail, customName, customMobile)
      email = param1?.trim() || '';
      displayName = param2?.trim() || email.split('@')[0];
      mobile = param3?.trim() || '';
    } else {
      // New 2-arg call: (customName, customMobile)
      displayName = param1?.trim() || 'Valued Diner';
      mobile = param2?.trim() || '';
      const cleanDigits = mobile.replace(/[^0-9]/g, '').slice(-10);
      email = cleanDigits ? `${cleanDigits}@customer.nowait.local` : 'customer@nowait.local';
    }

    const cleanMobile = mobile.replace(/[^0-9]/g, '').slice(-10);
    const userId = cleanMobile ? `user-${cleanMobile}` : `user-${Date.now()}`;

    const customerUser = {
      uid: userId,
      id: userId,
      displayName,
      email: email || (cleanMobile ? `${cleanMobile}@customer.nowait.local` : 'customer@nowait.local'),
      mobile: cleanMobile || '9876543210',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      providerId: 'customer-mobile'
    };

    // Sync customer user with SQLite database
    try {
      const dbRes = await api.authenticateUser({
        id: userId,
        name: displayName,
        mobileNumber: cleanMobile,
        email: customerUser.email,
        role: 'CUSTOMER'
      });
      if (dbRes?.data?.id) {
        customerUser.uid = dbRes.data.id;
        customerUser.id = dbRes.data.id;
        customerUser.displayName = dbRes.data.name || displayName;
        customerUser.email = dbRes.data.email || customerUser.email;
        customerUser.mobile = dbRes.data.mobile_number || customerUser.mobile;
      }
    } catch (e) {
      console.warn('Backend customer sync warning:', e.message);
    }

    try {
      localStorage.setItem('no_wait_customer_user', JSON.stringify(customerUser));
    } catch (e) {}

    setUser(customerUser);
    setLoading(false);
    return customerUser;
  };

  // Backward compatibility alias for loginWithGoogle
  const loginWithGoogle = (email, name, mobile) => loginUser(email, name, mobile);

  // Logout Handler
  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('no_wait_customer_user');
      await signOut(auth);
    } catch (err) {
      console.warn('Sign-Out error:', err);
    } finally {
      setUser(null);
      setLoading(false);
      setAuthError(null);
    }
  };

  const clearError = () => setAuthError(null);

  const value = {
    user,
    loading,
    error: authError,
    loginUser,
    loginWithGoogle,
    logout,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

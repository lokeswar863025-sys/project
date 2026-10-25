import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, firebaseConfigured, googleProvider } from '../config/firebase';
import api from '../services/api';

const AuthContext = createContext(null);
const profileSyncs = new Map();
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

const mapUser = (profile) => ({
  uid: profile.id,
  id: profile.id,
  displayName: profile.name,
  email: profile.email,
  mobile: profile.mobile_number || '',
  photoURL: profile.photo || '',
  role: profile.role
});

function syncFirebaseUser(firebaseUser) {
  if (!profileSyncs.has(firebaseUser.uid)) {
    const sync = api.authenticateUser().then((response) => mapUser(response.data))
      .finally(() => profileSyncs.delete(firebaseUser.uid));
    profileSyncs.set(firebaseUser.uid, sync);
  }
  return profileSyncs.get(firebaseUser.uid);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setUser(await syncFirebaseUser(firebaseUser));
      setAuthError(null);
    } catch (error) {
      setUser(null);
      setAuthError(error.message || 'Could not verify your account.');
      await signOut(auth);
    } finally {
      setLoading(false);
    }
  }, (error) => {
    setAuthError(error.message || 'Sign-in could not be checked.');
    setLoading(false);
  }), []);

  const loginUser = async () => {
    setAuthError(null);
    if (!firebaseConfigured) {
      setAuthError('Firebase is not configured yet. Replace the placeholder values in frontend/.env with your Firebase web app settings, then restart the app.');
      return null;
    }
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('Google sign-in did not return an account.');
      const appUser = await syncFirebaseUser(firebaseUser);
      setUser(appUser);
      setLoading(false);
      return appUser;
    } catch (error) {
      setAuthError(error.message || 'Google sign-in failed.');
      setLoading(false);
      return null;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setAuthError(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error: authError, loginUser, loginWithGoogle: loginUser, logout, clearError: () => setAuthError(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

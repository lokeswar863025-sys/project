import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { AUTH_TOKEN_KEY } from '../services/api';

const AuthContext = createContext(null);
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    localStorage.removeItem('no_wait_customer_user');
    localStorage.removeItem('nowait_owner_token');
    localStorage.removeItem('nowait_owner_user');
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return undefined;
    }
    let active = true;
    api.authenticateUser().then((response) => {
      if (active) setUser(mapUser(response.data));
    }).catch((error) => {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      if (active) {
        setUser(null);
        setAuthError(error.message || 'Your session expired. Please sign in again.');
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const loginUser = async (name, mobileNumber) => {
    setAuthError(null);
    setLoading(true);
    try {
      const response = await api.login({ name, mobileNumber });
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      const appUser = mapUser(response.data.user);
      setUser(appUser);
      setLoading(false);
      return appUser;
    } catch (error) {
      setAuthError(error.message || 'Sign-in failed. Check your name and mobile number.');
      setLoading(false);
      return null;
    }
  };

  const registerUser = async (name, mobileNumber) => {
    setAuthError(null);
    setLoading(true);
    try {
      const response = await api.register({ name, mobileNumber });
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      const appUser = mapUser(response.data.user);
      setUser(appUser);
      return appUser;
    } catch (error) {
      setAuthError(error.message || 'Account registration failed.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loginAdmin = async (email, password) => {
    setAuthError(null);
    setLoading(true);
    try {
      const response = await api.adminLogin({ email, password });
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      const appUser = mapUser(response.data.user);
      setUser(appUser);
      return appUser;
    } catch (error) {
      setAuthError(error.message || 'Administrator sign-in failed.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (profile) => {
    const response = await api.updateProfile(profile, user?.id);
    const appUser = mapUser(response.data);
    setUser(appUser);
    return appUser;
  };

  const logout = async () => {
    setLoading(true);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setAuthError(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error: authError, loginUser, loginAdmin, registerUser, updateUserProfile, logout, clearError: () => setAuthError(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

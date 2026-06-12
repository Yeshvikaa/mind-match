import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'https://mind-match-s0na.onrender.com/api';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('mm_token'));
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const authHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  // Load profile on mount if token exists
  useEffect(() => {
    const init = async () => {
      if (token) {
        try {
          const { data } = await axios.get(`${API_BASE}/auth/profile`, authHeaders());
          if (data.success) setUser(data.user);
        } catch {
          localStorage.removeItem('mm_token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    init();
  }, [token, authHeaders]);

  const register = async (username, email, password) => {
    const { data } = await axios.post(`${API_BASE}/auth/register`, { username, email, password });
    if (data.success) {
      localStorage.setItem('mm_token', data.token);
      setToken(data.token);
      setUser(data.user);
      addToast(`Welcome, ${data.user.username}! 🧠`, 'success');
    }
    return data;
  };

  const login = async (email, password) => {
    const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
    if (data.success) {
      localStorage.setItem('mm_token', data.token);
      setToken(data.token);
      setUser(data.user);
      addToast(`Welcome back, ${data.user.username}! ⚡`, 'success');
    }
    return data;
  };

  const guestLogin = async () => {
    const { data } = await axios.post(`${API_BASE}/auth/guest`);
    if (data.success) {
      localStorage.setItem('mm_token', data.token);
      setToken(data.token);
      setUser(data.user);
      addToast(`Playing as ${data.user.username} 🎮`, 'info');
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('mm_token');
    setToken(null);
    setUser(null);
    addToast('Logged out. See you soon! 👋', 'info');
  };

  const updateProfile = async (updates) => {
    const { data } = await axios.put(`${API_BASE}/auth/profile`, updates, authHeaders());
    if (data.success) {
      setUser(data.user);
      addToast('Profile updated! ✨', 'success');
    }
    return data;
  };

  const value = {
    user, token, loading,
    register, login, guestLogin, logout, updateProfile,
    authHeaders, addToast,
    toasts, removeToast,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

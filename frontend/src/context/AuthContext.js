import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('bp-user');
    const token = localStorage.getItem('bp-token');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.clear(); }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await authAPI.login(username, password);
    localStorage.setItem('bp-token', data.token);
    localStorage.setItem('bp-user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (fullName, username, email, password) => {
    const data = await authAPI.register(fullName, username, email, password);
    localStorage.setItem('bp-token', data.token);
    localStorage.setItem('bp-user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('bp-token');
    localStorage.removeItem('bp-user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

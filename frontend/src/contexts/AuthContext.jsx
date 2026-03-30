"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Optimistic Auth: Check localStorage immediately
    const cachedUser = localStorage.getItem("task2track_user");
    const token = localStorage.getItem("task2track_token");
    
    if (cachedUser && token) {
      try {
        setUser(JSON.parse(cachedUser));
        setLoading(false); // We have enough for an initial render
      } catch (e) {
        localStorage.removeItem("task2track_user");
      }
    }
    
    checkAuth();
  }, []);


  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem("task2track_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await api.get("/auth/me");
      const newUser = res.data.user;
      setUser(prev => {
        if (JSON.stringify(prev) === JSON.stringify(newUser)) return prev;
        return newUser;
      });
      localStorage.setItem("task2track_user", JSON.stringify(newUser));
    } catch (error) {
      // Only logout if it's a real 401/auth error, not a network hiccup
      if (error.response?.status === 401) {
        localStorage.removeItem("task2track_token");
        localStorage.removeItem("task2track_user");
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("task2track_token", res.data.token);
    localStorage.setItem("task2track_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const signup = useCallback(async (name, email, password, department) => {
    const res = await api.post("/auth/signup", { name, email, password, department });
    localStorage.setItem("task2track_token", res.data.token);
    localStorage.setItem("task2track_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("task2track_user", JSON.stringify(updatedUser));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      const newUser = res.data.user;
      setUser(prev => {
        if (JSON.stringify(prev) === JSON.stringify(newUser)) return prev;
        return newUser;
      });
      localStorage.setItem("task2track_user", JSON.stringify(newUser));
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("task2track_token");
    localStorage.removeItem("task2track_user");
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    signup,
    logout,
    updateUser,
    refreshUser
  }), [user, loading, login, signup, logout, updateUser, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

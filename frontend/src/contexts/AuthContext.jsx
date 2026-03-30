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
      setUser(res.data.user);
    } catch (error) {
      localStorage.removeItem("task2track_token");
      localStorage.removeItem("task2track_user");
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
      setUser(res.data.user);
      localStorage.setItem("task2track_user", JSON.stringify(res.data.user));
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

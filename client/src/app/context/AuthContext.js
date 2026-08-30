"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginUser, registerUser, getMe } from "@/lib/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "flowforge_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (activeToken) => {
    if (!activeToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await getMe();
      setUser(data.user);
    } catch (error) {
      console.error("Failed to load user:", error.message);
      // Don't clear token on error, just set loading to false
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load token from localStorage on client mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    setToken(storedToken);
    loadUser(storedToken);
  }, []);

  // Listen for storage changes (e.g., from OAuth popup)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === TOKEN_KEY && event.newValue) {
        console.log("Token updated from storage event");
        setToken(event.newValue);
        loadUser(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadUser]);

  const applySession = (newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const login = async (credentials) => {
    const { data } = await loginUser(credentials);
    applySession(data.token, data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await registerUser(payload);
    applySession(data.token, data.user);
    return data.user;
  };

  // Used by GoogleCallback.jsx once the backend hands back a token.
  const setSessionFromToken = async (newToken) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    await loadUser(newToken);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, setSessionFromToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
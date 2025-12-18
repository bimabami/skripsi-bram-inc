"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { axiosInstance } from "@/lib/axios";

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl?: string;
  role?: "MANAGER" | "STAFF";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Decode JWT token to get user info
  const decodeToken = (token: string): User | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      return {
        id: decoded.id || decoded.userId || decoded.sub,
        email: decoded.email,
        name: decoded.name || decoded.username,
        username: decoded.username,
        avatarUrl: decoded.avatarUrl,
        role: decoded.role || "STAFF",
      };
    } catch {
      return null;
    }
  };

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        setUser(decoded);
        // Set axios default header
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        // Invalid token, clear it
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((token: string) => {
    localStorage.setItem("token", token);
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const decoded = decodeToken(token);
    if (decoded) {
      setUser(decoded);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    delete axiosInstance.defaults.headers.common['Authorization'];
    setUser(null);
    window.location.href = "/login";
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

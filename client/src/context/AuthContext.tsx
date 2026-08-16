import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchWithAuth } from "../services/apiClient";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  company?: string;
  role: "user" | "admin" | "USER" | "ADMIN";
  emailVerified: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  signup: (name: string, email: string, password: string, company?: string) => Promise<{ email: string }>;
  verifyEmail: (email: string, otp: string) => Promise<UserProfile>;
  resendOtp: (email: string, type?: "EMAIL_VERIFICATION" | "PASSWORD_RESET") => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.success && data.data?.user) {
        setUser(data.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    const res = await fetchWithAuth("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      if (data.emailVerified === false) {
        const errorObj: any = new Error(data.error?.message || "Please verify your email before logging in.");
        errorObj.emailVerified = false;
        errorObj.email = data.email || email;
        throw errorObj;
      }
      throw new Error(data.error?.message || "Invalid credentials.");
    }

    const authenticatedUser = data.user || data.data?.user;
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const signup = async (name: string, email: string, password: string, company?: string) => {
    const res = await fetchWithAuth("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password, company }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Signup failed.");
    }

    return { email: data.email || email };
  };

  const verifyEmail = async (email: string, otp: string): Promise<UserProfile> => {
    const res = await fetchWithAuth("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Verification failed.");
    }

    setUser(data.user);
    return data.user;
  };

  const resendOtp = async (email: string, type = "EMAIL_VERIFICATION") => {
    const res = await fetchWithAuth("/api/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email, type }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Failed to resend code.");
    }
  };

  const logout = async () => {
    try {
      await fetchWithAuth("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  };

  const logoutAll = async () => {
    try {
      await fetchWithAuth("/api/auth/logout-all", { method: "POST" });
    } catch (err) {
      console.error("Logout-all failed", err);
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        signup,
        verifyEmail,
        resendOtp,
        logout,
        logoutAll,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

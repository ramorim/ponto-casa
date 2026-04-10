"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { registerDevice } from "@/services/devices";

interface User {
  id: string;
  email: string | null;
}

interface Profile {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
  role: "employer" | "employee" | null;
  employer_id: string | null;
  is_active: boolean;
  onboarding_completed: boolean;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sendOtp: (
    phoneOrEmail: string,
    type: "whatsapp" | "email"
  ) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (
    phoneOrEmail: string,
    code: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Register device on first authentication
  useEffect(() => {
    if (user) {
      registerDevice().catch(console.error);
    }
  }, [user]);

  const sendOtp = useCallback(
    async (phoneOrEmail: string, type: "whatsapp" | "email") => {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneOrEmail, type }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return { success: true };
    },
    []
  );

  const verifyOtp = useCallback(
    async (phoneOrEmail: string, code: string) => {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneOrEmail, code }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return { success: true };
    },
    []
  );

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        sendOtp,
        verifyOtp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

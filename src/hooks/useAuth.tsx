"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { registerDevice } from "@/services/devices";

interface Profile {
  id: string;
  name: string;
  phone: string;
  role: "employer" | "employee" | null;
  employer_id: string | null;
  is_active: boolean;
  onboarding_completed: boolean;
}

interface AuthContext {
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

const AuthContext = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      setProfile(data as Profile | null);
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          registerDevice().catch(console.error);
        }
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    // Initial session check
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      if (u) fetchProfile(u.id);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

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

      // Use the token_hash to verify and establish session
      const { error } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink",
      });

      if (error) return { success: false, error: error.message };
      return { success: true };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

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

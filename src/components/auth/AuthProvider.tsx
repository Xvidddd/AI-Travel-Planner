"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/providers/supabase";

interface AuthContextValue {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value: AuthContextValue = {
    supabase,
    session,
    user: session?.user ?? null,
    loading,
    signOut: async () => {
      const clearLocalSession = async () => {
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch (error) {
          console.warn("local signOut failed", error);
        }
        if (typeof window !== "undefined") {
          Object.keys(localStorage)
            .filter((key) => key.includes("supabase.auth.token") || key.includes("sb-"))
            .forEach((key) => localStorage.removeItem(key));
        }
        setSession(null);
      };

      try {
        await supabase.auth.signOut({ scope: "global" });
      } catch (error) {
        if (error instanceof TypeError) {
          console.warn("supabase global signOut network error, clearing local session only");
          await clearLocalSession();
          return;
        }
        throw error;
      }

      await clearLocalSession();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

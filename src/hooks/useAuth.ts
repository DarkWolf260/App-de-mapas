import { useState, useEffect } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { DEFAULT_OPERATOR_PERMISSIONS, UserPermissions } from "../services/adminUsersService";

export type UserRole = "admin" | "operador" | null;

interface UserProfile {
  role: string;
  is_suspended: boolean;
  permissions: Partial<UserPermissions>;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    let mounted = true;
    const loadProfile = async () => {
      try {
        const { data } = await supabase
          .from("user_profiles")
          .select("role, is_suspended, permissions")
          .eq("id", user.id)
          .maybeSingle();
        if (mounted) setProfile(data ?? null);
      } catch {
        if (mounted) setProfile(null);
      }
    };
    loadProfile();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const jwtRole: UserRole = user
    ? (user.user_metadata?.role === "admin" || user.app_metadata?.role === "admin" ? "admin" : "operador")
    : null;

  const role: UserRole = profile
    ? (profile.role === "admin" ? "admin" : "operador")
    : jwtRole;

  const isAdmin = role === "admin";
  const isOperador = role === "operador";
  const isAuthenticated = !!user;
  const isSuspended = profile?.is_suspended ?? false;

  const permissions: UserPermissions = isSuspended
    ? { ...DEFAULT_OPERATOR_PERMISSIONS, edit_logs: false, manage_campamentos: false }
    : isAdmin
    ? { edit_logs: true, edit_historical_logs: true, edit_map: true, manage_campamentos: true }
    : { ...DEFAULT_OPERATOR_PERMISSIONS, ...(profile?.permissions ?? {}) };

  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Logout error:", error);
  };

  return { user, session, profile, role, isAdmin, isOperador, isAuthenticated, isSuspended, permissions, loading, login, logout };
}

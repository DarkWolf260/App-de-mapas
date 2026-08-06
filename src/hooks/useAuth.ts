import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { DEFAULT_OPERATOR_PERMISSIONS, UserPermissions } from "../services/adminUsersService";

export type UserRole = "admin" | "operador" | null;

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "operador";
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
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("role, is_suspended, permissions")
        .eq("id", userId)
        .single();

      if (error) {
        console.warn("No profile found or error fetching profile:", error.message);
        setProfile(null);
      } else {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const role: UserRole = profile
    ? (profile.role === "admin" ? "admin" : "operador")
    : null;

  const isAdmin = role === "admin";
  const isOperador = role === "operador";
  const isAuthenticated = !!user;
  const isSuspended = profile?.is_suspended ?? false;

  const permissions: UserPermissions = isSuspended
    ? { ...DEFAULT_OPERATOR_PERMISSIONS, edit_logs: false, manage_campamentos: false, manage_camp_entries: false }
    : isAdmin
    ? { edit_logs: true, edit_historical_logs: true, edit_map: true, manage_campamentos: true, manage_camp_entries: true }
    : { ...DEFAULT_OPERATOR_PERMISSIONS, ...(profile?.permissions ?? {}) };

  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;

    if (data.user) {
      const { data: prof } = await supabase
        .from("user_profiles")
        .select("is_suspended")
        .eq("id", data.user.id)
        .maybeSingle();

      if (prof?.is_suspended) {
        await supabase.auth.signOut();
        throw new Error(
          "Tu cuenta está registrada pero se encuentra pendiente de activación por un Administrador. Solicita la activación para poder ingresar."
        );
      }
    }

    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Logout error:", error);
  };

  return { user, session, profile, role, isAdmin, isOperador, isAuthenticated, isSuspended, permissions, loading, login, logout };
}

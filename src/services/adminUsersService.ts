import { supabase } from "../lib/supabaseClient";

export interface UserPermissions {
  edit_logs: boolean;
  edit_historical_logs: boolean;
  edit_map: boolean;
  manage_campamentos: boolean;
}

export const DEFAULT_OPERATOR_PERMISSIONS: UserPermissions = {
  edit_logs: true,
  edit_historical_logs: false,
  edit_map: false,
  manage_campamentos: true,
};

export interface ManagedUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "operador";
  is_suspended: boolean;
  permissions: UserPermissions;
  created_at: string;
}

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`;

async function callAdminFunction(payload: unknown): Promise<any> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? "";
  const res = await fetch(FUNCTIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error || `Error de servidor (${res.status})`);
  }
  return body;
}

export async function fetchManagedUsers(): Promise<ManagedUser[]> {
  const body = await callAdminFunction({ action: "list" });
  const users = body?.users ?? [];
  return (users as any[]).map((p) => ({
    id: p.id,
    email: p.email ?? "",
    full_name: p.full_name ?? "",
    role: p.role === "admin" ? "admin" : "operador",
    is_suspended: !!p.is_suspended,
    permissions: {
      ...DEFAULT_OPERATOR_PERMISSIONS,
      ...(p.permissions || {}),
    } as UserPermissions,
    created_at: p.created_at ?? new Date().toISOString(),
  }));
}

export async function updateUserRole(id: string, role: "admin" | "operador"): Promise<void> {
  await callAdminFunction({ action: "set_role", userId: id, role });
}

export async function updateUserPermissions(id: string, permissions: UserPermissions): Promise<void> {
  await callAdminFunction({ action: "set_permissions", userId: id, permissions });
}

export async function suspendUser(id: string): Promise<void> {
  await callAdminFunction({ action: "suspend", userId: id });
}

export async function unsuspendUser(id: string): Promise<void> {
  await callAdminFunction({ action: "unsuspend", userId: id });
}

export async function deleteUser(id: string): Promise<void> {
  await callAdminFunction({ action: "delete", userId: id });
}

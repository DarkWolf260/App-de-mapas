import { supabase } from "../lib/supabaseClient";

export interface UserRegistrationRequest {
  id: string;
  fullName: string;
  email: string;
  organismo: string;
  status: "Pendiente" | "Aprobado" | "Rechazado";
  requestedRole: "operador" | "admin";
  assignedRole?: "operador" | "admin";
  created_at: string;
}

const LOCAL_STORAGE_KEY = "coe_user_requests";

function getLocalRequests(): UserRegistrationRequest[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalRequests(reqs: UserRegistrationRequest[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reqs));
  } catch (err) {
    console.error("Error saving local requests:", err);
  }
}

// Initial demo requests if local storage is empty
const INITIAL_DEMO_REQUESTS: UserRegistrationRequest[] = [
  {
    id: "req-1",
    fullName: "Carlos Mendoza",
    email: "carlos.mendoza@coelaguaira.gob.ve",
    organismo: "Protección Civil Caruao",
    status: "Pendiente",
    requestedRole: "operador",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "req-2",
    fullName: "Dra. Elena Rivas",
    email: "elena.rivas@coelaguaira.gob.ve",
    organismo: "Bomberos La Guaira",
    status: "Pendiente",
    requestedRole: "admin",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

export async function fetchUserRequests(): Promise<UserRegistrationRequest[]> {
  try {
    const { data, error } = await supabase.from("user_requests").select("*");
    if (!error && data && data.length > 0) {
      return data.map((r: any) => ({
        id: String(r.id),
        fullName: r.full_name || r.fullName || "Usuario",
        email: r.email,
        organismo: r.organismo || "Protección Civil",
        status: r.status || "Pendiente",
        requestedRole: r.requested_role || "operador",
        assignedRole: r.assigned_role || undefined,
        created_at: r.created_at || new Date().toISOString(),
      }));
    }
  } catch (err) {
    console.warn("Supabase user_requests fallback to local storage:", err);
  }

  // Fallback to localStorage
  let local = getLocalRequests();
  if (local.length === 0) {
    local = INITIAL_DEMO_REQUESTS;
    saveLocalRequests(local);
  }
  return local;
}

export async function createRegistrationRequest(data: {
  fullName: string;
  email: string;
}): Promise<void> {
  const newReq: UserRegistrationRequest = {
    id: crypto.randomUUID(),
    fullName: data.fullName.trim(),
    email: data.email.trim().toLowerCase(),
    organismo: "Por Asignar",
    status: "Pendiente",
    requestedRole: "operador",
    created_at: new Date().toISOString(),
  };

  try {
    await supabase.from("user_requests").insert({
      id: newReq.id,
      full_name: newReq.fullName,
      email: newReq.email,
      organismo: newReq.organismo,
      status: newReq.status,
      requested_role: newReq.requestedRole,
      created_at: newReq.created_at,
    });
  } catch (err) {
    console.warn("Supabase insert user_request failed, using local storage:", err);
  }

  const local = getLocalRequests();
  saveLocalRequests([newReq, ...local]);
}

export async function approveUserRequest(
  requestId: string,
  assignedRole: "operador" | "admin",
  assignedOrganismo?: string
): Promise<void> {
  const org = assignedOrganismo?.trim() || "Protección Civil La Guaira";
  try {
    await supabase
      .from("user_requests")
      .update({ status: "Aprobado", assigned_role: assignedRole, organismo: org })
      .eq("id", requestId);
  } catch (err) {
    console.warn("Supabase approve failed, updating local storage:", err);
  }

  const local = getLocalRequests();
  const updated = local.map((r) =>
    r.id === requestId ? { ...r, status: "Aprobado" as const, assignedRole, organismo: org } : r
  );
  saveLocalRequests(updated);
}

export async function rejectUserRequest(requestId: string): Promise<void> {
  try {
    await supabase
      .from("user_requests")
      .update({ status: "Rechazado" })
      .eq("id", requestId);
  } catch (err) {
    console.warn("Supabase reject failed, updating local storage:", err);
  }

  const local = getLocalRequests();
  const updated = local.map((r) =>
    r.id === requestId ? { ...r, status: "Rechazado" as const } : r
  );
  saveLocalRequests(updated);
}

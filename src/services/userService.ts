import { supabase } from "../lib/supabaseClient";

export interface UserRegistrationRequest {
  id: string;
  fullName: string;
  email: string;
  status: "Pendiente" | "Aprobado" | "Rechazado";
  requestedRole: "operador" | "admin";
  assignedRole?: "operador" | "admin";
  created_at: string;
}

export async function fetchUserRequests(): Promise<UserRegistrationRequest[]> {
  const { data, error } = await supabase
    .from("user_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Error al cargar solicitudes: ${error.message}`);

  return (data ?? []).map((r: any) => ({
    id: String(r.id),
    fullName: r.full_name || r.fullName || "Usuario",
    email: r.email,
    status: r.status || "Pendiente",
    requestedRole: r.requested_role || "operador",
    assignedRole: r.assigned_role || undefined,
    created_at: r.created_at || new Date().toISOString(),
  }));
}

export async function createRegistrationRequest(data: {
  fullName: string;
  email: string;
}): Promise<void> {
  const { error } = await supabase.from("user_requests").insert({
    id: crypto.randomUUID(),
    full_name: data.fullName.trim(),
    email: data.email.trim().toLowerCase(),
    status: "Pendiente",
    requested_role: "operador",
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(`Error al enviar solicitud: ${error.message}`);
}


export async function approveUserRequest(
  requestId: string,
  assignedRole: "operador" | "admin"
): Promise<void> {
  // 1. Obtener la solicitud para conocer el email del solicitante
  const { data: request, error: reqErr } = await supabase
    .from("user_requests")
    .select("email")
    .eq("id", requestId)
    .maybeSingle();

  if (reqErr) throw new Error(`Error al obtener la solicitud: ${reqErr.message}`);

  // 2. Activar el perfil del usuario: buscar por email y actualizar el rol
  if (request?.email) {
    const { data: profile, error: profileErr } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("email", request.email)
      .maybeSingle();

    if (profileErr) {
      console.warn("No se pudo buscar el perfil del usuario:", profileErr.message);
    } else if (profile?.id) {
      // Usuario encontrado: actualizar su rol
      const { error: updateErr } = await supabase
        .from("user_profiles")
        .update({ role: assignedRole, updated_at: new Date().toISOString() })
        .eq("id", profile.id);

      if (updateErr) throw new Error(`Error al actualizar el rol: ${updateErr.message}`);
    } else {
      // El usuario aún no ha creado su cuenta — la aprobación queda registrada
      // y el rol correcto se asignará cuando se registre (via handle_new_user trigger
      // + el campo assigned_role en user_requests puede consultarse en ese momento)
      console.warn("El usuario aún no tiene cuenta registrada. La solicitud queda aprobada para cuando se registre.");
    }
  }

  // 3. Marcar la solicitud como Aprobada en la tabla
  const { error: statusErr } = await supabase
    .from("user_requests")
    .update({
      status: "Aprobado",
      assigned_role: assignedRole,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (statusErr) throw new Error(`Error al actualizar estado de solicitud: ${statusErr.message}`);
}

export async function rejectUserRequest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from("user_requests")
    .update({ status: "Rechazado", updated_at: new Date().toISOString() })
    .eq("id", requestId);

  if (error) throw new Error(`Error al rechazar la solicitud: ${error.message}`);
}

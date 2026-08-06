import { supabase } from "../lib/supabaseClient";

export async function registerUserAccount(data: {
  fullName: string;
  email: string;
  password: string;
}): Promise<void> {
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.fullName.trim();

  // 1. Verificación previa: ¿El correo ya existe en user_profiles?
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("email", cleanEmail)
    .maybeSingle();

  if (existingProfile) {
    throw new Error(
      "Este correo electrónico ya se encuentra registrado en el sistema. Puedes iniciar sesión directamente con tu contraseña o solicitar la recuperación a un administrador."
    );
  }

  // 2. Crear la cuenta de Auth en Supabase
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: cleanEmail,
    password: data.password,
    options: {
      data: {
        full_name: cleanName,
      },
    },
  });

  if (signUpErr) {
    const msg = signUpErr.message || "";
    if (msg.toLowerCase().includes("rate limit")) {
      throw new Error(
        "Se ha alcanzado el límite temporal de registros de Supabase (email rate limit). Por favor espera unos minutos antes de intentar de nuevo o solicita al Administrador que te cree la cuenta directamente."
      );
    }
    if (msg.includes("User already registered") || signUpErr.status === 422) {
      throw new Error(
        "Este correo electrónico ya está registrado en el sistema. Intenta iniciar sesión con tus credenciales."
      );
    }
    throw new Error(`Error al registrar la cuenta: ${msg}`);
  }

  const authUserId = signUpData?.user?.id ?? null;

  // 3. Establecer la cuenta como suspendida por defecto hasta que el admin la active en la tabla de usuarios
  if (authUserId) {
    try {
      await supabase
        .from("user_profiles")
        .update({ is_suspended: true, full_name: cleanName })
        .eq("id", authUserId);
    } catch {
      // Ignorar si el perfil está siendo procesado por el trigger handle_new_user
    }
  }
}

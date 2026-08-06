# Documentación de Arquitectura Supabase, Permisos RLS y Edge Functions

Este documento especifica la configuración de **Seguridad a Nivel de Filas (RLS)**, la arquitectura de permisos por usuario/rol, la restricción temporal por fecha y el funcionamiento de la **Edge Function `admin-users`** en Supabase para este proyecto.

---

## 1. Visión General del Modelo de Seguridad

El sistema maneja dos niveles de autenticación y autorización:

1. **Rol Principal (`role`)**:
   - `admin`: Posee acceso total e irrestricto de lectura, creación, modificación y eliminación en todas las secciones, fechas históricas y gestión de usuarios.
   - `operador`: Posee acceso controlado según la estructura de permisos especificada en `user_profiles.permissions`.

2. **Objeto de Permisos Granulares (`UserPermissions`)**:
   ```typescript
   export interface UserPermissions {
     edit_logs: boolean;            // Crear/editar registros de la fecha actual (hoy)
     edit_historical_logs: boolean; // Crear/editar registros de fechas anteriores a hoy
     edit_map: boolean;             // Dibujar, modificar y eliminar elementos gráficos en el mapa
     manage_campamentos: boolean;   // Crear, renombrar y eliminar bases operacionales enteras
     manage_camp_entries: boolean;  // Agregar, editar y eliminar entradas de personal dentro de las bases (fecha actual)
   }
   ```

3. **Permisos por Defecto para Operadores (`DEFAULT_OPERATOR_PERMISSIONS`)**:
   ```typescript
   export const DEFAULT_OPERATOR_PERMISSIONS: UserPermissions = {
     edit_logs: true,
     edit_historical_logs: false,
     edit_map: false,
     manage_campamentos: false, // Por defecto no pueden eliminar o crear bases enteras
     manage_camp_entries: true,  // Por defecto pueden gestionar filas de personal en la fecha actual
   };
   ```

---

## 2. Autoconfirmación Instantánea de Correos (Cero Envío de Emails)

Para garantizar que Supabase **NO envíe ningún correo electrónico** a ningún usuario y evitar límites de tasa o validaciones MX en dominios institucionales:

Trigger `on_auth_user_created_auto_confirm` (`BEFORE INSERT ON auth.users`):
```sql
CREATE OR REPLACE FUNCTION public.auto_confirm_user_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, pg_temp
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := NOW();
  END IF;
  IF NEW.confirmed_at IS NULL THEN
    NEW.confirmed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.auto_confirm_user_email() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user_email();
```

---

## 3. Tablas y Configuración de RLS en PostgreSQL

### Table: `user_profiles`
- **Esquema**: `id` (UUID, PK), `email` (TEXT), `full_name` (TEXT), `role` (TEXT), `is_suspended` (BOOLEAN), `permissions` (JSONB), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Sincronización Bidireccional de Eliminación**:
  - **Auth -> User Profiles**: `user_profiles_id_fkey` (`FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE`). Eliminar de Supabase Auth borra automáticamente la fila en `user_profiles`.
  - **User Profiles -> Auth**: Trigger `on_user_profile_deleted` (`AFTER DELETE ON public.user_profiles`). Eliminar una fila en `user_profiles` ejecuta automáticamente la eliminación correspondiente en `auth.users`.
- **Políticas RLS**:
  - `SELECT`: Lectura permitida para usuarios autenticados (`CREATE POLICY user_profiles_select ON public.user_profiles FOR SELECT TO authenticated USING (true)`).
  - `INSERT` / `UPDATE` / `DELETE`: Restringidos a administradores. La modificación de roles y permisos se gestiona directamente desde la tabla de usuarios en el Panel de Administración.

---

## 4. Edge Function: `admin-users` (`/functions/v1/admin-users`)

- **Verificación JWT (`verify_jwt`)**: `true` (requiere un token Bearer válido en los encabezados).
- **Verificación de Rol**: La función consulta `user_profiles` con el ID del token y rechaza con `403 Forbidden` si el rol no es `admin`.

---

## 5. Guía de Buenas Prácticas para Futuros Agentes de IA y Desarrolladores

> [!IMPORTANT]
> **REGLAS FUNDAMENTALES DE DESARROLLO**

1. **Cero Envío de Correos por Supabase**:
   - Con el trigger `on_auth_user_created_auto_confirm`, cualquier registro queda confirmado automáticamente a nivel de base de datos antes de guardarse. Supabase **nunca envía correos a ningún usuario**.

2. **Gestión Directa desde Usuarios**:
   - Todos los registros crean automáticamente una fila en `user_profiles` con `is_suspended: true` (Pendiente de activación por Administrador). El Administrador simplemente hace clic en **Activar** en la tabla de usuarios.

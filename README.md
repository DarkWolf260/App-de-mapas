# App de Mapas — COE La Guaira

Aplicación de monitoreo y gestión operativa sobre mapa interactivo. Permite trazar puntos, polígonos y polígonos anidados sobre ArcGIS, registrar bitácoras diarias (grupos, novedades, estadísticas), generar reportes y consolidados (exportación a Excel) y administrar equipos de trabajo y campamentos. Incluye un panel de administración para la gestión de usuarios y solicitudes de acceso.

## Stack

- **Frontend:** React 19 + Vite 8 + TypeScript (strict) + Oxlint + Vitest
- **Mapa:** ArcGIS Maps SDK (`@arcgis/core` 5.x)
- **Backend:** Supabase (Auth, Postgres con RLS, Realtime, Edge Functions)
- **Persistence local (legacy):** RxDB (migración automática → Supabase)

## Requisitos

- Node.js 20+
- Copiar `.env.example` a `.env` y completar las variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY` (clave pública de Supabase)

> Las variables `VITE_*` se incrustan en el bundle del cliente. No pongas secretos con ese prefijo. El control de acceso se implementa vía Row Level Security (RLS) en Supabase.

## Scripts

| Comando           | Acción                                |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Servidor de desarrollo (Vite)         |
| `npm run build`   | Build de producción                   |
| `npm run preview` | Previsualizar el build                |
| `npm run lint`    | Lint (Oxlint)                         |
| `npm run test`    | Tests (Vitest)                        |
| `npm run test:watch` | Tests en modo watch                |

## Arquitectura

La app es una **MPA** con varios puntos de entrada (cada uno con su `*.html` y sus rewrites en `vercel.json`):

| Ruta            | Entry                      | Propósito                          |
| --------------- | -------------------------- | ---------------------------------- |
| `/`             | `src/main.tsx`             | Mapa interactivo y monitoreo       |
| `/admin`        | `src/admin-main.tsx`       | Panel de administración            |
| `/consolidado`  | `src/excel-main.tsx`       | Consolidado operativo / Excel      |
| `/login`        | `src/login-main.tsx`       | Login / solicitud de acceso        |

### Capas del código

- `src/types.ts` — tipos de dominio centrales.
- `src/db/` — esquema y migraciones RxDB (legacy local).
- `src/repositories/` — interfaces de abstracción de datos (implementación Supabase).
- `src/services/` — acceso a Supabase (tablas) e invocación de Edge Functions.
- `src/hooks/` — lógica de estado (auth, features, logs, novedades, etc.).
- `src/utils/` — utilidades puras (geometría, logs, estadísticas, Excel, fechas).
- `src/components/` — componentes de UI (mapa, popups, paneles, modal).
- `docs/SYNC_REFERENCE.md` — descripción del esquema Supabase.

## Seguridad

- Todas las tablas de Supabase tienen **RLS** activo; las escrituras se protegen con `has_perm()` / `is_admin()`.
- La gestión administrativa de usuarios se realiza a través de la **Edge Function** `admin-users` (valida el rol con el service role; nunca se expone el service role al cliente).
- Solo se usan la URL y la **anon key** públicas de Supabase en el cliente.

## Organización del repositorio

- `.env` no se versiona (ver `.gitignore`); usar `.env.example` como plantilla.
- Los scripts y documentación de esquema viven en `docs/`.
# 🗺️ App de Mapas — COE La Guaira (Sistema de Gestión y Monitoreo Operacional)

Sistema integral de información geográfica y gestión operativa táctica en tiempo real desarrollado para el **Centro de Operaciones de Emergencia (COE) La Guaira**, **Protección Civil** y el **Cuerpo de Bomberos**.

---

## 🚀 Características Principales

- **🛰️ Cartografía Avanzada con ArcGIS Maps SDK:**
  - Selector de mapas base entre **Google Satelital** (mosaicos de alta resolución) y **ArcGIS Satelital**.
  - Trazado y edición de geometrías vectoriales: **Puntos** (sitios de trabajo, hospitales, refugios, puntos de riesgo), **Líneas** (rutas de acceso) y **Polígonos / Sectores**.
  - Motor de superposición dual: **WebGL acelerado** con fallback automático a **Overlay SVG (DOM)** para computadoras de bajos recursos en puestos de comando.

- **🔀 Herramienta de Comparación Táctica "Antes y Después" (Swipe):**
  - Deslizador interactivo para comparar en tiempo real el terreno previo al evento vs. imágenes satelitales recientes e imágenes post-evento (COG / GeoTIFF de alta resolución).

- **📋 Gestión Integral de Bitácoras Diarias y Despliegue:**
  - Registro cronológico por fecha e institución (**Protección Civil**, **Bomberos**, o **Vista Mixta**).
  - Gestión de grupos y equipos de trabajo (oficiales, unidades, horarios de salida/llegada, comisiones conjuntas).
  - Registro de indicadores operacionales: rescates, personas recuperadas, atención prehospitalaria, traslados, mascotas rescatadas y evaluaciones EDAN.
  - **Actividades Personalizadas del Punto/Sector:** Registro modular e independiente de actividades tácticas (*Demolición controlada*, *Guardia preventiva*, *Patrullaje*, etc.).

- **📐 Motor de Inteligencia Espacial y Desconflicto:**
  - Agregación automática: los polígonos/sectores suman en vivo el personal, indicadores y actividades de todos los puntos de trabajo contenidos en sus límites geográficos.
  - Motor de desconflicto geométrico de etiquetas para evitar solapamientos visuales en pantalla.

- **📊 Pizarra Operacional y Reportes Automatizados:**
  - Consolidado diario de despliegue por REDAN/ZOEDAN, campamentos y capacidades.
  - Exportación de reportes tabulares y consolidados en formato **Excel (`.xlsx`)**.
  - Generación de reportes gráficos e imágenes de sectores para minutas operativas.

- **🛡️ Sincronización Realtime y Seguridad Multinivel:**
  - Sincronización en tiempo real vía **Supabase Realtime** (`postgres_changes` con `REPLICA IDENTITY FULL`).
  - Control de acceso granular basado en roles (*Admin*, *Editor*, *Viewer*) mediante **Row Level Security (RLS)** y Edge Functions seguras.
  - Base de datos local offline **RxDB (Dexie)** con estrategias de migración automática.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Frontend Core** | React 19, TypeScript (Strict Mode), Vite 8 |
| **Motor SIG / Mapas** | `@arcgis/core` 5.x (ArcGIS Maps SDK for JavaScript), `@arcgis/map-components` |
| **Backend & Base de Datos** | Supabase (PostgreSQL 17, PostgREST, Realtime, Auth, Edge Functions) |
| **Persistencia Local / Offline** | RxDB 17, Dexie Storage, RxDB Migration Schema Plugin |
| **Iconografía y UI** | Lucide React, CSS Moderno Modular con variables de diseño temáticas |
| **Testing & Calidad de Código**| Vitest, Testing Library, JSDOM, Oxlint |

---

## 📁 Estructura del Proyecto

La aplicación está estructurada como una **Multi-Page Application (MPA)** optimizada:

| Entrada URL | Punto de Entrada | Propósito |
| :--- | :--- | :--- |
| `/` | [`src/main.tsx`](file:///c:/Users/Proteccion%20Civil/Music/App%20de%20mapas/src/main.tsx) | Visor del mapa interactivo, bitácoras y despliegue táctico |
| `/admin` | [`src/admin-main.tsx`](file:///c:/Users/Proteccion%20Civil/Music/App%20de%20mapas/src/admin-main.tsx) | Panel de administración de usuarios y permisos |
| `/consolidado` | [`src/excel-main.tsx`](file:///c:/Users/Proteccion%20Civil/Music/App%20de%20mapas/src/excel-main.tsx) | Matriz consolidada de operaciones y exportación Excel |
| `/login` | [`src/login-main.tsx`](file:///c:/Users/Proteccion%20Civil/Music/App%20de%20mapas/src/login-main.tsx) | Autenticación, recuperación y solicitud de acceso |

### Arquitectura de Carpetas (`src/`):

```
src/
├── components/          # Componentes de UI reactivos (Pizarra, MapComponent, Popups, Reportes)
│   ├── popup/          # Componentes modulares del Popup (InfoTab, MetricGrid, WorkTeamsSection)
│   ├── pizarra/        # Componentes de la Pizarra Operacional y Campamentos
│   └── report/         # Componentes del Generador de Reportes por Rango de Fechas
├── hooks/               # Custom Hooks desacoplados (useAppState, useFeatureDB, useSpatialHierarchy)
├── services/            # Servicios de acceso a API Supabase y Edge Functions
├── repositories/        # Interfaces y abstracciones de persistencia (Patrón Repository)
├── utils/               # Módulos puros de dominio (featureLogBook, logSerialization, spatialUtils, mapUtils)
├── db/                  # Esquema y migraciones de base de datos local RxDB
├── styles/              # Sistema de diseño CSS modular (base, components, modals, sidebar, toolbar)
└── types.ts             # Definiciones e interfaces TypeScript de dominio central
```

---

## ⚙️ Instalación y Puesta en Marcha

### 1. Requisitos Previos
- **Node.js:** Versión 20.x o superior.
- **NPM:** Versión 10.x o superior.

### 2. Configurar Variables de Entorno
Copia el archivo de ejemplo y configura las credenciales de tu proyecto Supabase:

```bash
cp .env.example .env
```

Edita `.env`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-publica
```

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Ejecutar en Servidor de Desarrollo
```bash
npm run dev
```

---

## 🧪 Scripts Disponibles

```bash
# Iniciar servidor de desarrollo en local
npm run dev

# Ejecutar suite completa de pruebas unitarias con Vitest (23 suites, 221+ tests)
npm test

# Ejecutar pruebas en modo observador interactivo
npm run test:watch

# Análisis estático y linter ultrarrápido con Oxlint
npm run lint

# Compilar bundle de producción optimizado
npm run build

# Previsualizar bundle de producción localmente
npm run preview
```

---

## 📚 Documentación Técnica Adicional

- [📐 Arquitectura de Software y Principios SOLID](file:///c:/Users/Proteccion%20Civil/Music/App%20de%20mapas/docs/ARCHITECTURE.md)
- [🗄️ Esquema de Base de Datos y Políticas RLS en Supabase](file:///c:/Users/Proteccion%20Civil/Music/App%20de%20mapas/docs/DATABASE_SCHEMA.md)
- [📖 Manual de Usuario y Guía Operativa de Terreno](file:///c:/Users/Proteccion%20Civil/Music/App%20de%20mapas/docs/USER_GUIDE.md)
- [🔄 Referencia de Sincronización en Tiempo Real](file:///c:/Users/Proteccion%20Civil/Music/App%20de%20mapas/docs/SYNC_REFERENCE.md)
# SYNC_REFERENCE.md — Esquema de Sincronización Supabase

## Tablas

### `drawn_features`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | text (PK) | ID único del feature |
| `title` | text | Título / nombre |
| `type` | text | `point` / `polyline` / `polygon` |
| `description` | text | Descripción opcional |
| `color` | text | Color hex |
| `locked` | boolean | Bloqueo de edición |
| `is_collapsed` | boolean | Edificio colapsado |
| `collapsed_count` | text | Cantidad colapsados |
| `geojson_geometry` | jsonb | Geometría en formato GeoJSON |
| `updated_at` | timestamptz | Última modificación |

### `daily_logs`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | ID autogenerado |
| `feature_id` | text (FK) | Referencia a `drawn_features.id` |
| `date` | text | Fecha ISO (YYYY-MM-DD) |
| `department` | text | `pc` / `bomberos` |
| `groups` | jsonb | Array de `GroupLogEntry[]` — única fuente de datos de grupos |
| `observations` | text | Observaciones del día |
| `novedades` | jsonb | Array de `NovedadEntry[]` |
| `rescued_count` | text | Estadística agregada del polígono |
| `recovered_count` | text | Estadística agregada del polígono |
| `rescued_pets_count` | text | Estadística agregada del polígono |
| `prehospital_care_count` | text | Estadística agregada del polígono |
| `transfers_count` | text | Estadística agregada del polígono |
| `created_at` | timestamptz | Creación |
| `updated_at` | timestamptz | Última modificación |

### `novedades`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | ID |
| `date` | text | Fecha |
| `department` | text | Departamento |
| `time` | text | Hora |
| `text` | text | Contenido |
| `type` | text | `novedad` / `incidencia` / `actualización` |
| `timestamp` | text | Timestamp ISO |

### `work_groups`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | ID |
| `name` | text | Nombre del grupo |
| `leader_name` | text | Encargado |
| `leader_phone` | text | Teléfono |
| `department` | text | `pc` / `bomberos` |
| `notes` | text | Notas |
| `corps` | text | Cuerpo |
| `unit_vehicle` | text | Vehículo |
| `updated_at` | timestamptz | Última modificación |

## Modelos TypeScript

### `GroupLogEntry`
```typescript
interface GroupLogEntry {
  id: string;
  groupName: string;
  managerName?: string;
  managerPhone?: string;
  unitOut?: string;
  officersCount?: string;
  rescuedCount?: string;
  recoveredCount?: string;
  rescuedPetsCount?: string;
  prehospitalCareCount?: string;
  transfersCount?: string;
  hasArrived?: boolean;
  commissionId?: string;
  isVolunteer?: boolean;
}
```

### `DailyLog`
```typescript
interface DailyLog {
  date: string;
  department?: Department;
  groups?: GroupLogEntry[];   // única fuente de datos de grupos
  observations?: string;
  novedades?: NovedadEntry[];
  rescuedCount?: string;       // estadística del polígono (NO del grupo 1)
  recoveredCount?: string;
  rescuedPetsCount?: string;
  prehospitalCareCount?: string;
  transfersCount?: string;
}
```

## Flujo de sincronización

1. **Carga inicial**: `useFeatureDB` obtiene `drawn_features` + `daily_logs` de Supabase
2. **Tiempo real**: Suscripción Realtime a cambios en las 3 tablas
3. **Escritura**: Cada save de daily log envía `groups[]` como JSONB — el array de grupos es la única fuente de verdad para los datos de equipos
4. **Fallback RxDB**: Si Supabase no tiene datos, se usa RxDB local como respaldo

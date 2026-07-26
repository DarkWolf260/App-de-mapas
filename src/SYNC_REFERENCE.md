# Referencia de Sincronizacion con Supabase

Glosario completo de que datos se envian/reciben entre la app y Supabase.

---

## Tabla `drawn_features` (112 filas)

Feature del mapa (punto, poligono, linea).

| Columna DB | Tipo | Campo TS (`DrawnFeature`) | Escritura | Lectura |
|---|---|---|---|---|
| `id` | text (PK) | `id` (number) | `handleFeatureAdded`, migracion RxDB | `fetchFromSupabase` |
| `title` | text | `title` | `handleRenameFeature` | `fetchFromSupabase` |
| `type` | text | `type` ("point"/"polyline"/"polygon") | `handleFeatureAdded` | `fetchFromSupabase` |
| `description` | text | `description` | `handleUpdateFeatureDescription` | `fetchFromSupabase` |
| `color` | text | `color` (hex string) | `handleUpdateFeatureColor` | `fetchFromSupabase` |
| `locked` | boolean | `locked` | `handleToggleFeatureLock` | `fetchFromSupabase` |
| `is_collapsed` | boolean | `isCollapsed` | `handleUpdateFeatureCollapsed` | `fetchFromSupabase` |
| `collapsed_count` | text | `collapsedCount` | `handleUpdateFeatureCollapsed` | `fetchFromSupabase` |
| `geojson_geometry` | jsonb | `geojsonGeometry` | `handleFeatureAdded` | `fetchFromSupabase` |
| `created_at` | timestamptz | *(no mapeado)* | automatico (default) | - |
| `updated_at` | timestamptz | *(no mapeado)* | todas las escrituras | - |

---

## Tabla `daily_logs` (113 filas)

Registro operativo diario por feature. **Tiene representacion dual**: columnas planas por grupo (legacy) + array JSON `groups`.

### Metadata

| Columna DB | Tipo | Campo TS (`DailyLog`) | Escritura | Lectura |
|---|---|---|---|---|
| `id` | uuid (PK) | *(no en tipo)* | auto (insert) | lookup por update |
| `feature_id` | text (FK) | *(间接: DrawnFeature.id)* | `handleSaveDailyLog` | `fetchFromSupabase` |
| `date` | text | `date` | `handleSaveDailyLog` | `fetchFromSupabase` |
| `department` | text | `department` ("pc"/"bomberos") | `handleSaveDailyLog` | `fetchFromSupabase` |
| `observations` | text | `observations` | `handleSaveDailyLog` | `fetchFromSupabase` |
| `groups` | jsonb | `groups` (GroupLogEntry[]) | `handleSaveDailyLog` | `fetchFromSupabase` |
| `created_at` | timestamptz | *(no mapeado)* | automatico | - |
| `updated_at` | timestamptz | *(no mapeado)* | todas las escrituras | - |

### Grupo 1 - Identidad

| Columna DB | Campo TS | Escritura |
|---|---|---|
| `group_name` | `groupName` | `handleSaveDailyLog` |
| `unit_out` | `unitOut` | `handleSaveDailyLog` |
| `manager_name` | `managerName` | `handleSaveDailyLog` |
| `manager_phone` | `managerPhone` | `handleSaveDailyLog` |
| `officers_count` | `officersCount` | `handleSaveDailyLog` |
| `commission_id` | `commissionId` | `handleSaveDailyLog` |
| `is_volunteer` | `isVolunteer` | `handleSaveDailyLog` |
| **`has_arrived_g1`** | **`hasArrivedG1`** | **`handleSaveDailyLog`** |

### Grupo 2 - Identidad + Metricas

| Columna DB | Campo TS | Escritura |
|---|---|---|
| `group_name2` | `groupName2` | `handleSaveDailyLog` |
| `unit_out2` | `unitOut2` | `handleSaveDailyLog` |
| `manager_name2` | `managerName2` | `handleSaveDailyLog` |
| `manager_phone2` | `managerPhone2` | `handleSaveDailyLog` |
| `officers_count2` | `officersCount2` | `handleSaveDailyLog` |
| `commission_id2` | `commissionId2` | `handleSaveDailyLog` |
| `is_volunteer2` | `isVolunteer2` | `handleSaveDailyLog` |
| **`has_arrived_g2`** | **`hasArrivedG2`** | **`handleSaveDailyLog`** |
| `rescued_count2` | `rescuedCount2` | `handleSaveDailyLog` |
| `recovered_count2` | `recoveredCount2` | `handleSaveDailyLog` |
| `rescued_pets_count2` | `rescuedPetsCount2` | `handleSaveDailyLog` |
| `prehospital_care_count2` | `prehospitalCareCount2` | `handleSaveDailyLog` |
| `transfers_count2` | `transfersCount2` | `handleSaveDailyLog` |

### Grupo 3 - Identidad + Metricas

| Columna DB | Campo TS | Escritura |
|---|---|---|
| `group_name3` | `groupName3` | `handleSaveDailyLog` |
| `unit_out3` | `unitOut3` | `handleSaveDailyLog` |
| `manager_name3` | `managerName3` | `handleSaveDailyLog` |
| `manager_phone3` | `managerPhone3` | `handleSaveDailyLog` |
| `officers_count3` | `officersCount3` | `handleSaveDailyLog` |
| `commission_id3` | `commissionId3` | `handleSaveDailyLog` |
| `is_volunteer3` | `isVolunteer3` | `handleSaveDailyLog` |
| **`has_arrived_g3`** | **`hasArrivedG3`** | **`handleSaveDailyLog`** |
| `rescued_count3` | `rescuedCount3` | `handleSaveDailyLog` |
| `recovered_count3` | `recoveredCount3` | `handleSaveDailyLog` |
| `rescued_pets_count3` | `rescuedPetsCount3` | `handleSaveDailyLog` |
| `prehospital_care_count3` | `prehospitalCareCount3` | `handleSaveDailyLog` |
| `transfers_count3` | `transfersCount3` | `handleSaveDailyLog` |

### Grupo 4 - Identidad + Metricas

| Columna DB | Campo TS | Escritura |
|---|---|---|
| `group_name4` | `groupName4` | `handleSaveDailyLog` |
| `unit_out4` | `unitOut4` | `handleSaveDailyLog` |
| `manager_name4` | `managerName4` | `handleSaveDailyLog` |
| `manager_phone4` | `managerPhone4` | `handleSaveDailyLog` |
| `officers_count4` | `officersCount4` | `handleSaveDailyLog` |
| `commission_id4` | `commissionId4` | `handleSaveDailyLog` |
| `is_volunteer4` | `isVolunteer4` | `handleSaveDailyLog` |
| **`has_arrived_g4`** | **`hasArrivedG4`** | **`handleSaveDailyLog`** |
| `rescued_count4` | `rescuedCount4` | `handleSaveDailyLog` |
| `recovered_count4` | `recoveredCount4` | `handleSaveDailyLog` |
| `rescued_pets_count4` | `rescuedPetsCount4` | `handleSaveDailyLog` |
| `prehospital_care_count4` | `prehospitalCareCount4` | `handleSaveDailyLog` |
| `transfers_count4` | `transfersCount4` | `handleSaveDailyLog` |

### Metricas Generales (poligono)

| Columna DB | Campo TS | Escritura |
|---|---|---|
| `rescued_count` | `rescuedCount` | `handleSaveDailyLog` |
| `recovered_count` | `recoveredCount` | `handleSaveDailyLog` |
| `rescued_pets_count` | `rescuedPetsCount` | `handleSaveDailyLog` |
| `prehospital_care_count` | `prehospitalCareCount` | `handleSaveDailyLog` |
| `transfers_count` | `transfersCount` | `handleSaveDailyLog` |

---

## Tabla `work_groups` (11 filas)

Plantillas de grupos de trabajo.

| Columna DB | Tipo | Campo TS (`WorkGroup`) | Escritura |
|---|---|---|---|
| `id` | text (PK) | `id` | `saveWorkGroups` |
| `name` | text | `name` | `saveWorkGroups` |
| `leader_name` | text | `leaderName` | `saveWorkGroups` |
| `leader_phone` | text | `leaderPhone` | `saveWorkGroups` |
| `department` | text | `department` | `saveWorkGroups` |
| `notes` | text | `notes` | `saveWorkGroups` |
| `updated_at` | timestamptz | *(no mapeado)* | auto |

---

## Flujo de Datos: Toggle de Llegada (hasArrived)

```
UI (InfoTab checkbox / GroupDisplay pill / GroupFields checkbox)
  │
  ├─ InfoTab: onToggleArrivalGroup(groupIdx, bool)
  │   └─ CustomMapPopup.handleToggleArrivalGroup
  │       → Actualiza campo plano: updatedLog.hasArrivedG1 = true
  │       → NO limpia log.groups (groups del original persiste)
  │       → Llama onSaveDailyLog(feat.id, updatedLog)
  │
  ├─ GroupDisplay: onToggleArrival(!isArrived)
  │   └─ RangeReportModal.handleToggleArrivalQuick
  │       → Actualiza campo plano: updatedLog.hasArrivedG1 = true
  │       → Actualiza groups array: groups[0].hasArrived = true
  │       → Llama onSaveDailyLog(feat.id, updatedLog)
  │
  └─ GroupFields checkbox: onFieldChange("hasArrivedG1", bool)
      → CustomMapPopup.handleLogFieldChange
      → LIMPIA log.groups = undefined
      → Usuario hace click "Guardar"
      → handleLogSave → onSaveDailyLog(feat.id, logToSave)

═══════════════════════════════════════════════════

handleSaveDailyLog (useFeatureDB.ts)
  │
  1. getNormalizedGroupList(log)
     → Si log.groups existe Y campo plano != undefined:
       campo plano GANA (hasArrivedG1 > groups[0].hasArrived)
     → Si solo hay campo plano:
       usa directamente hasArrivedG1
  │
  2. Construye payload con AMBOS:
     • has_arrived_g1 = g0?.hasArrived ?? !!log.hasArrivedG1
     • groups = [{hasArrived: true}, ...]
  │
  3. SELECT WHERE feature_id=X AND date=Y AND department=Z
     → Si existe: UPDATE
     → Si no existe: INSERT
  │
  4. fetchFromSupabase() → re-lee todo

═══════════════════════════════════════════════════

Supabase Realtime
  → Escucha cambios en daily_logs
  → Todos los clientes re-leen con fetchFromSupabase()
```

---

## Representacion Dual: Plano vs JSON

**Por que existen las dos representaciones?**

- **Columnas planas** (`has_arrived_g1`, `group_name`, etc.): Legado del sistema original. Facilitan consultas SQL directas.
- **Array JSON** (`groups`): Representacion moderna. Permite grupos dinamicos sin limite de columnas.

**Que se envia al guardar?**

AMBOS. `handleSaveDailyLog` siempre escribe:
1. Las columnas planas (derivadas de `getNormalizedGroupList`)
2. El array `groups` como JSON

**Que se lee al cargar?**

`fetchFromSupabase` lee:
1. Las columnas planas → mapea a campos `DailyLog` (ej: `has_arrived_g1` → `hasArrivedG1`)
2. El array `groups` JSON → parsea y guarda en `DailyLog.groups`

**Regla de prioridad al guardar:**
Si el campo plano existe, GANA sobre el valor del array JSON.

---

## Campos que NO se guardan en Supabase

Estos campos existen en el tipo `DailyLog` pero NO tienen columna equivalente en Supabase:

- `rescuedPetsCount` general (solo el de cada grupo se guarda: `rescued_pets_count2/3/4`)
- `rescuedCount` general (tiene columna `rescued_count` pero NO tiene `rescued_count1` - los valores del grupo 1 van via `groups` JSON)

> **Nota**: Las metricas generales (`rescued_count`, `recovered_count`, etc.) son estadisticas del poligono, NO del grupo 1.

---

## RLS (Row Level Security)

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `drawn_features` | Todos autenticados | Admin only | Admin only | Admin only |
| `daily_logs` | Todos autenticados | Admin only | Admin only | Admin only |
| `work_groups` | Todos autenticados | Admin only | Admin only | Admin only |

**Admin** = usuario con `app_metadata.role = 'admin'` en JWT.

---

## Checklist: Agregar un Campo Nuevo

Cuando se agrega un campo nuevo al sistema de logs:

1. **Definir en `types.ts`** → agregar campo al tipo `DailyLog` o `GroupLogEntry`
2. **Agregar columna en Supabase** → `ALTER TABLE daily_logs ADD COLUMN nuevo_campo TEXT DEFAULT '';`
3. **Mapear en `useFeatureDB.ts`**:
   - En `fetchFromSupabase`: leer `row.nuevo_campo` → mapear al campo TS
   - En `handleSaveDailyLog`: agregar al payload
4. **Mapear en `logUtils.ts`** si aplica a `getNormalizedGroupList`
5. **Actualizar UI** en el componente correspondiente (InfoTab, GroupFields, etc.)
6. **Actualizar este documento** con la nueva columna

---

## Logs de Depuracion

Para depurar el flujo de guardado, filtrar en la consola del navegador con `[Supabase`:

```
[Supabase:save:input]      → Datos de entrada al guardar
[Supabase:save:lookup]     → Resultado de buscar registro existente
[Supabase:save:normalize]  → Grupos normalizados con hasArrived
[Supabase:save:filter]     → Grupos filtrados (vacios removidos)
[Supabase:save:payload]    → Payload final con has_arrived_gN
[Supabase:save:exec]       → UPDATE/INSERT resultado
[Supabase:fetch]           → Re-lectura post-guardado (conteo)
[Supabase:fetch:arrival_sample] → Muestra de arrival status leido
[Supabase:realtime]        → Evento de cambio en tiempo real
```

Para depurar el UI-side:
```
[Popup:arrival]            → Toggle desde popup/InfoTab
[Popup:arrival:saved]      → Guardado completado
[RangeReport:arrival]      → Toggle desde reporte
[InfoTab:arrival]          → Checkbox en InfoTab
```

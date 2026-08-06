import { supabase } from "../lib/supabaseClient";

export interface OperationalBaseItem {
  id: string;
  name: string;
  count: number;
  isAmbulance?: boolean;
}

export interface OperationalBase {
  id: string;
  baseName: string;
  items: OperationalBaseItem[];
}

export interface RedanEntry {
  redan: string;
  components: string;
  totalPersonal: number;
}

export interface StateCountEntry {
  stateName: string;
  officersCount: number;
  vehiclesCount: number;
  ambulancesCount: number;
}

export interface StatePersonnelCount {
  id: string;
  stateName: string;
  officersCount: number;
  type?: "pc" | "bomberos" | "otros";
}

export interface CampamentoEntry {
  id: string;
  date?: string;
  campName: string;
  location?: string;
  managerName?: string;
  managerPhone?: string;
  capacity?: number;
  personnelCount?: number;
  status?: string;
  statesDetail?: StatePersonnelCount[];
}

export const PC_STATES: string[] = [
  "PC",
  "PC Amazonas",
  "PC Anzoátegui",
  "PC Apure",
  "PC Aragua",
  "PC Barinas",
  "PC Bolívar",
  "PC Carabobo",
  "PC Cojedes",
  "PC Delta Amacuro",
  "PC Falcón",
  "PC Guárico",
  "PC La Guaira",
  "PC Lara",
  "PC Mérida",
  "PC Miranda",
  "PC Monagas",
  "PC Nacional",
  "PC Nueva Esparta",
  "PC Portuguesa",
  "PC Sucre",
  "PC Táchira",
  "PC Trujillo",
  "PC Yaracuy",
  "PC Zulia",
];

export const BOMBEROS_ENTITIES: string[] = [
  "Bomberos",
  "Bomberos Amazonas",
  "Bomberos Anzoátegui",
  "Bomberos Apure",
  "Bomberos Aragua",
  "Bomberos Barinas",
  "Bomberos Bolívar",
  "Bomberos Carabobo",
  "Bomberos Cojedes",
  "Bomberos Delta Amacuro",
  "Bomberos Falcón",
  "Bomberos Guárico",
  "Bomberos La Guaira",
  "Bomberos Lara",
  "Bomberos Mérida",
  "Bomberos Miranda",
  "Bomberos Monagas",
  "Bomberos Nacional",
  "Bomberos Nueva Esparta",
  "Bomberos Portuguesa",
  "Bomberos Sucre",
  "Bomberos Táchira",
  "Bomberos Trujillo",
  "Bomberos Yaracuy",
  "Bomberos Zulia",
  "Bomberos Universitarios",
  "Bomberos Aeronáuticos",
  "Bomberos Marinos",
];

export const OTROS_ORGANISMOS: string[] = [
  "Guardia Nacional Bolivariana (GNB)",
  "Policía Nacional Bolivariana (PNB)",
  "Fuerza Armada Nacional Bolivariana (FANB)",
  "Cruz Roja",
  "Grupo de Rescate",
  "VEN 911",
  "Inparques",
  "Ministerio de Salud (MPPS)",
].sort((a, b) => a.localeCompare(b, "es"));

export function getEntryType(stateName: string, explicitType?: string): "pc" | "bomberos" | "otros" {
  if (explicitType === "pc" || explicitType === "bomberos" || explicitType === "otros") {
    return explicitType;
  }
  const lower = (stateName || "").toLowerCase();
  if (lower.startsWith("pc ") || lower === "pc") return "pc";
  if (lower.startsWith("bomberos ") || lower.includes("bomberos")) return "bomberos";
  return "otros";
}

export const VENEZUELA_STATES: string[] = PC_STATES;

export const EMPTY_CAMPAMENTOS: CampamentoEntry[] = [];

export const INITIAL_STATE_COUNTS: StateCountEntry[] = VENEZUELA_STATES.map((state) => ({
  stateName: state,
  officersCount: 0,
  vehiclesCount: 0,
  ambulancesCount: 0,
}));

// Empty arrays: NO hardcoded dummy bases
export const INITIAL_OPERATIONAL_BASES: OperationalBase[] = [];

// Aliases for compatibility
export const DEFAULT_OPERATIONAL_BASES: OperationalBase[] = [];
export const DEFAULT_CAMPAMENTOS = EMPTY_CAMPAMENTOS;
export const DEFAULT_STATE_COUNTS = INITIAL_STATE_COUNTS;

export const DEFAULT_REDAN_REGIONS: RedanEntry[] = [
  { redan: "REDAN Capital", components: "PC La Guaira, Miranda, Nacional, Vargas M", totalPersonal: 0 },
  { redan: "REDAN Los Llanos", components: "Apure, Barinas, Guárico, Cojedes, Aragua, Carabobo, Miranda, Apuretegui, Portuguesa", totalPersonal: 0 },
  { redan: "REDAN Occidente", components: "Lara, Falcón, Zulia", totalPersonal: 0 },
  { redan: "REDAN Los Andes", components: "Mérida, Trujillo, Yaracuy, Táchira", totalPersonal: 0 },
  { redan: "REDAN Oriente", components: "Sucre Los Corales, E.J.I.F., Monagas", totalPersonal: 0 },
  { redan: "REDAN Guayana", components: "Amazonas, Bolívar, Delta Amacuro", totalPersonal: 0 },
  { redan: "REDAN Marítima", components: "PC Nueva Esparta", totalPersonal: 0 },
];

export function getBaseTotal(base: OperationalBase): number {
  return base.items.reduce((sum, item) => {
    if (typeof item.count === "number") return sum + item.count;
    const parsed = parseInt(String(item.count), 10);
    return sum + (isNaN(parsed) ? 0 : parsed);
  }, 0);
}

export function getGrandTotal(bases: OperationalBase[]): number {
  return bases.reduce((sum, b) => sum + getBaseTotal(b), 0);
}

export function sanitizeOperationalBases(bases: OperationalBase[]): OperationalBase[] {
  return (bases || []).map((b) => ({
    ...b,
    items: (b.items || []).filter(
      (item) =>
        !item.isAmbulance &&
        !item.name.toLowerCase().includes("ambulancia") &&
        !item.name.toLowerCase().includes("rescate")
    ),
  }));
}

/**
 * Fetches operational bases dynamically from dedicated Supabase table `operational_bases`
 */
export async function fetchOperationalBases(dateStr: string): Promise<OperationalBase[]> {
  try {
    const { data, error } = await supabase
      .from("operational_bases")
      .select("bases")
      .eq("date", dateStr)
      .maybeSingle();

    if (!error && data?.bases && Array.isArray(data.bases)) {
      return sanitizeOperationalBases(data.bases as OperationalBase[]);
    }
  } catch (err) {
    console.warn("Supabase fetch operational_bases error:", err);
  }

  return [];
}

/**
 * Saves operational bases directly to dedicated Supabase table `operational_bases`
 */
export async function saveOperationalBases(dateStr: string, bases: OperationalBase[]): Promise<void> {
  const { data: existing } = await supabase
    .from("operational_bases")
    .select("id")
    .eq("date", dateStr)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("operational_bases")
      .update({ bases, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("operational_bases")
      .insert({ date: dateStr, bases, updated_at: new Date().toISOString() });
  }
}

/**
 * Fetches Campamentos entries directly from dedicated Supabase table `campamentos`
 */
export async function fetchCampamentos(dateStr?: string): Promise<CampamentoEntry[]> {
  try {
    const { data, error } = await supabase
      .from("campamentos")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      const dateFiltered = dateStr ? data.filter((row: any) => row.date === dateStr) : [];
      let result: CampamentoEntry[] = [];

      if (dateFiltered.length > 0) {
        result = dateFiltered.map((row: any) => ({
          id: row.id,
          date: row.date,
          campName: row.camp_name,
          location: row.location || "",
          managerName: row.manager_name || "",
          managerPhone: row.manager_phone || "",
          capacity: row.capacity || 0,
          personnelCount: row.personnel_count || 0,
          status: row.status || "Activo",
          statesDetail: (Array.isArray(row.states_detail)
            ? row.states_detail
            : typeof row.states_detail === "string" && row.states_detail.trim()
            ? JSON.parse(row.states_detail)
            : []
          ).map((sd: any, idx: number) => ({
            id: sd.id || `st_${row.id}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
            stateName: sd.stateName || VENEZUELA_STATES[0],
            officersCount: Number(sd.officersCount) || 0,
            type: getEntryType(sd.stateName || VENEZUELA_STATES[0], sd.type),
          })),
        }));
      }
      // If we don't have records for the requested date in campamentos table,
      // try to restore them from pizarra_operacional table if a record exists for this date.
      else if (dateStr) {
        try {
          const { data: pizarraData, error: pizarraError } = await supabase
            .from("pizarra_operacional")
            .select("camps_summary")
            .eq("record_date", dateStr)
            .maybeSingle();

          if (!pizarraError && pizarraData?.camps_summary && Array.isArray(pizarraData.camps_summary)) {
            const summary = pizarraData.camps_summary as any[];
            result = summary.map((c: any) => {
              const activeStates: StatePersonnelCount[] = [];
              if (Array.isArray(c.states)) {
                c.states.forEach((s: any, idx: number) => {
                  const count = Number(s.officersCount) || 0;
                  if (count > 0) {
                    activeStates.push({
                      id: crypto.randomUUID(),
                      stateName: s.stateName,
                      officersCount: count,
                      type: getEntryType(s.stateName, s.type),
                    });
                  }
                });
              }

              return {
                id: (c.campId && c.campId.length === 36 && c.campId.includes("-")) ? c.campId : crypto.randomUUID(),
                date: dateStr,
                campName: c.campName,
                location: "",
                managerName: "",
                managerPhone: "",
                capacity: 0,
                personnelCount: c.personnelCount || 0,
                status: "Activo",
                statesDetail: activeStates,
              };
            });
          }
        } catch (err) {
          console.warn("Error in fetchCampamentos fallback from pizarra_operacional:", err);
        }
      }

      // If we don't have records for the requested date in EITHER table, find the most recent date's records
      // to use as a template (but reset personnel and officers counts to 0, and clear IDs so they insert on save)
      if (result.length === 0 && dateStr) {
        const dates = Array.from(new Set(data.map((row: any) => row.date).filter(Boolean))) as string[];
        if (dates.length > 0) {
          dates.sort((a, b) => b.localeCompare(a));
          const latestDate = dates[0];
          const latestCamps = data.filter((row: any) => row.date === latestDate);

          result = latestCamps.map((row: any) => ({
            // UUID real desde el inicio: upsert lo insertará como nuevo registro del día actual
            id: crypto.randomUUID(),
            date: dateStr,
            campName: row.camp_name,
            location: row.location || "",
            managerName: row.manager_name || "",
            managerPhone: row.manager_phone || "",
            capacity: row.capacity || 0,
            personnelCount: 0,
            status: row.status || "Activo",
            statesDetail: (Array.isArray(row.states_detail)
              ? row.states_detail
              : typeof row.states_detail === "string" && row.states_detail.trim()
              ? JSON.parse(row.states_detail)
              : []
            ).map((sd: any) => ({
              id: crypto.randomUUID(),
              stateName: sd.stateName || VENEZUELA_STATES[0],
              officersCount: 0,
              type: getEntryType(sd.stateName || VENEZUELA_STATES[0], sd.type),
            })),
          }));
        }
      }

      if (result.length === 0) {
        // Fallback: map all rows if no specific date is matched/requested
        result = data.map((row: any) => ({
          id: row.id,
          date: row.date,
          campName: row.camp_name,
          location: row.location || "",
          managerName: row.manager_name || "",
          managerPhone: row.manager_phone || "",
          capacity: row.capacity || 0,
          personnelCount: row.personnel_count || 0,
          status: row.status || "Activo",
          statesDetail: (Array.isArray(row.states_detail)
            ? row.states_detail
            : typeof row.states_detail === "string" && row.states_detail.trim()
            ? JSON.parse(row.states_detail)
            : []
          ).map((sd: any, idx: number) => ({
            id: sd.id || `st_${row.id}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
            stateName: sd.stateName || VENEZUELA_STATES[0],
            officersCount: Number(sd.officersCount) || 0,
            type: getEntryType(sd.stateName || VENEZUELA_STATES[0], sd.type),
          })),
        }));
      }

      // Sort alphabetically by campName
      result.sort((a, b) => a.campName.localeCompare(b.campName, "es"));
      return result;
    }
  } catch (err) {
    console.warn("Supabase fetch campamentos error:", err);
  }

  return [];
}

/**
 * Saves Campamentos entries directly to dedicated Supabase table `campamentos`
 */
export async function saveCampamentos(dateStr: string, camps: CampamentoEntry[]): Promise<void> {
  // --- Eliminar registros del día que ya no existen en la lista local ---
  try {
    const currentIds = camps.map((c) => c.id).filter(Boolean);

    const { data: existingRows } = await supabase
      .from("campamentos")
      .select("id")
      .eq("date", dateStr);

    if (existingRows && existingRows.length > 0) {
      const toDelete = existingRows
        .map((r: any) => r.id)
        .filter((id: string) => !currentIds.includes(id));

      if (toDelete.length > 0) {
        await supabase.from("campamentos").delete().in("id", toDelete);
      }
    }
  } catch (err) {
    console.warn("Error cleaning up deleted campamentos:", err);
  }

  // --- Upsert de todos los campamentos del día ---
  // INSERT si el id no existe aún, UPDATE si ya existe.
  // Todos los registros tienen UUIDs reales (nunca temp_), por lo que
  // el historial de días anteriores no se ve afectado.
  for (const c of camps) {
    const payload = {
      id: c.id,
      date: dateStr,
      camp_name: c.campName,
      location: c.location || "",
      manager_name: c.managerName || "",
      manager_phone: c.managerPhone || "",
      capacity: c.capacity || 0,
      personnel_count: c.personnelCount || 0,
      status: c.status || "Activo",
      states_detail: c.statesDetail || [],
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from("campamentos")
      .upsert(payload, { onConflict: "id" });
  }

  // Sincronizar automáticamente en la tabla dedicada pizarra_operacional
  await savePizarraOperacionalRecords(dateStr, camps);
}

/**
 * Verifica si ya existe un registro guardado para una fecha dada en `pizarra_operacional`
 */
export async function checkPizarraRecordExists(dateStr: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("pizarra_operacional")
      .select("id")
      .eq("record_date", dateStr)
      .maybeSingle();

    return !!data?.id;
  } catch {
    return false;
  }
}

/**
 * Sincroniza y comprime la Pizarra Operacional en 1 SOLA FILA POR DÍA en Supabase `pizarra_operacional`
 */
export async function savePizarraOperacionalRecords(dateStr: string, camps: CampamentoEntry[]): Promise<void> {
  try {
    let totalPersonnel = 0;
    const campsSummary = (camps || []).map((c) => {
      const activeStates = (c.statesDetail || []).filter((sd) => sd.officersCount > 0);
      const campTotal = activeStates.reduce((sum, sd) => sum + (Number(sd.officersCount) || 0), 0);
      totalPersonnel += campTotal;

      return {
        campId: c.id,
        campName: c.campName,
        personnelCount: campTotal,
        states: activeStates.map((sd) => ({
          stateName: sd.stateName,
          officersCount: Number(sd.officersCount) || 0,
          type: sd.type || getEntryType(sd.stateName),
        })),
      };
    });

    await supabase
      .from("pizarra_operacional")
      .upsert(
        {
          record_date: dateStr,
          total_personnel: totalPersonnel,
          camps_summary: campsSummary,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "record_date" }
      );
  } catch (err) {
    console.warn("Error syncing compressed record to pizarra_operacional table:", err);
  }
}

/**
 * Deletes a single campamento by ID from Supabase
 */
export async function deleteCampamento(campId: string): Promise<void> {
  try {
    const isUuid = campId && campId.length === 36 && campId.includes("-");
    if (isUuid) {
      await supabase.from("campamentos").delete().eq("id", campId);
    }
  } catch (err) {
    console.warn("Error deleting campamento from Supabase:", err);
  }
}

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

export const VENEZUELA_STATES: string[] = [
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
].sort((a, b) => a.localeCompare(b, "es"));

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
  localStorage.setItem(`op_bases_${dateStr}`, JSON.stringify(bases));

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
      const targetRows = dateFiltered.length > 0 ? dateFiltered : data;

      return targetRows.map((row: any) => ({
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
        })),
      }));
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
  localStorage.setItem(`camps_${dateStr}`, JSON.stringify(camps));

  try {
    const validUuids = camps
      .map((c) => c.id)
      .filter((id): id is string => !!(id && id.length === 36 && id.includes("-")));

    const { data: existingRows } = await supabase
      .from("campamentos")
      .select("id")
      .eq("date", dateStr);

    if (existingRows && existingRows.length > 0) {
      const toDelete = existingRows
        .map((r: any) => r.id)
        .filter((id: string) => !validUuids.includes(id));

      for (const idToDelete of toDelete) {
        await supabase.from("campamentos").delete().eq("id", idToDelete);
      }
    }
  } catch (err) {
    console.warn("Error cleaning up deleted campamentos:", err);
  }

  for (const c of camps) {
    const payload = {
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

    const isUuid = c.id && c.id.length === 36 && c.id.includes("-");
    if (isUuid) {
      await supabase.from("campamentos").update(payload).eq("id", c.id);
    } else {
      await supabase
        .from("campamentos")
        .insert(payload);
    }
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

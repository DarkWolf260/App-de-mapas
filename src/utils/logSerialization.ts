import type { DailyLog, GroupLogEntry, CustomActivity } from "../types";
import { getNormalizedGroupList } from "./featureLogBook";

export const CUSTOM_META_GROUP_ID = "__custom_meta__";

/**
 * Database serialization: Converts a database row to a typed DailyLog.
 * Handles JSONB groups, custom activities metadata, and field normalization.
 */
export function fromDatabaseRow(row: any): DailyLog {
  const rawGroups = Array.isArray(row.groups)
    ? row.groups
    : (typeof row.groups === "string" && row.groups.trim() ? JSON.parse(row.groups) : []);

  let parsedCustomActivities: CustomActivity[] = [];
  if (Array.isArray(row.custom_activities)) {
    parsedCustomActivities = [...row.custom_activities];
  } else if (typeof row.custom_activities === "string" && row.custom_activities.trim()) {
    try {
      parsedCustomActivities = JSON.parse(row.custom_activities);
    } catch {}
  } else if (Array.isArray(row.customActivities)) {
    parsedCustomActivities = [...row.customActivities];
  }

  const cleanGroups: GroupLogEntry[] = [];
  for (const g of rawGroups) {
    if (g.id === CUSTOM_META_GROUP_ID) {
      if (g.customActivities && Array.isArray(g.customActivities)) {
        for (const ca of g.customActivities) {
          if (!parsedCustomActivities.some((existing) => existing.id === ca.id || existing.name.toLowerCase() === ca.name.toLowerCase())) {
            parsedCustomActivities.push(ca);
          }
        }
      }
    } else {
      cleanGroups.push(g);
      if (g.customActivities && Array.isArray(g.customActivities)) {
        for (const ca of g.customActivities) {
          if (!parsedCustomActivities.some((existing) => existing.id === ca.id || existing.name.toLowerCase() === ca.name.toLowerCase())) {
            parsedCustomActivities.push(ca);
          }
        }
      }
    }
  }

  return {
    date: row.date,
    department: row.department,
    groups: cleanGroups,
    observations: row.observations || "",
    novedades: Array.isArray(row.novedades)
      ? row.novedades
      : (typeof row.novedades === "string" && row.novedades.trim() ? JSON.parse(row.novedades) : []),
    rescuedCount: row.rescued_count || "",
    recoveredCount: row.recovered_count || "",
    rescuedPetsCount: row.rescued_pets_count || "",
    prehospitalCareCount: row.prehospital_care_count || "",
    transfersCount: row.transfers_count || "",
    customActivities: parsedCustomActivities,
  };
}

/**
 * Database serialization: Converts a DailyLog to a row dictionary for Supabase.
 */
export function toDatabaseRow(featureId: number | string, log: DailyLog): Record<string, unknown> {
  const fidStr = String(featureId);
  const deptToUse = log.department || "pc";
  const groupsList = getNormalizedGroupList(log).filter((g) =>
    g.id !== CUSTOM_META_GROUP_ID &&
    !!(g.groupName?.trim() || g.officersCount?.trim() || g.unitOut?.trim() || g.managerName?.trim() ||
       g.departureTime?.trim() || g.arrivalTime?.trim() || g.managerPhone?.trim() ||
       g.rescuedCount?.trim() || g.recoveredCount?.trim() || g.rescuedPetsCount?.trim() ||
       g.prehospitalCareCount?.trim() || g.transfersCount?.trim() || g.edanCount?.trim() ||
       (g.customActivities && g.customActivities.length > 0))
  );

  // Las actividades personalizadas son propiedad exclusiva del Punto / Polígono (DailyLog),
  // y se almacenan dedicadas en el contenedor CUSTOM_META_GROUP_ID sin adjuntarse a los grupos de oficiales.
  if (log.customActivities && log.customActivities.length > 0) {
    groupsList.push({
      id: CUSTOM_META_GROUP_ID,
      groupName: "",
      customActivities: log.customActivities,
    });
  }

  return {
    feature_id: fidStr,
    date: log.date,
    department: deptToUse,
    groups: groupsList,
    observations: log.observations || "",
    novedades: log.novedades || [],
    rescued_count: log.rescuedCount || "",
    recovered_count: log.recoveredCount || "",
    rescued_pets_count: log.rescuedPetsCount || "",
    prehospital_care_count: log.prehospitalCareCount || "",
    transfers_count: log.transfersCount || "",
    updated_at: new Date().toISOString(),
  };
}

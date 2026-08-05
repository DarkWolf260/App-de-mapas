export type SortField = "groupName" | "pointTitle" | "unitOut" | "departureTime" | "arrivalTime" | "managerName" | "officersCount" | "hasArrived";
export type SortDirection = "asc" | "desc";

export const SORT_FIELDS: Array<{ field: SortField; label: string }> = [
  { field: "groupName", label: "Equipo" },
  { field: "pointTitle", label: "Ubicación" },
  { field: "unitOut", label: "Unidad" },
  { field: "departureTime", label: "Hora Salida" },
  { field: "arrivalTime", label: "Hora Llegada" },
  { field: "managerName", label: "Encargado" },
  { field: "officersCount", label: "Efectivos" },
  { field: "hasArrived", label: "Estado" },
];

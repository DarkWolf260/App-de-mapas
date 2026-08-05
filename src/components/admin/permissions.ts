import type { UserPermissions } from "../../services/adminUsersService";

export const PERM_DEFS: Array<{ key: keyof UserPermissions; label: string; desc: string }> = [
  { key: "edit_logs", label: "Editar registros (hoy)", desc: "Crear, editar y eliminar conteos y novedades de la fecha actual." },
  { key: "edit_historical_logs", label: "Editar registros históricos", desc: "Editar y eliminar conteos y novedades de fechas anteriores a hoy." },
  { key: "edit_map", label: "Editar elementos del mapa", desc: "Dibujar, editar y eliminar puntos, polígonos y sectores en el mapa." },
  { key: "manage_campamentos", label: "Gestionar campamentos", desc: "Crear y editar campamentos y la pizarra operacional." },
];

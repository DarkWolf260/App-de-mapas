import type { UserPermissions } from "../../services/adminUsersService";

export const PERM_DEFS: Array<{ key: keyof UserPermissions; label: string; desc: string }> = [
  { key: "edit_logs", label: "Editar registros (hoy)", desc: "Crear, editar y eliminar conteos y novedades de la fecha actual." },
  { key: "edit_historical_logs", label: "Editar registros históricos", desc: "Editar y eliminar conteos y novedades de fechas anteriores a hoy." },
  { key: "edit_map", label: "Editar elementos del mapa", desc: "Dibujar, editar y eliminar puntos, polígonos y sectores en el mapa." },
  { key: "manage_campamentos", label: "Gestionar campamentos / bases", desc: "Crear, renombrar y eliminar bases operacionales enteras." },
  { key: "manage_camp_entries", label: "Gestionar entradas de campamentos", desc: "Agregar, editar y eliminar entradas de personal en las bases para la fecha actual." },
];

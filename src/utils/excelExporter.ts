export interface WorkTeamExportRow {
  date: string;
  department: string;
  locationTitle: string;
  groupName: string;
  unitOut: string;
  departureTime: string;
  arrivalTime: string;
  managerName: string;
  managerPhone: string;
  officersCount: string;
  hasArrived: string;
}

/**
  Escapes a field value for CSV compliance.
 */
function escapeCSVField(val: string | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
  Exports an array of WorkTeamExportRow objects to a UTF-8 BOM CSV file recognized automatically by Excel.
 */
export function exportWorkTeamsToCSV(rows: WorkTeamExportRow[], dateStr: string): void {
  const headers = [
    "Fecha",
    "Departamento",
    "Ubicación de Trabajo",
    "Equipo de Trabajo",
    "Unidad / Vehículo",
    "Hora de Salida",
    "Hora de Llegada",
    "Encargado del Punto",
    "Teléfono de Contacto",
    "Funcionarios",
    "Estado",
  ];

  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.map(escapeCSVField).join(","));

  // Data rows
  for (const row of rows) {
    const line = [
      row.date,
      row.department,
      row.locationTitle,
      row.groupName,
      row.unitOut,
      row.departureTime,
      row.arrivalTime,
      row.managerName,
      row.managerPhone,
      row.officersCount,
      row.hasArrived,
    ].map(escapeCSVField).join(",");

    csvRows.push(line);
  }

  // Prepend UTF-8 BOM (\uFEFF) for Excel automatic UTF-8 detection
  const csvContent = "\uFEFF" + csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const sanitizedDate = (dateStr || "general").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Equipos_de_Trabajo_${sanitizedDate}.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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

// --- CRC32 Utility for uncompressed ZIP creation ---
function crc32(buf: Uint8Array): number {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ -1) >>> 0;
}

// --- Pure JS ZIP Packer (Store method) for native .xlsx generation ---
function createZip(files: Array<{ name: string; content: string }>): Uint8Array {
  const encoder = new TextEncoder();
  const entries: Array<{
    nameBytes: Uint8Array;
    contentBytes: Uint8Array;
    crc: number;
    offset: number;
  }> = [];

  let offset = 0;
  const localChunks: Uint8Array[] = [];

  for (const f of files) {
    const nameBytes = encoder.encode(f.name);
    const contentBytes = encoder.encode(f.content);
    const crc = crc32(contentBytes);
    const size = contentBytes.length;

    // Local Header (30 bytes + filename)
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true); // Local header signature
    view.setUint16(4, 20, true); // Version needed (2.0)
    view.setUint16(6, 0x0800, true); // General purpose bit flag (UTF-8)
    view.setUint16(8, 0, true); // Compression method (0 = Store)
    view.setUint16(10, 0, true); // Last mod time
    view.setUint16(12, 0, true); // Last mod date
    view.setUint32(14, crc, true); // CRC-32
    view.setUint32(18, size, true); // Compressed size
    view.setUint32(22, size, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true); // Filename length
    view.setUint16(28, 0, true); // Extra field length
    header.set(nameBytes, 30);

    entries.push({ nameBytes, contentBytes, crc, offset });
    localChunks.push(header);
    localChunks.push(contentBytes);

    offset += header.length + size;
  }

  const cdOffset = offset;
  const cdChunks: Uint8Array[] = [];

  for (const e of entries) {
    const header = new Uint8Array(46 + e.nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x02014b50, true); // Central directory header signature
    view.setUint16(4, 20, true); // Version made by
    view.setUint16(6, 20, true); // Version needed
    view.setUint16(8, 0x0800, true); // General purpose bit flag
    view.setUint16(10, 0, true); // Compression method
    view.setUint16(12, 0, true); // Last mod time
    view.setUint16(14, 0, true); // Last mod date
    view.setUint32(16, e.crc, true); // CRC-32
    view.setUint32(20, e.contentBytes.length, true); // Compressed size
    view.setUint32(24, e.contentBytes.length, true); // Uncompressed size
    view.setUint16(28, e.nameBytes.length, true); // Filename length
    view.setUint16(30, 0, true); // Extra field length
    view.setUint16(32, 0, true); // File comment length
    view.setUint16(34, 0, true); // Disk number start
    view.setUint16(36, 0, true); // Internal file attributes
    view.setUint32(38, 0, true); // External file attributes
    view.setUint32(42, e.offset, true); // Relative offset of local header
    header.set(e.nameBytes, 46);

    cdChunks.push(header);
    offset += header.length;
  }

  const cdSize = offset - cdOffset;

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
  eocdView.setUint16(4, 0, true); // Number of this disk
  eocdView.setUint16(6, 0, true); // Disk where central directory starts
  eocdView.setUint16(8, entries.length, true); // Number of central directory records on this disk
  eocdView.setUint16(10, entries.length, true); // Total number of central directory records
  eocdView.setUint32(12, cdSize, true); // Size of central directory
  eocdView.setUint32(16, cdOffset, true); // Offset of start of central directory
  eocdView.setUint16(20, 0, true); // ZIP comment length

  // Concatenate all chunks into final zip Uint8Array
  const totalLength = offset + 22;
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of localChunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }
  for (const chunk of cdChunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }
  result.set(eocd, pos);

  return result;
}

function escapeXML(str: string | undefined | null): string {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function colName(n: number): string {
  let s = "";
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

/**
  Exports WorkTeamExportRow data directly as a REAL binary OpenXML Excel file (.xlsx).
  Opens natively in Microsoft Excel with styled header background color, white bold text,
  cell borders, custom column widths, and 0 security warning popups.
 */
export function exportWorkTeamsToExcel(rows: WorkTeamExportRow[], dateStr: string): void {
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

  const colWidths = [14, 18, 26, 22, 18, 15, 15, 24, 20, 14, 15];

  // 1. [Content_Types].xml
  const contentTypesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  // 2. _rels/.rels
  const relsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  // 3. xl/workbook.xml
  const workbookXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Equipos de Trabajo" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  // 4. xl/_rels/workbook.xml.rels
  const workbookRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  // 5. xl/styles.xml
  const stylesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0284C7"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;

  // 6. xl/worksheets/sheet1.xml
  const colsXML = colWidths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join("\n    ");

  const headerCellsXML = headers
    .map((h, i) => `<c r="${colName(i)}1" t="inlineStr" s="1"><is><t>${escapeXML(h)}</t></is></c>`)
    .join("");

  const rowsXML = rows
    .map((r, rIdx) => {
      const rowNum = rIdx + 2;
      const styleId = rIdx % 2 === 0 ? "2" : "3";
      const cells = [
        r.date,
        r.department,
        r.locationTitle,
        r.groupName,
        r.unitOut,
        r.departureTime,
        r.arrivalTime,
        r.managerName,
        r.managerPhone,
        r.officersCount,
        r.hasArrived,
      ];

      const cXML = cells
        .map((val, cIdx) => `<c r="${colName(cIdx)}${rowNum}" t="inlineStr" s="${styleId}"><is><t>${escapeXML(val)}</t></is></c>`)
        .join("");

      return `<row r="${rowNum}" ht="20" customHeight="1">${cXML}</row>`;
    })
    .join("\n    ");

  const sheet1XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    ${colsXML}
  </cols>
  <sheetData>
    <row r="1" ht="26" customHeight="1">${headerCellsXML}</row>
    ${rowsXML}
  </sheetData>
</worksheet>`;

  // Bundle files into uncompressed .xlsx zip Uint8Array
  const zipBytes = createZip([
    { name: "[Content_Types].xml", content: contentTypesXML },
    { name: "_rels/.rels", content: relsXML },
    { name: "xl/workbook.xml", content: workbookXML },
    { name: "xl/_rels/workbook.xml.rels", content: workbookRelsXML },
    { name: "xl/styles.xml", content: stylesXML },
    { name: "xl/worksheets/sheet1.xml", content: sheet1XML },
  ]);

  const blob = new Blob([zipBytes.buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const sanitizedDate = (dateStr || "general").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Equipos_de_Trabajo_${sanitizedDate}.xlsx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Keep exportWorkTeamsToCSV as alias for backward compatibility
export const exportWorkTeamsToCSV = exportWorkTeamsToExcel;

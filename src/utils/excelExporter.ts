import {
  OperationalBase,
  DEFAULT_OPERATIONAL_BASES,
  DEFAULT_REDAN_REGIONS,
  getBaseTotal,
  getGrandTotal,
} from "../services/baseService";

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

// --- Pure JS ZIP Packer for native multi-sheet .xlsx generation ---
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
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, size, true);
    view.setUint32(22, size, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
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
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0x0800, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint16(14, 0, true);
    view.setUint32(16, e.crc, true);
    view.setUint32(20, e.contentBytes.length, true);
    view.setUint32(24, e.contentBytes.length, true);
    view.setUint16(28, e.nameBytes.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, e.offset, true);
    header.set(e.nameBytes, 46);

    cdChunks.push(header);
    offset += header.length;
  }

  const cdSize = offset - cdOffset;

  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, entries.length, true);
  eocdView.setUint16(10, entries.length, true);
  eocdView.setUint32(12, cdSize, true);
  eocdView.setUint32(16, cdOffset, true);
  eocdView.setUint16(20, 0, true);

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
 * Exports Operational Consolidado & Work Teams data as a REAL multi-sheet OpenXML Excel file (.xlsx).
 * Sheet 1: Consolidado Operativo (Matching the official operational board)
 * Sheet 2: Equipos de Trabajo (Detailed work teams list)
 */
export function exportConsolidadoToExcel(
  rows: WorkTeamExportRow[],
  dateStr: string,
  bases: OperationalBase[] = DEFAULT_OPERATIONAL_BASES
): void {
  // 1. [Content_Types].xml
  const contentTypesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  // 2. _rels/.rels
  const relsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  // 3. xl/workbook.xml (2 Worksheets: Consolidado Operativo & Equipos de Trabajo)
  const workbookXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Consolidado Operativo" sheetId="1" r:id="rId1"/>
    <sheet name="Equipos de Trabajo" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`;

  // 4. xl/_rels/workbook.xml.rels
  const workbookRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  // 5. xl/styles.xml
  const stylesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="13"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
  </fonts>
  <fills count="6">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0B1F52"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEA580C"/><bgColor indexed="64"/></patternFill></fill>
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
  <cellXfs count="6">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;

  // --- SHEET 1: Consolidado Operativo ---
  const sheet1Rows: string[] = [];

  // Main Header Banners
  sheet1Rows.push(`<row r="1" ht="28" customHeight="1"><c r="A1" t="inlineStr" s="1"><is><t>PROTECCIÓN CIVIL - CONSOLIDADO OPERATIVO Y UNIDADES (LA GUAIRA)</t></is></c></row>`);
  sheet1Rows.push(`<row r="2" ht="22" customHeight="1"><c r="A2" t="inlineStr" s="2"><is><t>FECHA: ${escapeXML(dateStr)} | REPORTE UNIFICADO DE PERSONAL, REDAN, AMBULANCIAS Y GRUPOS</t></is></c></row>`);
  sheet1Rows.push(`<row r="3" ht="12" customHeight="1"></row>`);

  // Section 1 Header
  sheet1Rows.push(`<row r="4" ht="22" customHeight="1"><c r="A4" t="inlineStr" s="3"><is><t>1. PERSONAL OPERATIVO Y UNIDADES / AMBULANCIAS POR BASE</t></is></c></row>`);

  // Build Bases Grid Headers & Data
  let curRow = 5;
  const baseHeaders: string[] = [];
  const baseSubtotals: { name: string; total: number }[] = [];

  bases.forEach((base, bIdx) => {
    const colA = colName(bIdx * 2);
    const colB = colName(bIdx * 2 + 1);
    baseHeaders.push(`<c r="${colA}${curRow}" t="inlineStr" s="3"><is><t>${escapeXML(base.baseName)}</t></is></c>`);
    baseHeaders.push(`<c r="${colB}${curRow}" t="inlineStr" s="3"><is><t>Cant.</t></is></c>`);
    baseSubtotals.push({ name: `Total ${base.baseName.replace("Base ", "")}`, total: getBaseTotal(base) });
  });

  sheet1Rows.push(`<row r="${curRow}" ht="24" customHeight="1">${baseHeaders.join("")}</row>`);
  curRow++;

  const maxItems = Math.max(...bases.map((b) => b.items.length), 1);
  for (let itemIdx = 0; itemIdx < maxItems; itemIdx++) {
    const itemCells: string[] = [];
    bases.forEach((base, bIdx) => {
      const colA = colName(bIdx * 2);
      const colB = colName(bIdx * 2 + 1);
      const item = base.items[itemIdx];
      if (item) {
        itemCells.push(`<c r="${colA}${curRow}" t="inlineStr" s="4"><is><t>${escapeXML(item.name)}</t></is></c>`);
        itemCells.push(`<c r="${colB}${curRow}" t="inlineStr" s="4"><is><t>${escapeXML(String(item.count))}</t></is></c>`);
      } else {
        itemCells.push(`<c r="${colA}${curRow}" t="inlineStr" s="4"><is><t></t></is></c>`);
        itemCells.push(`<c r="${colB}${curRow}" t="inlineStr" s="4"><is><t></t></is></c>`);
      }
    });
    sheet1Rows.push(`<row r="${curRow}" ht="20" customHeight="1">${itemCells.join("")}</row>`);
    curRow++;
  }

  // Base Subtotals Row
  const subtotalCells: string[] = [];
  baseSubtotals.forEach((st, bIdx) => {
    const colA = colName(bIdx * 2);
    const colB = colName(bIdx * 2 + 1);
    subtotalCells.push(`<c r="${colA}${curRow}" t="inlineStr" s="5"><is><t>${escapeXML(st.name)}</t></is></c>`);
    subtotalCells.push(`<c r="${colB}${curRow}" t="inlineStr" s="5"><is><t>${st.total}</t></is></c>`);
  });
  sheet1Rows.push(`<row r="${curRow}" ht="22" customHeight="1">${subtotalCells.join("")}</row>`);
  curRow++;

  // Grand Total Row
  const grandTotal = getGrandTotal(bases);
  sheet1Rows.push(`<row r="${curRow}" ht="24" customHeight="1"><c r="A${curRow}" t="inlineStr" s="2"><is><t>TOTAL GENERAL DE PERSONAL EN EL ESTADO LA GUAIRA: ${grandTotal}</t></is></c></row>`);
  curRow += 2;

  // Section 2: REDAN Consolidation Table
  sheet1Rows.push(`<row r="${curRow}" ht="22" customHeight="1"><c r="A${curRow}" t="inlineStr" s="3"><is><t>2. CONSOLIDADO Y DESGLOSE POR REDAN (REGIONES ESTRATÉGICAS)</t></is></c></row>`);
  curRow++;

  sheet1Rows.push(`<row r="${curRow}" ht="22" customHeight="1">
    <c r="A${curRow}" t="inlineStr" s="3"><is><t>REDAN / Región</t></is></c>
    <c r="B${curRow}" t="inlineStr" s="3"><is><t>Estados / Componentes Integrantes</t></is></c>
    <c r="C${curRow}" t="inlineStr" s="3"><is><t>Total Personal</t></is></c>
  </row>`);
  curRow++;

  let redanGrandTotal = 0;
  DEFAULT_REDAN_REGIONS.forEach((r, idx) => {
    const styleId = idx % 2 === 0 ? "4" : "5";
    redanGrandTotal += r.totalPersonal;
    sheet1Rows.push(`<row r="${curRow}" ht="20" customHeight="1">
      <c r="A${curRow}" t="inlineStr" s="${styleId}"><is><t>${escapeXML(r.redan)}</t></is></c>
      <c r="B${curRow}" t="inlineStr" s="${styleId}"><is><t>${escapeXML(r.components)}</t></is></c>
      <c r="C${curRow}" t="inlineStr" s="${styleId}"><is><t>${r.totalPersonal}</t></is></c>
    </row>`);
    curRow++;
  });

  sheet1Rows.push(`<row r="${curRow}" ht="24" customHeight="1">
    <c r="A${curRow}" t="inlineStr" s="2"><is><t>TOTAL GENERAL DE TODAS LAS REDAN</t></is></c>
    <c r="B${curRow}" t="inlineStr" s="2"><is><t></t></is></c>
    <c r="C${curRow}" t="inlineStr" s="2"><is><t>${redanGrandTotal}</t></is></c>
  </row>`);

  const sheet1XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="30" customWidth="1"/>
    <col min="2" max="2" width="50" customWidth="1"/>
    <col min="3" max="3" width="20" customWidth="1"/>
    <col min="4" max="10" width="22" customWidth="1"/>
  </cols>
  <sheetData>
    ${sheet1Rows.join("\n    ")}
  </sheetData>
</worksheet>`;

  // --- SHEET 2: Equipos de Trabajo ---
  const headers2 = [
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

  const colWidths2 = [14, 18, 26, 22, 18, 15, 15, 24, 20, 14, 15];

  const cols2XML = colWidths2
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join("\n    ");

  const headerCells2XML = headers2
    .map((h, i) => `<c r="${colName(i)}1" t="inlineStr" s="3"><is><t>${escapeXML(h)}</t></is></c>`)
    .join("");

  const rows2XML = rows
    .map((r, rIdx) => {
      const rowNum = rIdx + 2;
      const styleId = rIdx % 2 === 0 ? "4" : "5";
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

  const sheet2XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    ${cols2XML}
  </cols>
  <sheetData>
    <row r="1" ht="26" customHeight="1">${headerCells2XML}</row>
    ${rows2XML}
  </sheetData>
</worksheet>`;

  // Bundle into multi-sheet .xlsx zip Uint8Array
  const zipBytes = createZip([
    { name: "[Content_Types].xml", content: contentTypesXML },
    { name: "_rels/.rels", content: relsXML },
    { name: "xl/workbook.xml", content: workbookXML },
    { name: "xl/_rels/workbook.xml.rels", content: workbookRelsXML },
    { name: "xl/styles.xml", content: stylesXML },
    { name: "xl/worksheets/sheet1.xml", content: sheet1XML },
    { name: "xl/worksheets/sheet2.xml", content: sheet2XML },
  ]);

  const blob = new Blob([zipBytes.buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const sanitizedDate = (dateStr || "general").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Consolidado_Operativo_${sanitizedDate}.xlsx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Aliases for compatibility
export const exportWorkTeamsToExcel = exportConsolidadoToExcel;
export const exportWorkTeamsToCSV = exportConsolidadoToExcel;

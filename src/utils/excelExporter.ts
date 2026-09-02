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

// --- CRC32 ---
function crc32(buf: Uint8Array): number {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) { crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); }
  }
  return (crc ^ -1) >>> 0;
}

// --- ZIP packer ---
function createZip(files: Array<{ name: string; content: string }>): Uint8Array {
  const enc = new TextEncoder();
  const entries: Array<{ nb: Uint8Array; cb: Uint8Array; crc: number; off: number }> = [];
  let offset = 0;
  const local: Uint8Array[] = [];
  for (const f of files) {
    const nb = enc.encode(f.name);
    const cb = enc.encode(f.content);
    const crc = crc32(cb);
    const hdr = new Uint8Array(30 + nb.length);
    const v = new DataView(hdr.buffer);
    v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x0800, true);
    v.setUint32(14, crc, true); v.setUint32(18, cb.length, true); v.setUint32(22, cb.length, true);
    v.setUint16(26, nb.length, true); hdr.set(nb, 30);
    entries.push({ nb, cb, crc, off: offset });
    local.push(hdr); local.push(cb);
    offset += hdr.length + cb.length;
  }
  const cdOff = offset;
  const cd: Uint8Array[] = [];
  for (const e of entries) {
    const hdr = new Uint8Array(46 + e.nb.length);
    const v = new DataView(hdr.buffer);
    v.setUint32(0, 0x02014b50, true); v.setUint16(4, 20, true); v.setUint16(6, 20, true);
    v.setUint16(8, 0x0800, true); v.setUint32(16, e.crc, true);
    v.setUint32(20, e.cb.length, true); v.setUint32(24, e.cb.length, true);
    v.setUint16(28, e.nb.length, true); v.setUint32(42, e.off, true);
    hdr.set(e.nb, 46); cd.push(hdr); offset += hdr.length;
  }
  const cdSize = offset - cdOff;
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true); ev.setUint32(12, cdSize, true); ev.setUint32(16, cdOff, true);
  const total = offset + 22;
  const res = new Uint8Array(total);
  let pos = 0;
  for (const c of local) { res.set(c, pos); pos += c.length; }
  for (const c of cd) { res.set(c, pos); pos += c.length; }
  res.set(eocd, pos);
  return res;
}

function escapeXML(s: string | undefined | null): string {
  if (!s) return "";
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}

function C(ref: string, val: string, s: number): string {
  return `<c r="${ref}" t="inlineStr" s="${s}"><is><t>${escapeXML(val)}</t></is></c>`;
}

function M(a: string, b: string): string { return `<mergeCell ref="${a}:${b}"/>`; }

/**
 * Exports ONLY the Consolidado de Equipos de Trabajo table as a native, styled .xlsx
 */
export function exportConsolidadoToExcel(
  rows: WorkTeamExportRow[],
  dateStr: string,
  _camps: any[] = []
): void {
  // Styles definitions:
  // s0=default, s1=title(navy/white/large), s2=subtitle(orange/white/centered),
  // s3=col hdr center, s4=col hdr left,
  // s5=data even left, s6=data odd left,
  // s7=data even center, s8=data odd center,
  // s9=total banner(navy/white/left), s10=total number(navy/white/center)
  const stylesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="5">
    <font><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
    <font><b/><sz val="14"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
    <font><sz val="10"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
  </fonts>
  <fills count="6">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0B1F52"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEA580C"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>
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
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="11">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;

  const totalOfficers = rows.reduce((sum, r) => sum + (parseInt(r.officersCount || "0", 10) || 0), 0);

  const sheetRows: string[] = [];
  const merges: string[] = [];
  let r = 1;

  // 1. Title Row
  merges.push(M(`A${r}`, `J${r}`));
  sheetRows.push(`<row r="${r}" ht="30" customHeight="1">${C(`A${r}`, "COE LA GUAIRA — CONSOLIDADO DE EQUIPOS DE TRABAJO", 1)}</row>`);
  r++;

  // 2. Subtitle Row
  merges.push(M(`A${r}`, `J${r}`));
  sheetRows.push(`<row r="${r}" ht="20" customHeight="1">${C(`A${r}`, `FECHA: ${dateStr || "GENERAL"} | TOTAL EQUIPOS: ${rows.length} | TOTAL EFECTIVOS: ${totalOfficers}`, 2)}</row>`);
  r++;

  // Spacer
  sheetRows.push(`<row r="${r}" ht="6" customHeight="1"></row>`);
  r++;

  // 3. Table Column Headers
  sheetRows.push(
    `<row r="${r}" ht="26" customHeight="1">` +
    C(`A${r}`, "Organismo", 3) +
    C(`B${r}`, "Equipo de Trabajo", 4) +
    C(`C${r}`, "Ubicación / Punto", 4) +
    C(`D${r}`, "Unidad / Vehículo", 4) +
    C(`E${r}`, "H. Salida", 3) +
    C(`F${r}`, "H. Llegada", 3) +
    C(`G${r}`, "Encargado del Punto", 4) +
    C(`H${r}`, "Teléfono", 3) +
    C(`I${r}`, "Efectivos", 3) +
    C(`J${r}`, "Estado", 3) +
    `</row>`
  );
  r++;

  // 4. Data Rows
  if (rows.length === 0) {
    merges.push(M(`A${r}`, `J${r}`));
    sheetRows.push(`<row r="${r}" ht="22" customHeight="1">${C(`A${r}`, "No hay equipos de trabajo registrados para la fecha seleccionada.", 5)}</row>`);
    r++;
  } else {
    rows.forEach((t, idx) => {
      const alt = idx % 2 === 1;
      const sLeft = alt ? 6 : 5;
      const sCenter = alt ? 8 : 7;
      const deptLabel = t.department && (t.department.toLowerCase().includes("bombero") || t.department === "bomberos")
        ? "Bomberos"
        : "Protección Civil";

      const estadoLabel = t.hasArrived === "Sí" || t.hasArrived === "true" || t.hasArrived === "En base"
        ? "En base"
        : "Desplegado";

      sheetRows.push(
        `<row r="${r}" ht="20" customHeight="1">` +
        C(`A${r}`, deptLabel, sCenter) +
        C(`B${r}`, t.groupName, sLeft) +
        C(`C${r}`, t.locationTitle, sLeft) +
        C(`D${r}`, t.unitOut || "-", sLeft) +
        C(`E${r}`, t.departureTime || "-", sCenter) +
        C(`F${r}`, t.arrivalTime || "-", sCenter) +
        C(`G${r}`, t.managerName || "-", sLeft) +
        C(`H${r}`, t.managerPhone || "-", sCenter) +
        C(`I${r}`, String(parseInt(t.officersCount || "0", 10) || 0), sCenter) +
        C(`J${r}`, estadoLabel, sCenter) +
        `</row>`
      );
      r++;
    });
  }

  // 5. Total Summary Row
  merges.push(M(`A${r}`, `H${r}`));
  sheetRows.push(
    `<row r="${r}" ht="24" customHeight="1">` +
    C(`A${r}`, `TOTAL GENERAL DE EFECTIVOS (${rows.length} EQUIPOS)`, 9) +
    C(`I${r}`, String(totalOfficers), 10) +
    C(`J${r}`, "", 9) +
    `</row>`
  );

  // Column widths definition
  const colsXML = [
    `<col min="1" max="1" width="16" customWidth="1"/>`,  // Organismo
    `<col min="2" max="2" width="24" customWidth="1"/>`,  // Equipo
    `<col min="3" max="3" width="30" customWidth="1"/>`,  // Ubicación
    `<col min="4" max="4" width="24" customWidth="1"/>`,  // Unidad
    `<col min="5" max="5" width="12" customWidth="1"/>`,  // H. Salida
    `<col min="6" max="6" width="12" customWidth="1"/>`,  // H. Llegada
    `<col min="7" max="7" width="24" customWidth="1"/>`,  // Encargado
    `<col min="8" max="8" width="16" customWidth="1"/>`,  // Teléfono
    `<col min="9" max="9" width="12" customWidth="1"/>`,  // Efectivos
    `<col min="10" max="10" width="15" customWidth="1"/>`, // Estado
  ];

  const mergesXML = merges.length > 0
    ? `<mergeCells count="${merges.length}">${merges.join("")}</mergeCells>`
    : "";

  const sheetXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${colsXML.join("")}</cols>
  <sheetData>
    ${sheetRows.join("\n    ")}
  </sheetData>
  ${mergesXML}
</worksheet>`;

  const contentTypesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;
  const relsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const workbookXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Consolidado de Equipos" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const workbookRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

  const zipBytes = createZip([
    { name: "[Content_Types].xml", content: contentTypesXML },
    { name: "_rels/.rels", content: relsXML },
    { name: "xl/workbook.xml", content: workbookXML },
    { name: "xl/_rels/workbook.xml.rels", content: workbookRelsXML },
    { name: "xl/styles.xml", content: stylesXML },
    { name: "xl/worksheets/sheet1.xml", content: sheetXML },
  ]);

  const blob = new Blob([zipBytes.buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const sanitizedDate = (dateStr || "general").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Consolidado_Operativo_${sanitizedDate}.xlsx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 250);
}

export const exportWorkTeamsToExcel = exportConsolidadoToExcel;
export const exportWorkTeamsToCSV = exportConsolidadoToExcel;

import { CampamentoEntry, StatePersonnelCount } from "../services/baseService";
import { REDAN_REGIONS } from "../data/redanStructure";

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

function colName(n: number): string {
  let s = "";
  while (n >= 0) { s = String.fromCharCode((n % 26) + 65) + s; n = Math.floor(n / 26) - 1; }
  return s;
}

function C(ref: string, val: string, s: number): string {
  return `<c r="${ref}" t="inlineStr" s="${s}"><is><t>${escapeXML(val)}</t></is></c>`;
}

function M(a: string, b: string): string { return `<mergeCell ref="${a}:${b}"/>`; }

/**
 * Exports the full Consolidado Operativo report as a styled .xlsx
 */
export function exportConsolidadoToExcel(
  rows: WorkTeamExportRow[],
  dateStr: string,
  camps: CampamentoEntry[] = []
): void {
  // ------- styles -------
  // s0=default, s1=title(navy/white/large), s2=subtitle(orange/white/centered),
  // s3=section hdr(orange/white/left), s4=col hdr(navy/white/center/wrap),
  // s5=data even(white/dark/left/wrap), s6=data odd(gray/dark/left/wrap),
  // s7=total row(navy/white/left), s8=grand total(red/white/left),
  // s9=num even(white/dark/center), s10=num odd(gray/dark/center),
  // s11=num total(navy/white/center), s12=num grand(red/white/center),
  // s13=bottom orange(orange/white/large/center), s14=bottom navy(navy/white/large/center)
  const stylesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="5">
    <font><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
    <font><b/><sz val="14"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
    <font><b/><sz val="20"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  </fonts>
  <fills count="8">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0B1F52"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEA580C"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFC0392B"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/><bgColor indexed="64"/></patternFill></fill>
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
  <cellXfs count="15">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;

  // ------- data model -------
  const sortedCamps = [...camps].sort((a, b) => a.campName.localeCompare(b.campName, "es"));

  const stateTotalsMap = new Map<string, number>();
  sortedCamps.forEach(camp => {
    (camp.statesDetail || []).forEach((sd: StatePersonnelCount) => {
      stateTotalsMap.set(sd.stateName, (stateTotalsMap.get(sd.stateName) || 0) + (Number(sd.officersCount) || 0));
    });
  });

  const grandTotal = sortedCamps.reduce(
    (sum, c) => sum + (c.statesDetail || []).reduce((s, sd) => s + (Number(sd.officersCount) || 0), 0), 0
  );

  // Only states that have at least one officer across all camps
  const activeStatesSet = new Set<string>();
  sortedCamps.forEach(c => {
    (c.statesDetail || []).forEach(sd => {
      const cnt = parseInt(String(sd.officersCount ?? 0), 10);
      if (sd.stateName && sd.stateName !== "-" && cnt > 0) {
        activeStatesSet.add(sd.stateName);
      }
    });
  });
  const activeStates = Array.from(activeStatesSet).sort((a, b) => a.localeCompare(b, "es"));

  // REDAN totals
  const redanRows = REDAN_REGIONS.map(r => ({
    name: r.name,
    components: r.states.map(st => `${st.replace("PC ", "")} (${stateTotalsMap.get(st) || 0})`).join(", "),
    total: r.states.reduce((s, st) => s + (stateTotalsMap.get(st) || 0), 0),
  }));
  const redanGrandTotal = redanRows.reduce((s, r) => s + r.total, 0);

  // ------- layout: columns -------
  // Section 1: 2 cols per camp (name + cant), no shared state col
  // Sections 2-4 + summary span the full width
  const numCamps = sortedCamps.length;
  // Total width: 2 cols per camp, min 10 total for other sections
  const totalCols = Math.max(numCamps * 2, 10);
  const LAST = colName(totalCols - 1);

  const sheetRows: string[] = [];
  const merges: string[] = [];
  let r = 1;

  function addMerge(a: string, b: string) { if (a !== b) merges.push(M(a, b)); }
  function fullMerge(row: number) { addMerge(`A${row}`, `${LAST}${row}`); }

  // ---- TITLE ----
  fullMerge(r);
  sheetRows.push(`<row r="${r}" ht="32" customHeight="1">${C(`A${r}`, "PROTECCIÓN CIVIL - CONSOLIDADO OPERATIVO Y UNIDADES (LA GUAIRA)", 1)}</row>`);
  r++;

  // ---- SUBTITLE ----
  fullMerge(r);
  sheetRows.push(`<row r="${r}" ht="20" customHeight="1">${C(`A${r}`, `FECHA: ${dateStr} | REPORTE UNIFICADO DE PERSONAL, REDAN, AMBULANCIAS Y GRUPOS`, 2)}</row>`);
  r++;

  // ---- SPACER ----
  sheetRows.push(`<row r="${r}" ht="8" customHeight="1"></row>`); r++;

  // ================================================================
  // SECTION 1 — Personnel by base (states as rows, bases as cols)
  // ================================================================
  fullMerge(r);
  sheetRows.push(`<row r="${r}" ht="22" customHeight="1">${C(`A${r}`, "1. PERSONAL OPERATIVO Y UNIDADES / AMBULANCIAS POR BASE", 3)}</row>`);
  r++;

  // Column headers: [Base1 Name | Cant.] [Base2 Name | Cant.] ...
  // No shared "Estado" column — each base lists its own states independently
  {
    const hCells: string[] = [];
    sortedCamps.forEach((camp, ci) => {
      const bCol = colName(ci * 2);
      const cCol = colName(ci * 2 + 1);
      hCells.push(C(`${bCol}${r}`, camp.campName, 4));
      hCells.push(C(`${cCol}${r}`, "Cant.", 4));
    });
    sheetRows.push(`<row r="${r}" ht="26" customHeight="1">${hCells.join("")}</row>`);
    r++;
  }

  // Build per-base active state lists (only states with count > 0, sorted, no units)
  const perCampStates = sortedCamps.map(camp =>
    (camp.statesDetail || [])
      .filter(sd => sd.stateName && sd.stateName !== "-" && parseInt(String(sd.officersCount ?? 0), 10) > 0)
      .sort((a, b) => a.stateName.localeCompare(b.stateName, "es"))
  );

  const maxRows = Math.max(...perCampStates.map(s => s.length), 1);

  for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
    const alt = rowIdx % 2 === 1;
    const sData = alt ? 6 : 5;
    const sNum = alt ? 10 : 9;
    const cells: string[] = [];
    sortedCamps.forEach((_camp, ci) => {
      const bCol = colName(ci * 2);
      const cCol = colName(ci * 2 + 1);
      const sd = perCampStates[ci][rowIdx];
      if (sd) {
        cells.push(C(`${bCol}${r}`, sd.stateName, sData));
        cells.push(C(`${cCol}${r}`, String(parseInt(String(sd.officersCount ?? 0), 10)), sNum));
      } else {
        cells.push(C(`${bCol}${r}`, "", sData));
        cells.push(C(`${cCol}${r}`, "", sNum));
      }
    });
    sheetRows.push(`<row r="${r}" ht="20" customHeight="1">${cells.join("")}</row>`);
    r++;
  }

  // Per-base totals row
  {
    const tCells: string[] = [];
    sortedCamps.forEach((camp, ci) => {
      const bCol = colName(ci * 2);
      const cCol = colName(ci * 2 + 1);
      const campTotal = (camp.statesDetail || []).reduce((s, sd) => s + (parseInt(String(sd.officersCount ?? 0), 10)), 0);
      tCells.push(C(`${bCol}${r}`, `Total ${camp.campName.replace("Base ", "")}`, 7));
      tCells.push(C(`${cCol}${r}`, String(campTotal), 11));
    });
    sheetRows.push(`<row r="${r}" ht="22" customHeight="1">${tCells.join("")}</row>`);
    r++;
  }

  // Grand total row — span A to second-to-last col, value in last col
  const grandLabelEnd = colName(totalCols - 2);
  addMerge(`A${r}`, `${grandLabelEnd}${r}`);
  sheetRows.push(
    `<row r="${r}" ht="26" customHeight="1">` +
    C(`A${r}`, "TOTAL GENERAL DE PERSONAL EN EL ESTADO LA GUAIRA", 8) +
    C(`${LAST}${r}`, String(grandTotal), 12) +
    `</row>`
  );
  r++;

  sheetRows.push(`<row r="${r}" ht="8" customHeight="1"></row>`); r++;

  // ================================================================
  // SECTION 2 — REDAN
  // ================================================================
  fullMerge(r);
  sheetRows.push(`<row r="${r}" ht="22" customHeight="1">${C(`A${r}`, "2. CONSOLIDADO Y DESGLOSE POR REDAN (REGIONES ESTRATÉGICAS)", 3)}</row>`);
  r++;

  // REDAN headers: col A = name, col B..penultimate = components, col LAST = total
  const redanNameEnd = "A";
  const redanCompStart = "B";
  const redanCompEnd = grandLabelEnd;
  addMerge(`${redanCompStart}${r}`, `${redanCompEnd}${r}`);
  sheetRows.push(
    `<row r="${r}" ht="22" customHeight="1">` +
    C(`A${r}`, "REDAN / Región", 4) +
    C(`${redanCompStart}${r}`, "Estados / Componentes Integrantes", 4) +
    C(`${LAST}${r}`, "Total Personal", 4) +
    `</row>`
  );
  r++;

  redanRows.forEach((rr, ri) => {
    const alt = ri % 2 === 1;
    addMerge(`${redanCompStart}${r}`, `${redanCompEnd}${r}`);
    sheetRows.push(
      `<row r="${r}" ht="20" customHeight="1">` +
      C(`A${r}`, rr.name, alt ? 6 : 5) +
      C(`${redanCompStart}${r}`, rr.components, alt ? 6 : 5) +
      C(`${LAST}${r}`, String(rr.total), alt ? 10 : 9) +
      `</row>`
    );
    r++;
  });

  addMerge(`A${r}`, `${redanCompEnd}${r}`);
  sheetRows.push(
    `<row r="${r}" ht="24" customHeight="1">` +
    C(`A${r}`, "TOTAL GENERAL DE TODAS LAS REDAN", 8) +
    C(`${LAST}${r}`, String(redanGrandTotal), 12) +
    `</row>`
  );
  r++;

  sheetRows.push(`<row r="${r}" ht="8" customHeight="1"></row>`); r++;

  // ================================================================
  // SECTION 3 — Work Teams
  // ================================================================
  fullMerge(r);
  sheetRows.push(`<row r="${r}" ht="22" customHeight="1">${C(`A${r}`, "3. GRUPOS DE TRABAJO, OPP Y UNIDADES / AMBULANCIAS ASIGNADAS", 3)}</row>`);
  r++;

  // Fixed columns: A=Grupo, B=Zona, C=H.Salida, D=H.Llegada, E=Lider, F=Tel,
  //                G..penultimate-1=Unidades, penultimate=Funcionarios, LAST=Estado
  const wt_A = "A", wt_B = "B", wt_C = "C", wt_D = "D", wt_E = "E", wt_F = "F";
  const wt_G = "G";
  const wt_FUNC = colName(totalCols - 2); // second-to-last col
  const wt_Gend = colName(totalCols - 3); // end of merged "Unidades" span
  addMerge(`${wt_G}${r}`, `${wt_Gend}${r}`);
  sheetRows.push(
    `<row r="${r}" ht="26" customHeight="1">` +
    C(`${wt_A}${r}`, "Equipo de Trabajo", 4) +
    C(`${wt_B}${r}`, "Ubicación / Punto", 4) +
    C(`${wt_C}${r}`, "H. Salida", 4) +
    C(`${wt_D}${r}`, "H. Llegada", 4) +
    C(`${wt_E}${r}`, "Encargado del Punto", 4) +
    C(`${wt_F}${r}`, "Teléfono", 4) +
    C(`${wt_G}${r}`, "Unidades, Ambulancias Asignadas y Componentes", 4) +
    C(`${wt_FUNC}${r}`, "Funcionarios", 4) +
    C(`${LAST}${r}`, "Estado", 4) +
    `</row>`
  );
  r++;

  rows.forEach((t, ti) => {
    const alt = ti % 2 === 1;
    const s = alt ? 6 : 5;
    const sn = alt ? 10 : 9;
    addMerge(`${wt_G}${r}`, `${wt_Gend}${r}`);
    sheetRows.push(
      `<row r="${r}" ht="20" customHeight="1">` +
      C(`${wt_A}${r}`, t.groupName, s) +
      C(`${wt_B}${r}`, t.locationTitle, s) +
      C(`${wt_C}${r}`, t.departureTime, s) +
      C(`${wt_D}${r}`, t.arrivalTime, s) +
      C(`${wt_E}${r}`, t.managerName, s) +
      C(`${wt_F}${r}`, t.managerPhone, s) +
      C(`${wt_G}${r}`, t.unitOut, s) +
      C(`${wt_FUNC}${r}`, t.officersCount, sn) +
      C(`${LAST}${r}`, t.hasArrived === "Sí" ? "En base" : "Desplegado", s) +
      `</row>`
    );
    r++;
  });

  sheetRows.push(`<row r="${r}" ht="8" customHeight="1"></row>`); r++;

  // ================================================================
  // SECTION 4 — Emergency Contacts
  // ================================================================
  fullMerge(r);
  sheetRows.push(`<row r="${r}" ht="22" customHeight="1">${C(`A${r}`, "4. CONTACTOS DE EMERGENCIA Y APOYO INSTITUCIONAL", 3)}</row>`);
  r++;

  const third = Math.floor(totalCols / 3);
  const cA1 = "A", cA2 = colName(third - 1);
  const cB1 = colName(third), cB2 = colName(third * 2 - 1);
  const cC1 = colName(third * 2), cC2 = LAST;
  addMerge(`${cA1}${r}`, `${cA2}${r}`);
  addMerge(`${cB1}${r}`, `${cB2}${r}`);
  addMerge(`${cC1}${r}`, `${cC2}${r}`);
  sheetRows.push(
    `<row r="${r}" ht="22" customHeight="1">` +
    C(`${cA1}${r}`, "Dependencia / Institución", 4) +
    C(`${cB1}${r}`, "Responsable / Encargado", 4) +
    C(`${cC1}${r}`, "Teléfono de Contacto", 4) +
    `</row>`
  );
  r++;

  const contacts = [
    ["SENAMECF", "Dr. Roberto González", "0414-2320808"],
    ["Jefatura de Transporte", "Coordinación Operativa", "0424-2116866"],
    ["Ambulancias Emergencia", "Central de Despacho", "0424-2637388"],
    ["CPCII Juan Lagos", "Comisión Operativa", "0422-6318317"],
    ["CPCII William Guacarán", "Comisión Operativa", "0426-5851085"],
  ];
  contacts.forEach(([dep, resp, tel], ci) => {
    const alt = ci % 2 === 1;
    const s = alt ? 6 : 5;
    addMerge(`${cA1}${r}`, `${cA2}${r}`);
    addMerge(`${cB1}${r}`, `${cB2}${r}`);
    addMerge(`${cC1}${r}`, `${cC2}${r}`);
    sheetRows.push(
      `<row r="${r}" ht="20" customHeight="1">` +
      C(`${cA1}${r}`, dep, s) +
      C(`${cB1}${r}`, resp, s) +
      C(`${cC1}${r}`, tel, s) +
      `</row>`
    );
    r++;
  });

  sheetRows.push(`<row r="${r}" ht="8" customHeight="1"></row>`); r++;

  // ================================================================
  // BOTTOM SUMMARY
  // ================================================================
  const half = Math.floor(totalCols / 2);
  const leftEnd = colName(half - 1);
  const rightStart = colName(half);
  addMerge(`A${r}`, `${leftEnd}${r}`);
  addMerge(`${rightStart}${r}`, `${LAST}${r}`);
  sheetRows.push(
    `<row r="${r}" ht="26" customHeight="1">` +
    C(`A${r}`, "PERSONAL DIARIO - PC", 13) +
    C(`${rightStart}${r}`, "PERSONAL DIARIO - BOMBEROS", 14) +
    `</row>`
  );
  r++;
  addMerge(`A${r}`, `${leftEnd}${r}`);
  addMerge(`${rightStart}${r}`, `${LAST}${r}`);
  sheetRows.push(
    `<row r="${r}" ht="40" customHeight="1">` +
    C(`A${r}`, String(grandTotal), 13) +
    C(`${rightStart}${r}`, "", 14) +
    `</row>`
  );

  // ================================================================
  // Column widths
  // ================================================================
  const colsXML: string[] = [];
  colsXML.push(`<col min="1" max="1" width="30" customWidth="1"/>`);
  for (let ci = 0; ci < numCamps; ci++) {
    colsXML.push(`<col min="${2 + ci * 2}" max="${2 + ci * 2}" width="24" customWidth="1"/>`);
    colsXML.push(`<col min="${3 + ci * 2}" max="${3 + ci * 2}" width="9" customWidth="1"/>`);
  }
  // Ensure we have at least 10 cols defined
  if (1 + numCamps * 2 < 10) {
    colsXML.push(`<col min="${2 + numCamps * 2}" max="10" width="12" customWidth="1"/>`);
  }

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
  const workbookXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Consolidado Operativo" sheetId="1" r:id="rId1"/></sheets></workbook>`;
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
  link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  document.body.removeChild(link);
  // Delay revocation so the browser has time to initiate the download
  setTimeout(() => URL.revokeObjectURL(url), 250);
}

export const exportWorkTeamsToExcel = exportConsolidadoToExcel;
export const exportWorkTeamsToCSV = exportConsolidadoToExcel;

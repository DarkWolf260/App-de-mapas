import React, { useState, useCallback } from "react";
import type { DrawnFeature } from "../App";
import { X, Calendar, Phone, Truck, ShieldAlert, ChevronDown, ChevronUp, Users, Save, MapPin } from "lucide-react";

type DailyLog = {
  date: string;
  groupName: string;
  managerName: string;
  managerPhone: string;
  unitOut: string;
  departureTime?: string;
  arrivalTime?: string;
  officersCount?: string;
  rescuedCount?: string;
  recoveredCount?: string;
  groupName2?: string;
  managerName2?: string;
  managerPhone2?: string;
  unitOut2?: string;
  departureTime2?: string;
  arrivalTime2?: string;
  officersCount2?: string;
  rescuedCount2?: string;
  recoveredCount2?: string;
  hasArrivedG1?: boolean;
  hasArrivedG2?: boolean;
  observations?: string;
};

interface RangeReportModalProps {
  feat: DrawnFeature | "all" | null;
  allFeatures?: DrawnFeature[];
  onClose: () => void;
  onSaveDailyLog?: (featureId: number, log: DailyLog) => Promise<void>;
}

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: "5px",
  color: "var(--text-main)",
  fontSize: "0.68rem",
  padding: "4px 7px",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "0.56rem",
  color: "var(--text-muted)",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  marginBottom: "3px",
  display: "block",
};

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function formatDateFriendly(dateStr: string) {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const monthIndex = parseInt(parts[1], 10) - 1;
  return `${parts[2]} ${MONTHS[monthIndex]}`;
}

function getDatesRange(startStr: string): string[] {
  const dates: string[] = [];
  const start = new Date(startStr + "T00:00:00");
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  let current = new Date(start);
  while (current <= end) {
    dates.push(current.toLocaleDateString("en-CA"));
    current.setDate(current.getDate() + 1);
  }
  return dates.reverse();
}

function emptyLog(date: string): DailyLog {
  return {
    date,
    groupName: "",
    managerName: "",
    managerPhone: "",
    unitOut: "",
    departureTime: "",
    arrivalTime: "",
    officersCount: "",
    rescuedCount: "",
    recoveredCount: "",
    groupName2: "",
    managerName2: "",
    managerPhone2: "",
    unitOut2: "",
    departureTime2: "",
    arrivalTime2: "",
    officersCount2: "",
    rescuedCount2: "",
    recoveredCount2: "",
    hasArrivedG1: false,
    hasArrivedG2: false,
    observations: "",
  };
}

// ── Row component ─────────────────────────────────────────────────────────────

interface RowProps {
  dateStr: string;
  log: DailyLog | undefined;
  feat: DrawnFeature;
  onSaveDailyLog?: (featureId: number, log: DailyLog) => Promise<void>;
}

const DateRow: React.FC<RowProps> = ({ dateStr, log, feat, onSaveDailyLog }) => {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<DailyLog>(log ?? emptyLog(dateStr));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showGroup2, setShowGroup2] = useState(!!(draft.groupName2 || draft.unitOut2 || draft.managerName2 || draft.officersCount2));

  const effectiveLog = log ?? emptyLog(dateStr);
  const hasData = !!(
    effectiveLog.groupName ||
    effectiveLog.unitOut ||
    effectiveLog.managerName ||
    effectiveLog.officersCount ||
    effectiveLog.groupName2 ||
    effectiveLog.unitOut2 ||
    effectiveLog.managerName2 ||
    effectiveLog.officersCount2
  );

  const handleChange = useCallback((field: keyof DailyLog, value: any) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }, []);

  const handleSave = async () => {
    if (!onSaveDailyLog) return;
    setSaving(true);
    await onSaveDailyLog(feat.id, draft);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      setDraft(effectiveLog);
      setShowGroup2(!!(effectiveLog.groupName2 || effectiveLog.unitOut2 || effectiveLog.managerName2 || effectiveLog.officersCount2));
    }
  };

  return (
    <div className={`rr-row${hasData ? " rr-row--data" : ""}${expanded ? " rr-row--open" : ""}`}>
      {/* Summary — always visible, fixed height via CSS class */}
      <div className="rr-row-summary" onClick={toggleExpand} role="button" tabIndex={0} style={{ height: "auto", minHeight: "62px" }}>
        {/* Date chip */}
        <div className={`rr-date-chip${hasData ? " rr-date-chip--data" : ""}`}>
          <span className="rr-date-day">{formatDateFriendly(dateStr)}</span>
          <span className="rr-date-year">{dateStr.split("-")[0]}</span>
        </div>

        {/* Content */}
        <div className="rr-row-content" style={{ display: "flex", alignItems: "center", padding: "6px 12px" }}>
          {hasData ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
              {/* Group 1 */}
              {(effectiveLog.groupName || effectiveLog.managerName || effectiveLog.unitOut || effectiveLog.officersCount) && (
                <div className="rr-row-fields" style={{ borderBottom: (effectiveLog.groupName2 || effectiveLog.managerName2 || effectiveLog.unitOut2 || effectiveLog.officersCount2) ? "1px dashed rgba(255, 255, 255, 0.05)" : "none", paddingBottom: (effectiveLog.groupName2 || effectiveLog.managerName2 || effectiveLog.unitOut2 || effectiveLog.officersCount2) ? "4px" : "0" }}>
                  <div>
                    <span className="rr-field-label">👥 G1: Grupo</span>
                    <span className="rr-field-value" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      {effectiveLog.groupName || "–"}
                      {effectiveLog.groupName && (
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: (effectiveLog.arrivalTime || effectiveLog.hasArrivedG1) ? "var(--color-green)" : "var(--color-medium)",
                            boxShadow: `0 0 5px ${(effectiveLog.arrivalTime || effectiveLog.hasArrivedG1) ? "var(--color-green)" : "var(--color-medium)"}`,
                          }}
                          title={(effectiveLog.arrivalTime || effectiveLog.hasArrivedG1) ? (effectiveLog.arrivalTime ? `Llegó a las ${effectiveLog.arrivalTime}` : "Llegó") : "Desplegados"}
                        />
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="rr-field-label">👤 Encargado</span>
                    <span className="rr-field-value">
                      {effectiveLog.managerName || "–"}{effectiveLog.managerPhone ? ` (${effectiveLog.managerPhone})` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="rr-field-label">🚒 Unidad</span>
                    <span className="rr-field-value">{effectiveLog.unitOut || "–"}</span>
                  </div>
                  <div>
                    <span className="rr-field-label">👮 Pers (Resc/Rec)</span>
                    <span className="rr-field-value">
                      {effectiveLog.officersCount || "0"}
                      <span style={{ color: "var(--text-muted)", fontSize: "0.62rem", fontWeight: 400 }}>
                        {" "}(🛟 {effectiveLog.rescuedCount || "0"} | 🩹 {effectiveLog.recoveredCount || "0"})
                      </span>
                    </span>
                  </div>
                </div>
              )}
              {/* Group 2 */}
              {(effectiveLog.groupName2 || effectiveLog.managerName2 || effectiveLog.unitOut2 || effectiveLog.officersCount2) && (
                <div className="rr-row-fields">
                  <div>
                    <span className="rr-field-label">👥 G2: Grupo</span>
                    <span className="rr-field-value" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      {effectiveLog.groupName2 || "–"}
                      {effectiveLog.groupName2 && (
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: (effectiveLog.arrivalTime2 || effectiveLog.hasArrivedG2) ? "var(--color-green)" : "var(--color-medium)",
                            boxShadow: `0 0 5px ${(effectiveLog.arrivalTime2 || effectiveLog.hasArrivedG2) ? "var(--color-green)" : "var(--color-medium)"}`,
                          }}
                          title={(effectiveLog.arrivalTime2 || effectiveLog.hasArrivedG2) ? (effectiveLog.arrivalTime2 ? `Llegó a las ${effectiveLog.arrivalTime2}` : "Llegó") : "Desplegados"}
                        />
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="rr-field-label">👤 Encargado</span>
                    <span className="rr-field-value">
                      {effectiveLog.managerName2 || "–"}{effectiveLog.managerPhone2 ? ` (${effectiveLog.managerPhone2})` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="rr-field-label">🚒 Unidad</span>
                    <span className="rr-field-value">{effectiveLog.unitOut2 || "–"}</span>
                  </div>
                  <div>
                    <span className="rr-field-label">👮 Pers (Resc/Rec)</span>
                    <span className="rr-field-value">
                      {effectiveLog.officersCount2 || "0"}
                      <span style={{ color: "var(--text-muted)", fontSize: "0.62rem", fontWeight: 400 }}>
                        {" "}(🛟 {effectiveLog.rescuedCount2 || "0"} | 🩹 {effectiveLog.recoveredCount2 || "0"})
                      </span>
                    </span>
                  </div>
                </div>
              )}
              {effectiveLog.observations && (
                <div style={{ marginTop: "6px", padding: "4px 8px", background: "rgba(56, 189, 248, 0.04)", borderLeft: "2px solid var(--color-info)", borderRadius: "0 4px 4px 0", fontSize: "0.68rem", width: "100%" }}>
                  <strong style={{ color: "var(--color-info)" }}>📝 Observación:</strong> {effectiveLog.observations}
                </div>
              )}
            </div>
          ) : (
            <span className="rr-empty-msg">
              <ShieldAlert size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
              Sin registro — clic para añadir
            </span>
          )}
        </div>

        {/* Toggle arrow */}
        <div className="rr-toggle">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="rr-editor">
          {/* GRUPO 1 */}
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-green)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "4px", marginBottom: "8px" }}>
            GRUPO 1
          </div>
          <div className="rr-editor-grid2">
            <div>
              <label style={LABEL_STYLE}>Grupo Desplegado</label>
              <input style={INPUT_STYLE} type="text" placeholder="Nombre del grupo" value={draft.groupName} onChange={(e) => handleChange("groupName", e.target.value)} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Encargado</label>
              <input style={INPUT_STYLE} type="text" placeholder="Nombre" value={draft.managerName} onChange={(e) => handleChange("managerName", e.target.value)} />
            </div>
          </div>
          <div className="rr-editor-grid3">
            <div>
              <label style={LABEL_STYLE}>Funcionarios</label>
              <input style={INPUT_STYLE} type="number" min="0" placeholder="0" value={draft.officersCount ?? ""} onChange={(e) => handleChange("officersCount", e.target.value)} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Rescatados</label>
              <input style={INPUT_STYLE} type="number" min="0" placeholder="0" value={draft.rescuedCount ?? ""} onChange={(e) => handleChange("rescuedCount", e.target.value)} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Recuperados</label>
              <input style={INPUT_STYLE} type="number" min="0" placeholder="0" value={draft.recoveredCount ?? ""} onChange={(e) => handleChange("recoveredCount", e.target.value)} />
            </div>
          </div>
          <div className="rr-editor-grid2">
            <div>
              <label style={LABEL_STYLE}>Teléfono Encargado</label>
              <input style={INPUT_STYLE} type="tel" placeholder="0414-0000000" value={draft.managerPhone} onChange={(e) => handleChange("managerPhone", e.target.value)} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Unidad / Vehículo</label>
              <input style={INPUT_STYLE} type="text" placeholder="Ej: Unidad 03" value={draft.unitOut} onChange={(e) => handleChange("unitOut", e.target.value)} />
            </div>
          </div>
          <div className="rr-editor-grid2">
            <div>
              <label style={LABEL_STYLE}>Hora de Salida</label>
              <input style={INPUT_STYLE} type="time" value={draft.departureTime ?? ""} onChange={(e) => handleChange("departureTime", e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <div style={{ flex: 1 }}>
                <label style={LABEL_STYLE}>Hora de Llegada</label>
                <input style={INPUT_STYLE} type="time" value={draft.arrivalTime ?? ""} onChange={(e) => handleChange("arrivalTime", e.target.value)} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "6px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.62rem", color: "var(--text-muted)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={!!draft.hasArrivedG1}
                    onChange={(e) => handleChange("hasArrivedG1", e.target.checked)}
                    style={{ margin: 0, cursor: "pointer" }}
                  />
                  <span>¿Ya llegó?</span>
                </label>
              </div>
            </div>
          </div>

          {/* TOGGLE GRUPO 2 */}
          {!showGroup2 ? (
            <button
              type="button"
              className="sim-btn"
              onClick={() => setShowGroup2(true)}
              style={{
                marginTop: "8px",
                justifyContent: "center",
                padding: "6px",
                fontSize: "0.68rem",
                width: "100%",
                background: "rgba(56, 189, 248, 0.06)",
                border: "1px dashed rgba(56, 189, 248, 0.2)",
                color: "var(--color-info)"
              }}
            >
              + Registrar Segundo Grupo
            </button>
          ) : (
            <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(255, 255, 255, 0.08)", paddingTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "4px", marginBottom: "8px" }}>
                <span>GRUPO 2 (OPCIONAL)</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowGroup2(false);
                    handleChange("groupName2", "");
                    handleChange("managerName2", "");
                    handleChange("managerPhone2", "");
                    handleChange("unitOut2", "");
                    handleChange("departureTime2", "");
                    handleChange("arrivalTime2", "");
                    handleChange("officersCount2", "");
                    handleChange("rescuedCount2", "");
                    handleChange("recoveredCount2", "");
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--color-high)",
                    fontSize: "0.62rem",
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  Remover Grupo 2
                </button>
              </div>
              <div className="rr-editor-grid2">
                <div>
                  <label style={LABEL_STYLE}>Grupo Desplegado 2</label>
                  <input style={INPUT_STYLE} type="text" placeholder="Nombre del grupo 2" value={draft.groupName2 ?? ""} onChange={(e) => handleChange("groupName2", e.target.value)} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Encargado 2</label>
                  <input style={INPUT_STYLE} type="text" placeholder="Nombre" value={draft.managerName2 ?? ""} onChange={(e) => handleChange("managerName2", e.target.value)} />
                </div>
              </div>
              <div className="rr-editor-grid3">
                <div>
                  <label style={LABEL_STYLE}>Funcionarios 2</label>
                  <input style={INPUT_STYLE} type="number" min="0" placeholder="0" value={draft.officersCount2 ?? ""} onChange={(e) => handleChange("officersCount2", e.target.value)} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Rescatados 2</label>
                  <input style={INPUT_STYLE} type="number" min="0" placeholder="0" value={draft.rescuedCount2 ?? ""} onChange={(e) => handleChange("rescuedCount2", e.target.value)} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Recuperados 2</label>
                  <input style={INPUT_STYLE} type="number" min="0" placeholder="0" value={draft.recoveredCount2 ?? ""} onChange={(e) => handleChange("recoveredCount2", e.target.value)} />
                </div>
              </div>
              <div className="rr-editor-grid2">
                <div>
                  <label style={LABEL_STYLE}>Teléfono Encargado 2</label>
                  <input style={INPUT_STYLE} type="tel" placeholder="0414-0000000" value={draft.managerPhone2 ?? ""} onChange={(e) => handleChange("managerPhone2", e.target.value)} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Unidad / Vehículo 2</label>
                  <input style={INPUT_STYLE} type="text" placeholder="Ej: Unidad 03" value={draft.unitOut2 ?? ""} onChange={(e) => handleChange("unitOut2", e.target.value)} />
                </div>
              </div>
              <div className="rr-editor-grid2">
                <div>
                  <label style={LABEL_STYLE}>Hora de Salida 2</label>
                  <input style={INPUT_STYLE} type="time" value={draft.departureTime2 ?? ""} onChange={(e) => handleChange("departureTime2", e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={LABEL_STYLE}>Hora de Llegada 2</label>
                    <input style={INPUT_STYLE} type="time" value={draft.arrivalTime2 ?? ""} onChange={(e) => handleChange("arrivalTime2", e.target.value)} />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "6px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.62rem", color: "var(--text-muted)", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={!!draft.hasArrivedG2}
                        onChange={(e) => handleChange("hasArrivedG2", e.target.checked)}
                        style={{ margin: 0, cursor: "pointer" }}
                      />
                      <span>¿Ya llegó?</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div style={{ marginTop: "8px" }}>
            <label style={LABEL_STYLE}>Observación / Notas del Día</label>
            <textarea
              style={{ ...INPUT_STYLE, resize: "none", height: "42px" }}
              placeholder="Notas u observaciones de las actividades de este día..."
              value={draft.observations || ""}
              onChange={(e) => handleChange("observations", e.target.value)}
            />
          </div>

          <div className="rr-editor-footer" style={{ marginTop: "12px" }}>
            {saved && <span className="rr-saved-msg">✓ Guardado</span>}
            <button
              className="rr-save-btn"
              onClick={handleSave}
              disabled={saving || !onSaveDailyLog}
            >
              <Save size={12} />
              {saving ? "Guardando…" : "Guardar registro"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── InlineRowEditor Component ──────────────────────────────────────────────────

interface InlineRowEditorProps {
  dateStr: string;
  log: DailyLog | undefined;
  feat: DrawnFeature;
  onSaveDailyLog?: (featureId: number, log: DailyLog) => Promise<void>;
  onCloseEditor: () => void;
}

const InlineRowEditor: React.FC<InlineRowEditorProps> = ({ dateStr, log, feat, onSaveDailyLog, onCloseEditor }) => {
  const [draft, setDraft] = useState<DailyLog>(log ?? emptyLog(dateStr));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showGroup2, setShowGroup2] = useState(!!(draft.groupName2 || draft.unitOut2 || draft.managerName2 || draft.officersCount2));

  const handleChange = useCallback((field: keyof DailyLog, value: any) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }, []);

  const handleSave = async () => {
    if (!onSaveDailyLog) return;
    setSaving(true);
    await onSaveDailyLog(feat.id, draft);
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onCloseEditor();
    }, 1500);
  };

  return (
    <div className="rr-editor" style={{ padding: "8px 0 0 0", borderTop: "none", background: "transparent" }}>
      {/* GRUPO 1 */}
      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-green)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "4px", marginBottom: "8px" }}>
        GRUPO 1
      </div>
      <div className="rr-editor-grid2">
        <div>
          <label style={LABEL_STYLE}>Grupo Desplegado</label>
          <input style={INPUT_STYLE} type="text" placeholder="Nombre del grupo" value={draft.groupName} onChange={(e) => handleChange("groupName", e.target.value)} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Encargado</label>
          <input style={INPUT_STYLE} type="text" placeholder="Nombre" value={draft.managerName} onChange={(e) => handleChange("managerName", e.target.value)} />
        </div>
      </div>
      <div className="rr-editor-grid3">
        <div>
          <label style={LABEL_STYLE}>Funcionarios</label>
          <input style={INPUT_STYLE} type="number" min="0" placeholder="0" value={draft.officersCount ?? ""} onChange={(e) => handleChange("officersCount", e.target.value)} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Rescatados</label>
          <input style={INPUT_STYLE} type="number" min="0" placeholder="0" value={draft.rescuedCount ?? ""} onChange={(e) => handleChange("rescuedCount", e.target.value)} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Recuperados</label>
          <input style={INPUT_STYLE} type="number" min="0" placeholder="0" value={draft.recoveredCount ?? ""} onChange={(e) => handleChange("recoveredCount", e.target.value)} />
        </div>
      </div>
      <div className="rr-editor-grid2">
        <div>
          <label style={LABEL_STYLE}>Teléfono Encargado</label>
          <input style={INPUT_STYLE} type="tel" placeholder="0414-0000000" value={draft.managerPhone} onChange={(e) => handleChange("managerPhone", e.target.value)} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Unidad / Vehículo</label>
          <input style={INPUT_STYLE} type="text" placeholder="Ej: Unidad 03" value={draft.unitOut} onChange={(e) => handleChange("unitOut", e.target.value)} />
        </div>
      </div>
      <div className="rr-editor-grid2">
        <div>
          <label style={LABEL_STYLE}>Hora de Salida</label>
          <input style={INPUT_STYLE} type="time" value={draft.departureTime ?? ""} onChange={(e) => handleChange("departureTime", e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <div style={{ flex: 1 }}>
            <label style={LABEL_STYLE}>Hora de Llegada</label>
            <input style={INPUT_STYLE} type="time" value={draft.arrivalTime ?? ""} onChange={(e) => handleChange("arrivalTime", e.target.value)} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "6px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.62rem", color: "var(--text-muted)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={!!draft.hasArrivedG1}
                onChange={(e) => handleChange("hasArrivedG1", e.target.checked)}
                style={{ margin: 0, cursor: "pointer" }}
              />
              <span>¿Ya llegó?</span>
            </label>
          </div>
        </div>
      </div>

      {/* TOGGLE GRUPO 2 */}
      {!showGroup2 ? (
        <button
          type="button"
          className="sim-btn"
          onClick={() => setShowGroup2(true)}
          style={{
            marginTop: "8px",
            justifyContent: "center",
            padding: "6px",
            fontSize: "0.68rem",
            width: "100%",
            background: "rgba(56, 189, 248, 0.06)",
            border: "1px dashed rgba(56, 189, 248, 0.2)",
            color: "var(--color-info)"
          }}
        >
          + Registrar Segundo Grupo
        </button>
      ) : (
        <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(255, 255, 255, 0.08)", paddingTop: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "4px", marginBottom: "8px" }}>
            <span>GRUPO 2 (OPCIONAL)</span>
            <button
              type="button"
              onClick={() => {
                setShowGroup2(false);
                handleChange("groupName2", "");
                handleChange("managerName2", "");
                handleChange("managerPhone2", "");
                handleChange("unitOut2", "");
                handleChange("departureTime2", "");
                handleChange("arrivalTime2", "");
                handleChange("officersCount2", "");
                handleChange("rescuedCount2", "");
                handleChange("recoveredCount2", "");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-high)",
                fontSize: "0.62rem",
                cursor: "pointer",
                padding: 0
              }}
            >
              Remover Grupo 2
            </button>
          </div>
          <div className="rr-editor-grid2">
            <div>
              <label style={LABEL_STYLE}>Grupo Desplegado 2</label>
              <input style={INPUT_STYLE} type="text" placeholder="Nombre del grupo 2" value={draft.groupName2 ?? ""} onChange={(e) => handleChange("groupName2", e.target.value)} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Encargado 2</label>
              <input style={INPUT_STYLE} type="text" placeholder="Nombre" value={draft.managerName2 ?? ""} onChange={(e) => handleChange("managerName2", e.target.value)} />
            </div>
          </div>
          <div className="rr-editor-grid3">
            <div>
              <label style={LABEL_STYLE}>Funcionarios 2</label>
              <input style={INPUT_STYLE} type="number" min="0" placeholder="0" value={draft.officersCount2 ?? ""} onChange={(e) => handleChange("officersCount2", e.target.value)} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Rescatados 2</label>
              <input style={INPUT_STYLE} type="number" min="0" placeholder="0" value={draft.rescuedCount2 ?? ""} onChange={(e) => handleChange("rescuedCount2", e.target.value)} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Recuperados 2</label>
              <input style={INPUT_STYLE} type="number" min="0" placeholder="0" value={draft.recoveredCount2 ?? ""} onChange={(e) => handleChange("recoveredCount2", e.target.value)} />
            </div>
          </div>
          <div className="rr-editor-grid2">
            <div>
              <label style={LABEL_STYLE}>Teléfono Encargado 2</label>
              <input style={INPUT_STYLE} type="tel" placeholder="0414-0000000" value={draft.managerPhone2 ?? ""} onChange={(e) => handleChange("managerPhone2", e.target.value)} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Unidad / Vehículo 2</label>
              <input style={INPUT_STYLE} type="text" placeholder="Ej: Unidad 03" value={draft.unitOut2 ?? ""} onChange={(e) => handleChange("unitOut2", e.target.value)} />
            </div>
          </div>
          <div className="rr-editor-grid2">
            <div>
              <label style={LABEL_STYLE}>Hora de Salida 2</label>
              <input style={INPUT_STYLE} type="time" value={draft.departureTime2 ?? ""} onChange={(e) => handleChange("departureTime2", e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <div style={{ flex: 1 }}>
                <label style={LABEL_STYLE}>Hora de Llegada 2</label>
                <input style={INPUT_STYLE} type="time" value={draft.arrivalTime2 ?? ""} onChange={(e) => handleChange("arrivalTime2", e.target.value)} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "6px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.62rem", color: "var(--text-muted)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={!!draft.hasArrivedG2}
                    onChange={(e) => handleChange("hasArrivedG2", e.target.checked)}
                    style={{ margin: 0, cursor: "pointer" }}
                  />
                  <span>¿Ya llegó?</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginTop: "8px" }}>
        <label style={LABEL_STYLE}>Observación / Notas del Día</label>
        <textarea
          style={{ ...INPUT_STYLE, resize: "none", height: "42px" }}
          placeholder="Notas u observaciones de las actividades de este día..."
          value={draft.observations || ""}
          onChange={(e) => handleChange("observations", e.target.value)}
        />
      </div>

      <div className="rr-editor-footer" style={{ marginTop: "12px" }}>
        {saved && <span className="rr-saved-msg">✓ Guardado</span>}
        <button
          className="rr-save-btn"
          onClick={handleSave}
          disabled={saving || !onSaveDailyLog}
        >
          <Save size={12} />
          {saving ? "Guardando…" : "Guardar registro"}
        </button>
      </div>
    </div>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────

export const RangeReportModal: React.FC<RangeReportModalProps> = ({ feat, allFeatures = [], onClose, onSaveDailyLog }) => {
  if (!feat) return null;

  const dates = getDatesRange("2026-06-24");
  const isAllMode = feat === "all";

  // If it's all mode, we use pagination
  const [activeDateIndex, setActiveDateIndex] = useState(0);
  const [activeEditFeatureId, setActiveEditFeatureId] = useState<number | null>(null);
  const [arrivalFilter, setArrivalFilter] = useState<'all' | 'arrived' | 'not_arrived'>('all');

  const activeDate = dates[activeDateIndex];

  // Filters points that have personnel on activeDate OR are currently being edited/added
  const activePoints = allFeatures.filter((pt) => {
    const isCurrentlyEditing = activeEditFeatureId === pt.id;
    if (isCurrentlyEditing) return true;

    const log = pt.dailyLogs?.find((l) => l.date === activeDate);
    if (!log) return false;
    const count1 = parseInt(log.officersCount || "0", 10);
    const count2 = parseInt(log.officersCount2 || "0", 10);
    const hasPersonnel = (count1 + count2) > 0;
    if (!hasPersonnel) return false;

    // Apply arrivalFilter
    if (arrivalFilter === "arrived") {
      return (!!log.groupName && !!log.arrivalTime) || (!!log.groupName2 && !!log.arrivalTime2);
    }
    if (arrivalFilter === "not_arrived") {
      return (!!log.groupName && !log.arrivalTime) || (!!log.groupName2 && !log.arrivalTime2);
    }
    return true;
  });

  const inactivePoints = allFeatures.filter((pt) => {
    const log = pt.dailyLogs?.find((l) => l.date === activeDate);
    if (!log) return true;
    const count1 = parseInt(log.officersCount || "0", 10);
    const count2 = parseInt(log.officersCount2 || "0", 10);
    return (count1 + count2) <= 0;
  });

  // Filter dates for individual mode based on arrivalFilter
  const filteredDates = dates.filter((dateStr) => {
    if (isAllMode) return true;

    const log = feat.dailyLogs?.find((l) => l.date === dateStr);
    if (!log) {
      return arrivalFilter === "all";
    }

    if (arrivalFilter === "arrived") {
      return (!!log.groupName && !!log.arrivalTime) || (!!log.groupName2 && !!log.arrivalTime2);
    }
    if (arrivalFilter === "not_arrived") {
      return (!!log.groupName && !log.arrivalTime) || (!!log.groupName2 && !log.arrivalTime2);
    }
    return true;
  });

  const handlePrevDay = () => {
    if (activeDateIndex < dates.length - 1) {
      setActiveDateIndex(activeDateIndex + 1);
      setActiveEditFeatureId(null);
    }
  };

  const handleNextDay = () => {
    if (activeDateIndex > 0) {
      setActiveDateIndex(activeDateIndex - 1);
      setActiveEditFeatureId(null);
    }
  };

  // Calculate days with data
  const daysWithData = dates.reduce((acc, dateStr) => {
    if (isAllMode) {
      const hasDataAny = allFeatures.some(f =>
        f.dailyLogs?.some(l => {
          if (l.date !== dateStr) return false;
          const count1 = parseInt(l.officersCount || "0", 10);
          const count2 = parseInt(l.officersCount2 || "0", 10);
          return (count1 + count2) > 0;
        })
      );
      return acc + (hasDataAny ? 1 : 0);
    } else {
      return acc + (feat.dailyLogs?.some((l) => {
        if (l.date !== dateStr) return false;
        const count1 = parseInt(l.officersCount || "0", 10);
        const count2 = parseInt(l.officersCount2 || "0", 10);
        return (count1 + count2) > 0;
      }) ? 1 : 0);
    }
  }, 0);

  return (
    <div className="rr-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rr-modal">
        {/* Header */}
        <div className="rr-header" style={isAllMode ? { background: "linear-gradient(to right, rgba(56, 189, 248, 0.07), transparent)" } : undefined}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Calendar style={{ color: isAllMode ? "var(--color-info)" : "var(--color-green)", flexShrink: 0 }} size={20} />
            <div>
              <h3 className="rr-title">
                {isAllMode ? "Bitácora General — Sitios de Trabajo" : "Bitácora de Rango — 24 Jun a Hoy"}
              </h3>
              <p className="rr-subtitle">
                {isAllMode ? (
                  <span>
                    Mostrando <strong style={{ color: "var(--text-main)" }}>todos los puntos</strong> por día · Excluyendo puntos sin personal
                  </span>
                ) : (
                  <span>
                    Punto: <strong style={{ color: "var(--text-main)" }}>{feat.title}</strong>
                    {" · "}
                    <span style={{ color: "var(--color-info)" }}>Clic en cada día para editar</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <button className="rr-close-btn" onClick={onClose} title="Cerrar">
            <X size={15} />
          </button>
        </div>

        {/* Legend */}
        <div className="rr-legend">
          <div className="rr-legend-item">
            <div className="rr-legend-dot rr-legend-dot--data" />
            Con datos registrados
          </div>
          <div className="rr-legend-item">
            <div className="rr-legend-dot" />
            Sin registros
          </div>
          <div className="rr-legend-stat">
            <Users size={11} />
            {daysWithData} / {dates.length} días con ops.
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="rr-filter-bar">
          <span className="rr-filter-label">Filtrar grupos:</span>
          <div className="rr-filter-buttons">
            <button
              className={`rr-filter-btn ${arrivalFilter === "all" ? "active" : ""}`}
              onClick={() => setArrivalFilter("all")}
            >
              Todos
            </button>
            <button
              className={`rr-filter-btn ${arrivalFilter === "arrived" ? "active" : ""}`}
              onClick={() => setArrivalFilter("arrived")}
            >
              Ya llegaron
            </button>
            <button
              className={`rr-filter-btn ${arrivalFilter === "not_arrived" ? "active" : ""}`}
              onClick={() => setArrivalFilter("not_arrived")}
            >
              No han llegado
            </button>
          </div>
        </div>

        {/* Pagination controls for all points mode */}
        {isAllMode && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 20px",
              background: "rgba(255, 255, 255, 0.02)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              flexShrink: 0,
            }}
          >
            <button
              onClick={handlePrevDay}
              disabled={activeDateIndex === dates.length - 1}
              className="sim-btn"
              style={{
                padding: "5px 12px",
                fontSize: "0.72rem",
                opacity: activeDateIndex === dates.length - 1 ? 0.4 : 1,
                cursor: activeDateIndex === dates.length - 1 ? "not-allowed" : "pointer"
              }}
            >
              ← Día Anterior
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Día Seleccionado:</span>
              <select
                value={activeDateIndex}
                onChange={(e) => {
                  setActiveDateIndex(parseInt(e.target.value, 10));
                  setActiveEditFeatureId(null);
                }}
                style={{
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "6px",
                  color: "var(--text-main)",
                  fontSize: "0.75rem",
                  padding: "4px 10px",
                  outline: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {dates.map((dateStr, idx) => {
                  const dayHasData = allFeatures.some(f =>
                    f.dailyLogs?.some(l => {
                      if (l.date !== dateStr) return false;
                      const count1 = parseInt(l.officersCount || "0", 10);
                      const count2 = parseInt(l.officersCount2 || "0", 10);
                      return (count1 + count2) > 0;
                    })
                  );
                  return (
                    <option key={dateStr} value={idx} style={{ background: "#0f172a", color: "#f8fafc" }}>
                      {formatDateFriendly(dateStr)} {dateStr.split("-")[0]} {dayHasData ? "•" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={handleNextDay}
              disabled={activeDateIndex === 0}
              className="sim-btn"
              style={{
                padding: "5px 12px",
                fontSize: "0.72rem",
                opacity: activeDateIndex === 0 ? 0.4 : 1,
                cursor: activeDateIndex === 0 ? "not-allowed" : "pointer"
              }}
            >
              Día Siguiente →
            </button>
          </div>
        )}

        {/* Scrollable list */}
        <div className="rr-list">
          {isAllMode ? (
            <>
              {activePoints.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "60px 20px",
                    color: "var(--text-muted)",
                    fontSize: "0.8rem",
                    textAlign: "center",
                    gap: "10px",
                  }}
                >
                  <ShieldAlert size={28} style={{ opacity: 0.5, color: "var(--color-info)" }} />
                  <div>
                    {arrivalFilter === "all"
                      ? "No hay personal reportado en ningún Sitio de Trabajo para este día."
                      : arrivalFilter === "arrived"
                        ? "No hay grupos que hayan llegado para este día."
                        : "Todos los grupos de este día ya han llegado o no hay personal reportado."}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {activePoints.map((pt) => {
                    const log = pt.dailyLogs?.find((l) => l.date === activeDate);
                    const isEditingThis = activeEditFeatureId === pt.id;

                    return (
                      <div
                        key={pt.id}
                        className="rr-row rr-row--data"
                        style={{
                          padding: "12px 14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          background: isEditingThis ? "rgba(255, 255, 255, 0.02)" : "rgba(34, 197, 94, 0.02)",
                          border: isEditingThis ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(34, 197, 94, 0.2)",
                        }}
                      >
                        {/* Header of Point Card */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: pt.color || "var(--color-green)",
                                boxShadow: `0 0 8px ${pt.color || "var(--color-green)"}80`,
                              }}
                            />
                            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
                              {pt.title}
                            </span>
                          </div>
                          <button
                            onClick={() => setActiveEditFeatureId(isEditingThis ? null : pt.id)}
                            className="sim-btn"
                            style={{
                              fontSize: "0.65rem",
                              padding: "2px 8px",
                              background: isEditingThis ? "rgba(255, 255, 255, 0.08)" : "rgba(56, 189, 248, 0.08)",
                              border: isEditingThis ? "1px solid var(--border-subtle)" : "1px solid rgba(56, 189, 248, 0.2)",
                              color: isEditingThis ? "var(--text-main)" : "var(--color-info)",
                            }}
                          >
                            {isEditingThis ? "Cerrar" : "Editar"}
                          </button>
                        </div>

                        {/* Read-Only Details */}
                        {!isEditingThis && log && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              paddingLeft: "16px",
                            }}
                          >
                            {/* Grupo 1 */}
                            {(log.groupName || log.managerName || log.unitOut || log.officersCount) && (
                              <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                                gap: "6px",
                                fontSize: "0.72rem",
                                color: "var(--text-muted)",
                                borderBottom: (log.groupName2 || log.managerName2 || log.unitOut2 || log.officersCount2) ? "1px dashed rgba(255, 255, 255, 0.05)" : "none",
                                paddingBottom: (log.groupName2 || log.managerName2 || log.unitOut2 || log.officersCount2) ? "6px" : "0"
                              }}>
                                <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontWeight: 700, color: "var(--color-green)", fontSize: "0.68rem" }}>GRUPO 1</span>
                                  <span style={{
                                    fontSize: "0.62rem",
                                    fontWeight: 700,
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    backgroundColor: log.arrivalTime ? "rgba(52, 211, 153, 0.12)" : "rgba(251, 146, 60, 0.12)",
                                    color: log.arrivalTime ? "var(--color-green)" : "var(--color-medium)",
                                    border: log.arrivalTime ? "1px solid rgba(52, 211, 153, 0.25)" : "1px solid rgba(251, 146, 60, 0.25)",
                                  }}>
                                    {log.arrivalTime ? `Llegó a las ${log.arrivalTime}` : "Desplegados"}
                                  </span>
                                </div>
                                <div>
                                  <strong style={{ color: "var(--text-main)" }}>👥 Grupo:</strong> {log.groupName || "–"}
                                </div>
                                <div>
                                  <strong style={{ color: "var(--text-main)" }}>👤 Encargado:</strong> {log.managerName || "–"}{log.managerPhone ? ` (${log.managerPhone})` : ""}
                                </div>
                                <div>
                                  <strong style={{ color: "var(--text-main)" }}>🚒 Unidad:</strong> {log.unitOut || "–"}
                                </div>
                                <div>
                                  <strong style={{ color: "var(--text-main)" }}>👮 Personal:</strong>{" "}
                                  <span style={{ color: "var(--color-green)", fontWeight: 700 }}>{log.officersCount || "0"}</span>
                                  <span style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>
                                    {" "}(🛟 {log.rescuedCount || "0"} | 🩹 {log.recoveredCount || "0"})
                                  </span>
                                </div>
                                {(log.departureTime || log.arrivalTime) && (
                                  <div style={{ gridColumn: "1 / -1" }}>
                                    <strong style={{ color: "var(--text-main)" }}>🕒 Horas:</strong> Salida: {log.departureTime || "–"} | Llegada: {log.arrivalTime || "–"}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Grupo 2 */}
                            {(log.groupName2 || log.managerName2 || log.unitOut2 || log.officersCount2) && (
                              <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                                gap: "6px",
                                fontSize: "0.72rem",
                                color: "var(--text-muted)",
                                marginTop: "2px"
                              }}>
                                <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontWeight: 700, color: "var(--color-info)", fontSize: "0.68rem" }}>GRUPO 2</span>
                                  <span style={{
                                    fontSize: "0.62rem",
                                    fontWeight: 700,
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    backgroundColor: log.arrivalTime2 ? "rgba(52, 211, 153, 0.12)" : "rgba(251, 146, 60, 0.12)",
                                    color: log.arrivalTime2 ? "var(--color-green)" : "var(--color-medium)",
                                    border: log.arrivalTime2 ? "1px solid rgba(52, 211, 153, 0.25)" : "1px solid rgba(251, 146, 60, 0.25)",
                                  }}>
                                    {log.arrivalTime2 ? `Llegó a las ${log.arrivalTime2}` : "Desplegados"}
                                  </span>
                                </div>
                                <div>
                                  <strong style={{ color: "var(--text-main)" }}>👥 Grupo:</strong> {log.groupName2 || "–"}
                                </div>
                                <div>
                                  <strong style={{ color: "var(--text-main)" }}>👤 Encargado:</strong> {log.managerName2 || "–"}{log.managerPhone2 ? ` (${log.managerPhone2})` : ""}
                                </div>
                                <div>
                                  <strong style={{ color: "var(--text-main)" }}>🚒 Unidad:</strong> {log.unitOut2 || "–"}
                                </div>
                                <div>
                                  <strong style={{ color: "var(--text-main)" }}>👮 Personal:</strong>{" "}
                                  <span style={{ color: "var(--color-info)", fontWeight: 700 }}>{log.officersCount2 || "0"}</span>
                                  <span style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>
                                    {" "}(🛟 {log.rescuedCount2 || "0"} | 🩹 {log.recoveredCount2 || "0"})
                                  </span>
                                </div>
                                {(log.departureTime2 || log.arrivalTime2) && (
                                  <div style={{ gridColumn: "1 / -1" }}>
                                    <strong style={{ color: "var(--text-main)" }}>🕒 Horas:</strong> Salida: {log.departureTime2 || "–"} | Llegada: {log.arrivalTime2 || "–"}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {log?.observations && !isEditingThis && (
                           <div style={{ marginTop: "4px", padding: "4px 8px", background: "rgba(56, 189, 248, 0.04)", borderLeft: "2px solid var(--color-info)", borderRadius: "0 4px 4px 0", fontSize: "0.72rem" }}>
                             <strong style={{ color: "var(--color-info)" }}>📝 Observación:</strong> {log.observations}
                           </div>
                         )}

                        {/* Inline Editor */}
                        {isEditingThis && (
                          <div style={{ marginTop: "4px", borderTop: "1px dashed rgba(255, 255, 255, 0.08)", paddingTop: "8px" }}>
                            <InlineRowEditor
                              dateStr={activeDate}
                              log={log}
                              feat={pt}
                              onSaveDailyLog={onSaveDailyLog}
                              onCloseEditor={() => setActiveEditFeatureId(null)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Selector for inactive points */}
              {inactivePoints.length > 0 && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.01)",
                    border: "1px dashed rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                    ➕ REGISTRAR PERSONAL EN OTRO SITIO DE TRABAJO
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setActiveEditFeatureId(parseInt(val, 10));
                          e.target.value = ""; // reset
                        }
                      }}
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "5px",
                        color: "var(--text-main)",
                        fontSize: "0.7rem",
                        padding: "5px 10px",
                        outline: "none",
                        flex: 1,
                        cursor: "pointer",
                      }}
                    >
                      <option value="" disabled style={{ background: "#1e293b" }}>
                        -- Seleccionar Sitio de Trabajo --
                      </option>
                      {inactivePoints.map((pt) => (
                        <option key={pt.id} value={pt.id} style={{ background: "#1e293b" }}>
                          {pt.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </>
          ) : (
            filteredDates.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "60px 20px",
                  color: "var(--text-muted)",
                  fontSize: "0.8rem",
                  textAlign: "center",
                  gap: "10px",
                }}
              >
                <ShieldAlert size={28} style={{ opacity: 0.5, color: "var(--color-info)" }} />
                <div>No hay registros que coincidan con el filtro en este rango de fechas.</div>
              </div>
            ) : (
              filteredDates.map((dateStr) => {
                const log = feat.dailyLogs?.find((l) => l.date === dateStr);
                return (
                  <DateRow
                    key={dateStr}
                    dateStr={dateStr}
                    log={log}
                    feat={feat}
                    onSaveDailyLog={onSaveDailyLog}
                  />
                );
              })
            )
          )}
        </div>

        {/* Footer */}
        <div className="rr-footer">
          <button onClick={onClose} className="sim-btn" style={{ padding: "6px 20px", fontSize: "0.75rem" }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

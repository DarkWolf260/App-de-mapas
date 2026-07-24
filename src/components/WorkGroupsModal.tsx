import React, { useState, useMemo } from "react";
import type { WorkGroup, Department } from "../types";
import {
  X, Plus, Edit2, Trash2, Users, Phone, Shield, Flame,
  Truck, FileText, Search, ChevronDown, ChevronUp, Save, Check
} from "lucide-react";

interface WorkGroupsModalProps {
  groups: WorkGroup[];
  onSave: (groups: WorkGroup[]) => void;
  onClose: () => void;
}

const EMPTY_DRAFT: Omit<WorkGroup, "id"> = {
  name: "",
  leaderName: "",
  leaderPhone: "",
  department: "pc",
  unitVehicle: "",
  notes: "",
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const WorkGroupsModal: React.FC<WorkGroupsModalProps> = ({ groups, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<"directory" | "form">("directory");
  const [editingGroup, setEditingGroup] = useState<WorkGroup | null>(null);
  const [formDraft, setFormDraft] = useState<Omit<WorkGroup, "id">>(EMPTY_DRAFT);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<"all" | Department>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return groups
      .filter((g) => {
        if (deptFilter !== "all" && g.department !== deptFilter) return false;
        if (!q) return true;
        return (
          g.name.toLowerCase().includes(q) ||
          g.leaderName.toLowerCase().includes(q) ||
          (g.unitVehicle || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
  }, [groups, search, deptFilter]);

  const handleNew = () => {
    setEditingGroup(null);
    setFormDraft(EMPTY_DRAFT);
    setSaved(false);
    setActiveTab("form");
  };

  const handleEdit = (g: WorkGroup) => {
    setEditingGroup(g);
    setFormDraft({ name: g.name, leaderName: g.leaderName, leaderPhone: g.leaderPhone, department: g.department, unitVehicle: g.unitVehicle || "", notes: g.notes || "" });
    setSaved(false);
    setActiveTab("form");
  };

  const handleChange = (field: keyof Omit<WorkGroup, "id">, val: string) => {
    setFormDraft((prev) => ({ ...prev, [field]: val }));
    setSaved(false);
  };

  const handleSaveForm = () => {
    if (!formDraft.name.trim()) return;
    let updated: WorkGroup[];
    if (editingGroup) {
      updated = groups.map((g) => g.id === editingGroup.id ? { ...editingGroup, ...formDraft } : g);
    } else {
      updated = [...groups, { id: generateId(), ...formDraft }];
    }
    onSave(updated);
    setSaved(true);
    setTimeout(() => { setSaved(false); setActiveTab("directory"); }, 1200);
  };

  const handleDelete = (id: string) => {
    onSave(groups.filter((g) => g.id !== id));
    setDeleteConfirmId(null);
    if (editingGroup?.id === id) { setEditingGroup(null); setActiveTab("directory"); }
  };

  const deptColor = (dept: Department) => dept === "pc" ? "#38bdf8" : "#ef4444";
  const deptLabel = (dept: Department) => dept === "pc" ? "Prot. Civil" : "Bomberos";

  return (
    <div className="rr-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rr-modal wg-modal">
        {/* Header */}
        <div className="rr-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Users size={18} style={{ color: "var(--color-info)", flexShrink: 0 }} />
            <div>
              <h3 className="rr-title">Grupos de Trabajo</h3>
              <p className="rr-subtitle">{groups.length} grupo{groups.length !== 1 ? "s" : ""} registrado{groups.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button className="rr-close-btn" onClick={onClose} title="Cerrar">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="rr-tabs">
          <button className={`rr-tab ${activeTab === "directory" ? "active" : ""}`} onClick={() => setActiveTab("directory")}>
            <Users size={13} /> Directorio
          </button>
          <button className={`rr-tab ${activeTab === "form" ? "active" : ""}`} onClick={() => { if (!editingGroup) setFormDraft(EMPTY_DRAFT); setActiveTab("form"); }}>
            <Edit2 size={13} /> {editingGroup ? "Editar Grupo" : "Nuevo Grupo"}
          </button>
        </div>

        {/* ── Directory Tab ── */}
        {activeTab === "directory" && (
          <>
            <div className="rr-toolbar" style={{ gap: "6px" }}>
              <div className="rr-toolbar-search" style={{ flex: 1 }}>
                <Search size={13} className="rr-search-icon" />
                <input type="text" className="rr-search-input" placeholder="Buscar por nombre, encargado, cuerpo..." value={search} onChange={(e) => setSearch(e.target.value)} />
                {search && <button className="rr-search-clear" onClick={() => setSearch("")}><X size={12} /></button>}
              </div>
              <div className="rr-toolbar-filter">
                {(["all", "pc", "bomberos"] as const).map((d) => (
                  <button key={d} className={`rr-filter-btn ${deptFilter === d ? "active" : ""}`} onClick={() => setDeptFilter(d)}>
                    {d === "all" ? "Todos" : d === "pc" ? "PC" : "Bomberos"}
                  </button>
                ))}
              </div>
            </div>

            <div className="rr-list">
              {filtered.length === 0 ? (
                <div className="rr-empty-state">
                  <Users size={28} style={{ opacity: 0.4, color: "var(--color-info)" }} />
                  <div>{groups.length === 0 ? "No hay grupos registrados. Crea uno con \"Nuevo Grupo\"." : "No hay coincidencias."}</div>
                </div>
              ) : (
                filtered.map((g) => {
                  const isExpanded = expandedId === g.id;
                  const ac = deptColor(g.department);
                  return (
                    <div key={g.id} className="wg-card" style={{ borderColor: `${ac}30` }}>
                      <div className="wg-card-header" onClick={() => setExpandedId(isExpanded ? null : g.id)}>
                        <div className="wg-card-left">
                          <span className="wg-dept-badge" style={{ background: `${ac}18`, color: ac, borderColor: `${ac}40` }}>
                            {g.department === "pc" ? <Shield size={10} /> : <Flame size={10} />}
                            {deptLabel(g.department)}
                          </span>
                          <div>
                            <div className="wg-card-name">{g.name}</div>
                            <div className="wg-card-meta">
                              {g.leaderName && <span><strong>Enc:</strong> {g.leaderName}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="wg-card-actions">
                          <button className="wg-icon-btn" onClick={(e) => { e.stopPropagation(); handleEdit(g); }} title="Editar"><Edit2 size={13} /></button>
                          {deleteConfirmId === g.id ? (
                            <span style={{ display: "flex", gap: "3px" }} onClick={(e) => e.stopPropagation()}>
                              <button className="wg-icon-btn danger" onClick={() => handleDelete(g.id)}><Trash2 size={13} /></button>
                              <button className="wg-icon-btn" onClick={() => setDeleteConfirmId(null)}><X size={13} /></button>
                            </span>
                          ) : (
                            <button className="wg-icon-btn" onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(g.id); }} title="Eliminar"><Trash2 size={13} /></button>
                          )}
                          {isExpanded ? <ChevronUp size={13} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={13} style={{ color: "var(--text-muted)" }} />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="wg-card-details">
                          {g.leaderPhone && <div className="wg-detail-row"><Phone size={11} style={{ color: "var(--color-info)" }} /><span>{g.leaderPhone}</span></div>}
                          {g.unitVehicle && <div className="wg-detail-row"><Truck size={11} style={{ color: "var(--text-muted)" }} /><span>{g.unitVehicle}</span></div>}
                          {g.notes && <div className="wg-detail-row" style={{ fontStyle: "italic" }}><FileText size={11} /><span>{g.notes}</span></div>}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ── Form Tab ── */}
        {activeTab === "form" && (
          <div className="rr-list" style={{ gap: "10px" }}>
            <div className="wg-form-title">{editingGroup ? `Editando: ${editingGroup.name}` : "Nuevo Grupo de Trabajo"}</div>

            <div className="wg-form-section">
              <span className="rr-editor-label">Departamento *</span>
              <div style={{ display: "flex", gap: "6px" }}>
                {(["pc", "bomberos"] as const).map((d) => (
                  <button key={d} type="button" onClick={() => handleChange("department", d)}
                    className={`wg-dept-toggle ${formDraft.department === d ? "active" : ""}`}
                    style={formDraft.department === d ? { borderColor: deptColor(d), color: deptColor(d), background: `${deptColor(d)}18` } : {}}>
                    {d === "pc" ? <><Shield size={11} /> Protección Civil</> : <><Flame size={11} /> Bomberos</>}
                  </button>
                ))}
              </div>
            </div>

            <div className="wg-form-section">
              <span className="rr-editor-label">Nombre del Grupo *</span>
              <input className="rr-editor-input" placeholder="Ej: Grupo Alpha" value={formDraft.name} onChange={(e) => handleChange("name", e.target.value)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "8px" }}>
              <div className="wg-form-section">
                <span className="rr-editor-label">Encargado habitual (Opcional - modificable por guardia)</span>
                <input className="rr-editor-input" placeholder="Nombre del encargado habitual" value={formDraft.leaderName} onChange={(e) => handleChange("leaderName", e.target.value)} />
              </div>
              <div className="wg-form-section">
                <span className="rr-editor-label">Teléfono de Contacto</span>
                <input className="rr-editor-input" placeholder="0412-..." value={formDraft.leaderPhone} onChange={(e) => handleChange("leaderPhone", e.target.value)} />
              </div>
            </div>

            <div className="wg-form-section">
              <span className="rr-editor-label">Observaciones / Notas</span>
              <textarea className="rr-editor-input" style={{ resize: "none", height: "52px" }} placeholder="Información adicional..." value={formDraft.notes || ""} onChange={(e) => handleChange("notes", e.target.value)} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
              {saved && <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.68rem", color: "var(--color-green)", fontWeight: 700 }}><Check size={12} /> Guardado</span>}
              <button className="rr-save-btn" onClick={handleSaveForm} disabled={!formDraft.name.trim()}>
                <Save size={13} /> {editingGroup ? "Guardar Cambios" : "Crear Grupo"}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="rr-footer">
          <span style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>
            {groups.length} grupo{groups.length !== 1 ? "s" : ""} registrado{groups.length !== 1 ? "s" : ""} · Se usan para autocompletar el registro diario
          </span>
          <button onClick={onClose} className="sim-btn" style={{ padding: "5px 18px", fontSize: "0.72rem" }}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

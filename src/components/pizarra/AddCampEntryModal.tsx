import React, { useState, useEffect } from "react";
import { Plus, X, Shield, Flame, HelpCircle, Edit3, Users, Check } from "lucide-react";
import {
  PC_STATES,
  BOMBEROS_ENTITIES,
  OTROS_ORGANISMOS,
  getEntryType,
  StatePersonnelCount,
} from "../../services/baseService";
import Select from "../ui/Select";

export interface AddCampEntryModalProps {
  isOpen: boolean;
  campId: string;
  campName: string;
  entryToEdit?: StatePersonnelCount | null;
  onClose: () => void;
  onConfirm: (
    campId: string,
    entry: { id?: string; stateName: string; officersCount: number; type: "pc" | "bomberos" | "otros" }
  ) => void;
}

function getInitialValues(entryToEdit?: StatePersonnelCount | null) {
  if (!entryToEdit) {
    return {
      category: "pc" as const,
      selectedName: PC_STATES[0] || "",
      customName: "",
      officersCount: "",
    };
  }

  const name = entryToEdit.stateName || "";
  const isKnownPC = PC_STATES.includes(name);
  const isKnownBomberos = BOMBEROS_ENTITIES.includes(name);
  const isKnownOtros = OTROS_ORGANISMOS.includes(name);

  if (isKnownPC) {
    return {
      category: "pc" as const,
      selectedName: name,
      customName: "",
      officersCount: entryToEdit.officersCount ? String(entryToEdit.officersCount) : "",
    };
  }
  if (isKnownBomberos) {
    return {
      category: "bomberos" as const,
      selectedName: name,
      customName: "",
      officersCount: entryToEdit.officersCount ? String(entryToEdit.officersCount) : "",
    };
  }
  if (isKnownOtros) {
    return {
      category: "otros" as const,
      selectedName: name,
      customName: "",
      officersCount: entryToEdit.officersCount ? String(entryToEdit.officersCount) : "",
    };
  }

  return {
    category: "custom" as const,
    selectedName: "",
    customName: name,
    officersCount: entryToEdit.officersCount ? String(entryToEdit.officersCount) : "",
  };
}

export const AddCampEntryModal: React.FC<AddCampEntryModalProps> = ({
  isOpen,
  campId,
  campName,
  entryToEdit,
  onClose,
  onConfirm,
}) => {
  const [prevEntry, setPrevEntry] = useState<StatePersonnelCount | null | undefined>(entryToEdit);
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);

  const initial = getInitialValues(entryToEdit);
  const [category, setCategory] = useState<"pc" | "bomberos" | "otros" | "custom">(initial.category);
  const [selectedName, setSelectedName] = useState<string>(initial.selectedName);
  const [customName, setCustomName] = useState<string>(initial.customName);
  const [officersCount, setOfficersCount] = useState<string>(initial.officersCount);

  if (entryToEdit !== prevEntry || isOpen !== prevIsOpen) {
    setPrevEntry(entryToEdit);
    setPrevIsOpen(isOpen);
    const updated = getInitialValues(entryToEdit);
    setCategory(updated.category);
    setSelectedName(updated.selectedName);
    setCustomName(updated.customName);
    setOfficersCount(updated.officersCount);
  }

  if (!isOpen) return null;

  const handleCategoryChange = (cat: "pc" | "bomberos" | "otros" | "custom") => {
    setCategory(cat);
    if (cat === "pc") {
      setSelectedName(PC_STATES[0] || "");
    } else if (cat === "bomberos") {
      setSelectedName(BOMBEROS_ENTITIES[0] || "");
    } else if (cat === "otros") {
      setSelectedName(OTROS_ORGANISMOS[0] || "");
    } else {
      setSelectedName("");
    }
  };

  const getFinalStateName = (): string => {
    if (category === "custom") return customName.trim();
    return selectedName.trim();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = getFinalStateName();
    if (!finalName) return;

    const parsedCount = parseInt(officersCount, 10);
    const finalCount = isNaN(parsedCount) ? 0 : parsedCount;
    const finalType = category === "custom" ? getEntryType(finalName) : category;

    onConfirm(campId, {
      id: entryToEdit?.id,
      stateName: finalName,
      officersCount: finalCount,
      type: finalType,
    });
    onClose();
  };

  const currentOptions =
    category === "pc"
      ? PC_STATES.map((s) => ({ value: s, label: s }))
      : category === "bomberos"
      ? BOMBEROS_ENTITIES.map((s) => ({ value: s, label: s }))
      : category === "otros"
      ? OTROS_ORGANISMOS.map((s) => ({ value: s, label: s }))
      : [];

  const isValid = !!getFinalStateName();
  const isEditing = !!entryToEdit;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.78)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(10, 15, 29, 0.97)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "14px",
          padding: "22px 24px",
          width: "440px",
          maxWidth: "92vw",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.75)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          position: "relative",
        }}
      >
        {/* BOTÓN CERRAR */}
        <button
          onClick={onClose}
          type="button"
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "4px",
            display: "inline-flex",
          }}
        >
          <X size={16} />
        </button>

        {/* ENCABEZADO */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: isEditing ? "rgba(56, 189, 248, 0.15)" : "rgba(249, 115, 22, 0.15)",
              border: `1px solid ${isEditing ? "rgba(56, 189, 248, 0.3)" : "rgba(249, 115, 22, 0.3)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isEditing ? "#38bdf8" : "var(--accent-orange)",
              flexShrink: 0,
            }}
          >
            {isEditing ? <Edit3 size={20} /> : <Plus size={20} />}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#f8fafc", fontFamily: "var(--sans-font)" }}>
              {isEditing ? "Editar Entrada Operacional" : "Añadir Entrada Operacional"}
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Base: <span style={{ color: "#38bdf8", fontWeight: 700 }}>{campName}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* PASO 1: SELECCIONAR TIPO DE ENTE */}
          <div>
            <label style={{ display: "block", fontSize: "0.66rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              1. Tipo de Ente / Institución
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px" }}>
              <button
                type="button"
                onClick={() => handleCategoryChange("pc")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: category === "pc" ? "1px solid #f97316" : "1px solid rgba(255, 255, 255, 0.08)",
                  background: category === "pc" ? "rgba(249, 115, 22, 0.2)" : "rgba(0, 0, 0, 0.3)",
                  color: category === "pc" ? "#f97316" : "var(--text-secondary)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--sans-font)",
                }}
              >
                <Shield size={14} /> Protección Civil
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange("bomberos")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: category === "bomberos" ? "1px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.08)",
                  background: category === "bomberos" ? "rgba(239, 68, 68, 0.2)" : "rgba(0, 0, 0, 0.3)",
                  color: category === "bomberos" ? "#ef4444" : "var(--text-secondary)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--sans-font)",
                }}
              >
                <Flame size={14} /> Bomberos
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange("otros")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: category === "otros" ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.08)",
                  background: category === "otros" ? "rgba(56, 189, 248, 0.2)" : "rgba(0, 0, 0, 0.3)",
                  color: category === "otros" ? "#38bdf8" : "var(--text-secondary)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--sans-font)",
                }}
              >
                <HelpCircle size={14} /> Otros Organismos
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange("custom")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: category === "custom" ? "1px solid #a855f7" : "1px solid rgba(255, 255, 255, 0.08)",
                  background: category === "custom" ? "rgba(168, 85, 247, 0.2)" : "rgba(0, 0, 0, 0.3)",
                  color: category === "custom" ? "#a855f7" : "var(--text-secondary)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--sans-font)",
                }}
              >
                <Edit3 size={14} /> Texto Libre
              </button>
            </div>
          </div>

          {/* PASO 2: NOMBRE DE LA ENTRADA */}
          <div>
            <label style={{ display: "block", fontSize: "0.66rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              2. Nombre de la Entrada u Organismo
            </label>
            {category === "custom" ? (
              <input
                type="text"
                autoFocus
                placeholder="Ej. Cruz Roja Seccional, Grupo Rescate Humboldt..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(168, 85, 247, 0.4)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "0.78rem",
                  padding: "8px 12px",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "var(--sans-font)",
                }}
              />
            ) : (
              <Select
                options={currentOptions}
                value={selectedName}
                onChange={setSelectedName}
                menuMaxHeight={200}
                style={{ width: "100%" }}
              />
            )}
          </div>

          {/* PASO 3: CANTIDAD DE FUNCIONARIOS */}
          <div>
            <label style={{ display: "block", fontSize: "0.66rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              3. Cantidad de Funcionarios / Efectivos
            </label>
            <div style={{ position: "relative" }}>
              <Users size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--accent-orange)" }} />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                value={officersCount}
                onChange={(e) => setOfficersCount(e.target.value.replace(/[^0-9]/g, ""))}
                style={{
                  width: "100%",
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  padding: "8px 12px 8px 32px",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "var(--sans-font)",
                }}
              />
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                color: "var(--text-main)",
                fontSize: "0.74rem",
                fontWeight: 600,
                padding: "8px 16px",
                cursor: "pointer",
                fontFamily: "var(--sans-font)",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid}
              style={{
                background: isValid
                  ? isEditing
                    ? "linear-gradient(135deg, #38bdf8, #0284c7)"
                    : "linear-gradient(135deg, var(--accent-orange), #ea580c)"
                  : "rgba(255, 255, 255, 0.1)",
                border: "none",
                borderRadius: "8px",
                color: isValid ? "#fff" : "var(--text-muted)",
                fontSize: "0.74rem",
                fontWeight: 700,
                padding: "8px 18px",
                cursor: isValid ? "pointer" : "not-allowed",
                fontFamily: "var(--sans-font)",
                boxShadow: isValid
                  ? isEditing
                    ? "0 4px 14px rgba(56, 189, 248, 0.3)"
                    : "0 4px 14px rgba(249, 115, 22, 0.3)"
                  : "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {isEditing ? <Check size={14} /> : <Plus size={14} />}
              <span>{isEditing ? "Guardar Cambios" : "Añadir Entrada"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

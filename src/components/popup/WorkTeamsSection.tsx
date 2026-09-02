import React from "react";
import { Users, Link2, Unlink, Check } from "lucide-react";
import type { GroupLogEntry, Department, DepartmentView } from "../../types";
import { sectionBox, readRowStyle, readLabelStyle, readValueStyle } from "./popupStyles";
import { COMMISSION_INDEPENDENT, getGroupColor } from "./metricFields";
import { MetricInputs, MetricBadges } from "./MetricGrid";

export type DisplayItem =
  | { type: "independent"; groupIdx: number; group: GroupLogEntry }
  | { type: "joint"; commissionId: string; groupIndices: number[]; groups: GroupLogEntry[] };

export function buildDisplayItems(polygonGroups: GroupLogEntry[]): DisplayItem[] {
  const result: DisplayItem[] = [];
  const processedComms = new Set<string>();
  polygonGroups.forEach((g, idx) => {
    const cid = g.commissionId || COMMISSION_INDEPENDENT;
    if (cid === COMMISSION_INDEPENDENT) {
      result.push({ type: "independent", groupIdx: idx, group: g });
    } else if (!processedComms.has(cid)) {
      processedComms.add(cid);
      const allInComm = polygonGroups
        .map((gg, ii) => ({ gg, ii }))
        .filter(({ gg }) => (gg.commissionId || COMMISSION_INDEPENDENT) === cid);
      result.push({
        type: "joint",
        commissionId: cid,
        groupIndices: allInComm.map(({ ii }) => ii),
        groups: allInComm.map(({ gg }) => gg),
      });
    }
  });
  return result;
}

export function ReadRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={readRowStyle}>
      <span style={readLabelStyle}>{label}</span>
      <span style={readValueStyle}>{value || "\u2014"}</span>
    </div>
  );
}

const DeptBadge: React.FC<{ department?: string; small?: boolean }> = ({ department, small }) => {
  const isBomberos = department === "bomberos";
  const base = {
    fontWeight: 800,
    textTransform: "uppercase" as const,
    background: isBomberos ? "rgba(239, 68, 68, 0.15)" : "rgba(56, 189, 248, 0.15)",
    color: isBomberos ? "#ef4444" : "var(--color-info)",
    border: `1px solid ${isBomberos ? "rgba(239, 68, 68, 0.3)" : "rgba(56, 189, 248, 0.3)"}`,
  };
  return (
    <span style={{ ...base, fontSize: small ? "0.52rem" : "0.58rem", padding: small ? "1px 4px" : "2px 5px", borderRadius: small ? "3px" : "4px", display: "inline-block", marginLeft: "4px" }}>
      {isBomberos ? "Bomberos" : "PC"}
    </span>
  );
};

const VolunteerToggle: React.FC<{
  isVolunteer?: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}> = ({ isVolunteer, disabled, onChange }) => (
  <label
    style={{
      fontSize: "0.58rem",
      fontWeight: 700,
      color: isVolunteer ? "#c084fc" : "var(--text-muted)",
      display: "flex",
      alignItems: "center",
      gap: "4px",
      cursor: disabled ? "default" : "pointer",
      background: isVolunteer ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${isVolunteer ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: "4px",
      padding: "2px 5px",
      flexShrink: 0,
    }}
  >
    <input type="checkbox" checked={!!isVolunteer} disabled={disabled} onChange={(e) => onChange(e.target.checked)} style={{ cursor: disabled ? "default" : "pointer", width: "11px", height: "11px", margin: 0 }} />
    VOL
  </label>
);

const VolunteerBadge: React.FC = () => (
  <span style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: "4px", padding: "1px 5px", fontSize: "0.54rem", fontWeight: 800, textTransform: "uppercase" }}>VOL</span>
);

const ArrivalCheckbox: React.FC<{
  hasArrived?: boolean;
  label: string;
  onChange: (value: boolean) => void;
}> = ({ hasArrived, label, onChange }) => {
  // Si ya llegó, el checkbox se bloquea: no se puede desmarcar
  const locked = !!hasArrived;
  return (
    <label
      style={{
        fontSize: "0.64rem",
        fontWeight: 700,
        color: locked ? "var(--color-green)" : "#f97316",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginTop: "4px",
        cursor: locked ? "not-allowed" : "pointer",
        opacity: 1,
        userSelect: "none",
      }}
      title={locked ? "Ya llegó del sitio — no se puede desmarcar" : ""}
    >
      <input
        type="checkbox"
        checked={!!hasArrived}
        disabled={locked}
        onChange={(e) => {
          if (!locked) onChange(e.target.checked);
        }}
        style={{ cursor: locked ? "not-allowed" : "pointer", width: "12px", height: "12px" }}
      />
      <span>{label}</span>
    </label>
  );
};

const ArrivedReadonly: React.FC = () => (
  <span style={{ fontSize: "0.58rem", color: "var(--color-green)", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px", marginTop: "3px" }}>
    <Check size={9} /> Llegó del sitio
  </span>
);

interface IndependentGroupCardProps {
  groupIdx: number;
  group: GroupLogEntry;
  color: string;
  isSelected: boolean;
  canEdit: boolean;
  groupingMode: boolean;
  toggleSelect: (idx: number) => void;
  onGroupEdit: (idx: number, field: string, value: string | boolean) => void;
  onToggleArrival: (idx: number, value: boolean) => void;
  canViewDetails: boolean;
  showArrivalCheckbox: boolean;
  activeDepartment?: DepartmentView;
  onDepartmentSelect?: (dept: Department) => void;
  showReadRows: boolean;
}

const IndependentGroupCard: React.FC<IndependentGroupCardProps> = ({
  groupIdx, group, color, isSelected, canEdit, groupingMode, toggleSelect,
  onGroupEdit, onToggleArrival, canViewDetails, showArrivalCheckbox, activeDepartment, onDepartmentSelect, showReadRows,
}) => (
  <div style={{ background: isSelected ? "rgba(56, 189, 248, 0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${isSelected ? "rgba(56, 189, 248, 0.4)" : "rgba(255,255,255,0.05)"}`, borderRadius: "6px", padding: "5px 7px", transition: "all 0.15s ease" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
      {canEdit && groupingMode && (
        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(groupIdx)} style={{ cursor: "pointer", width: "12px", height: "12px", flexShrink: 0, accentColor: "#38bdf8" }} title="Seleccionar para agrupar" />
      )}
      <span style={{ fontSize: "0.63rem", fontWeight: 700, color }}>{group.groupName || `Equipo ${groupIdx + 1}`}</span>
      {group.department && activeDepartment === "mixto" && <DeptBadge department={group.department} />}
      {canEdit && onGroupEdit && (
        <VolunteerToggle isVolunteer={group.isVolunteer} onChange={(v) => onGroupEdit(groupIdx, "isVolunteer", v)} />
      )}
      {!canEdit && group.isVolunteer && <VolunteerBadge />}
      <span style={{ marginLeft: "auto", fontSize: "0.55rem", color: "var(--text-muted)" }}>{group.officersCount ? `${group.officersCount} func.` : ""}</span>
    </div>
    {canViewDetails && (
      <>
        {showReadRows && (
          <>
            <ReadRow label="Unidad" value={group.unitOut} />
            <ReadRow label="Encargado" value={group.managerName} />
            <ReadRow label="Teléfono" value={group.managerPhone} />
          </>
        )}
        {canEdit && onGroupEdit ? (
          <MetricInputs group={group} groupIdx={groupIdx} onGroupFieldChange={(idx: number, field: string, value: string) => onGroupEdit(idx, field, value)} onDepartmentSelect={onDepartmentSelect} />
        ) : (
          <MetricBadges group={group} />
        )}
        {showArrivalCheckbox ? (
          <ArrivalCheckbox hasArrived={group.hasArrived} label={group.hasArrived ? "Llegó del sitio" : "¿Ya llegó del sitio?"} onChange={(v) => onToggleArrival(groupIdx, v)} />
        ) : (
          group.hasArrived && <ArrivedReadonly />
        )}
      </>
    )}
  </div>
);

interface JointGroupCardProps {
  commissionId: string;
  groupIndices: number[];
  groups: GroupLogEntry[];
  canEdit: boolean;
  handleUngroup: (commissionId: string) => void;
  onGroupEdit: (idx: number, field: string, value: string | boolean) => void;
  onToggleArrival: (idx: number, value: boolean) => void;
  canViewDetails: boolean;
  showArrivalCheckbox: boolean;
  activeDepartment?: DepartmentView;
  onDepartmentSelect?: (dept: Department) => void;
  showGroupDetails: boolean;
}

const JointGroupCard: React.FC<JointGroupCardProps> = ({
  commissionId, groupIndices, groups, canEdit, handleUngroup, onGroupEdit, onToggleArrival,
  canViewDetails, showArrivalCheckbox, activeDepartment, onDepartmentSelect, showGroupDetails,
}) => {
  const primaryIdx = groupIndices[0];
  const primaryGroup = groups[0];
  return (
    <div key={`joint-${commissionId}`} style={{ background: "rgba(56, 189, 248, 0.05)", border: "2px dashed rgba(56, 189, 248, 0.35)", borderRadius: "8px", padding: "6px 8px", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
        <Link2 size={10} style={{ color: "#38bdf8", flexShrink: 0 }} />
        <span style={{ fontSize: "0.63rem", fontWeight: 700, color: "#38bdf8" }}>
          {groups.map((g, i) => (
            <span key={i}>
              {i > 0 && <span style={{ color: "var(--text-muted)" }}> + </span>}
              {g.groupName || `Equipo ${groupIndices[i] + 1}`}
            </span>
          ))}
        </span>
        {canEdit && (
          <button type="button" onClick={() => handleUngroup(commissionId)} style={{ marginLeft: "auto", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "4px", color: "#f87171", fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }} title="Desagrupar estos equipos">
            <Unlink size={8} /> Desagrupar
          </button>
        )}
      </div>
      <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", marginBottom: "3px" }}>
        Equipos trabajando juntos — estadísticas compartidas
      </div>
      {canViewDetails && (
        <>
          {showGroupDetails && groups.map((g, i) => (
            <div key={i} style={{ padding: "2px 0", borderBottom: i < groups.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-secondary)" }}>{g.groupName || `Equipo ${groupIndices[i] + 1}`}</span>
                {g.department && activeDepartment === "mixto" && <DeptBadge department={g.department} small />}
              </div>
              <ReadRow label="Unidad" value={g.unitOut} />
              <ReadRow label="Encargado" value={g.managerName} />
            </div>
          ))}
          {canEdit && onGroupEdit ? (
            <MetricInputs group={primaryGroup} groupIdx={primaryIdx} onGroupFieldChange={(idx: number, field: string, value: string) => onGroupEdit(idx, field, value)} onDepartmentSelect={onDepartmentSelect} />
          ) : (
            <MetricBadges group={primaryGroup} />
          )}
          {showArrivalCheckbox && groupIndices.map((gIdx) => {
            const g = groups[groupIndices.indexOf(gIdx)];
            if (!g) return null;
            return (
              <label key={`arr-${gIdx}`} style={{ fontSize: "0.56rem", fontWeight: 700, color: g.hasArrived ? "var(--color-green)" : "#f97316", display: "flex", alignItems: "center", gap: "5px", marginTop: "3px", cursor: "pointer" }}>
                <input type="checkbox" checked={!!g.hasArrived} onChange={(e) => onToggleArrival(gIdx, e.target.checked)} style={{ cursor: "pointer", width: "11px", height: "11px" }} />
                <span>{g.groupName || `Equipo ${gIdx + 1}`}: {g.hasArrived ? "Llegó" : "¿Llegó?"}</span>
              </label>
            );
          })}
        </>
      )}
    </div>
  );
};

interface WorkTeamsSectionProps {
  variant: "polygon" | "point";
  displayItems: DisplayItem[];
  activeDepartment?: DepartmentView;
  canEdit: boolean;
  canViewDetails: boolean;
  showArrivalCheckbox: boolean;
  groupingMode: boolean;
  setGroupingMode: (value: boolean) => void;
  exitGroupingMode: () => void;
  selectedIndices: Set<number>;
  handleGroupSelected: () => void;
  toggleSelect: (idx: number) => void;
  handleUngroup: (commissionId: string) => void;
  onGroupEdit: (idx: number, field: string, value: string | boolean) => void;
  onToggleArrival: (idx: number, value: boolean) => void;
  onDepartmentSelect?: (dept: Department) => void;
}

export const WorkTeamsSection: React.FC<WorkTeamsSectionProps> = ({
  variant,
  displayItems,
  activeDepartment,
  canEdit,
  canViewDetails,
  showArrivalCheckbox,
  groupingMode,
  setGroupingMode,
  exitGroupingMode,
  selectedIndices,
  handleGroupSelected,
  toggleSelect,
  handleUngroup,
  onGroupEdit,
  onToggleArrival,
  onDepartmentSelect,
}) => {
  const showReadRows = variant === "point";
  return (
    <div style={{ ...sectionBox, background: "rgba(56, 189, 248, 0.03)", borderColor: "rgba(56, 189, 248, 0.15)" }}>
      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
        <Users size={10} /> Equipos de Trabajo
        {canEdit && (
          <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", userSelect: "none", fontSize: "0.58rem", fontWeight: 700, color: groupingMode ? "#38bdf8" : "var(--text-muted)", transition: "color 0.15s" }} title="Activar modo para agrupar equipos que trabajaron juntos">
            <input type="checkbox" checked={groupingMode} onChange={(e) => { setGroupingMode(e.target.checked); if (!e.target.checked) exitGroupingMode(); }} style={{ cursor: "pointer", width: "11px", height: "11px" }} />
            Agrupar
          </label>
        )}
        {canEdit && groupingMode && selectedIndices.size >= 2 && (
          <button type="button" onClick={handleGroupSelected} style={{ background: "rgba(56, 189, 248, 0.18)", border: "1px solid rgba(56, 189, 248, 0.4)", borderRadius: "5px", color: "#38bdf8", fontSize: "0.58rem", fontWeight: 700, padding: "2px 7px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
            <Link2 size={9} /> Agrupar {selectedIndices.size}
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {displayItems.map((item) => {
          if (item.type === "independent") {
            const { groupIdx, group } = item;
            const color = getGroupColor(groupIdx);
            const isSelected = selectedIndices.has(groupIdx);
            return (
              <IndependentGroupCard
                key={`ind-${groupIdx}`}
                groupIdx={groupIdx}
                group={group}
                color={color}
                isSelected={isSelected}
                canEdit={canEdit}
                groupingMode={groupingMode}
                toggleSelect={toggleSelect}
                onGroupEdit={onGroupEdit}
                onToggleArrival={onToggleArrival}
                canViewDetails={canViewDetails}
                showArrivalCheckbox={showArrivalCheckbox}
                activeDepartment={activeDepartment}
                onDepartmentSelect={onDepartmentSelect}
                showReadRows={showReadRows}
              />
            );
          }
          const { commissionId, groupIndices, groups } = item;
          return (
            <JointGroupCard
              key={`joint-${commissionId}`}
              commissionId={commissionId}
              groupIndices={groupIndices}
              groups={groups}
              canEdit={canEdit}
              handleUngroup={handleUngroup}
              onGroupEdit={onGroupEdit}
              onToggleArrival={onToggleArrival}
              canViewDetails={canViewDetails}
              showArrivalCheckbox={showArrivalCheckbox}
              activeDepartment={activeDepartment}
              onDepartmentSelect={onDepartmentSelect}
              showGroupDetails={showReadRows}
            />
          );
        })}
      </div>
    </div>
  );
};

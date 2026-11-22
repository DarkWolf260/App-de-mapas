import React from "react";
import { Users, Link2, Unlink, Check } from "lucide-react";
import type { GroupLogEntry, Department, DepartmentView } from "../../types";
import { flatSectionHeaderStyle, readRowStyle, readLabelStyle, readValueStyle } from "./popupStyles";
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

function formatSchedule(departure?: string, arrival?: string): string | undefined {
  const dep = departure?.trim();
  const arr = arrival?.trim();
  if (!dep && !arr) return undefined;
  if (dep && arr) return `${dep} — ${arr}`;
  if (dep) return `Salida ${dep}`;
  return `Llegada ${arr}`;
}

const DeptBadge: React.FC<{ department?: string; small?: boolean }> = ({ department, small }) => {
  const isBomberos = department === "bomberos";
  const base = {
    fontWeight: 800,
    textTransform: "uppercase" as const,
    background: isBomberos ? "rgba(239, 68, 68, 0.14)" : "rgba(249, 115, 22, 0.14)",
    color: isBomberos ? "#fca5a5" : "#fdba74",
    border: `1px solid ${isBomberos ? "rgba(239, 68, 68, 0.35)" : "rgba(249, 115, 22, 0.35)"}`,
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
      color: isVolunteer ? "#fdba74" : "#94a3b8",
      display: "flex",
      alignItems: "center",
      gap: "4px",
      cursor: disabled ? "default" : "pointer",
      background: isVolunteer ? "rgba(249, 115, 22, 0.14)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${isVolunteer ? "rgba(249, 115, 22, 0.4)" : "rgba(255,255,255,0.1)"}`,
      borderRadius: "4px",
      padding: "2px 5px",
      flexShrink: 0,
    }}
  >
    <input type="checkbox" checked={!!isVolunteer} disabled={disabled} onChange={(e) => onChange(e.target.checked)} style={{ cursor: disabled ? "default" : "pointer", width: "11px", height: "11px", margin: 0, accentColor: "#f97316" }} />
    VOL
  </label>
);

const VolunteerBadge: React.FC = () => (
  <span style={{ background: "rgba(249, 115, 22, 0.14)", color: "#fdba74", border: "1px solid rgba(249, 115, 22, 0.35)", borderRadius: "4px", padding: "1px 5px", fontSize: "0.54rem", fontWeight: 800, textTransform: "uppercase" }}>
    VOL
  </span>
);

const ArrivalCheckbox: React.FC<{
  hasArrived?: boolean;
  label: string;
  onChange: (value: boolean) => void;
}> = ({ hasArrived, label, onChange }) => {
  const locked = !!hasArrived;
  return (
    <label
      style={{
        fontSize: "0.66rem",
        fontWeight: 700,
        color: locked ? "#4ade80" : "#fdba74",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginTop: "6px",
        cursor: locked ? "not-allowed" : "pointer",
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
        style={{ cursor: locked ? "not-allowed" : "pointer", width: "12px", height: "12px", accentColor: "#22c55e" }}
      />
      <span>{label}</span>
    </label>
  );
};

const ArrivedReadonly: React.FC = () => (
  <span style={{ fontSize: "0.62rem", color: "#4ade80", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px", marginTop: "5px" }}>
    <Check size={10} /> Llegó del sitio
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
}

const IndependentGroupCard: React.FC<IndependentGroupCardProps> = ({
  groupIdx, group, color, isSelected, canEdit, groupingMode, toggleSelect,
  onGroupEdit, onToggleArrival, canViewDetails, showArrivalCheckbox, activeDepartment, onDepartmentSelect,
}) => {
  const schedule = formatSchedule(group.departureTime, group.arrivalTime);
  return (
    <div
      style={{
        background: isSelected ? "rgba(249, 115, 22, 0.08)" : "rgba(255, 255, 255, 0.025)",
        border: `1px solid ${isSelected ? "rgba(249, 115, 22, 0.45)" : "rgba(255, 255, 255, 0.09)"}`,
        borderRadius: "8px",
        padding: "9px 11px",
        transition: "border-color 0.15s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", paddingBottom: "4px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {canEdit && groupingMode && (
          <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(groupIdx)} style={{ cursor: "pointer", width: "12px", height: "12px", flexShrink: 0, accentColor: "#f97316" }} title="Seleccionar para agrupar" />
        )}
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color }}>{group.groupName || `Equipo ${groupIdx + 1}`}</span>
        {activeDepartment === "mixto" && <DeptBadge department={group.department || "pc"} />}
        {canEdit && onGroupEdit && (
          <VolunteerToggle isVolunteer={group.isVolunteer} onChange={(v) => onGroupEdit(groupIdx, "isVolunteer", v)} />
        )}
        {!canEdit && group.isVolunteer && <VolunteerBadge />}
        <span style={{ marginLeft: "auto", fontSize: "0.62rem", color: "#94a3b8", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {group.officersCount ? `${group.officersCount} func.` : ""}
        </span>
      </div>
      {canViewDetails && (
        <>
          <ReadRow label="Unidad / Vehículo" value={group.unitOut} />
          <ReadRow label="Encargado" value={group.managerName} />
          <ReadRow label="Teléfono" value={group.managerPhone} />
          {schedule && <ReadRow label="Horario (24h)" value={schedule} />}
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
};

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
}

const JointGroupCard: React.FC<JointGroupCardProps> = ({
  commissionId, groupIndices, groups, canEdit, handleUngroup, onGroupEdit, onToggleArrival,
  canViewDetails, showArrivalCheckbox, activeDepartment, onDepartmentSelect,
}) => {
  const primaryIdx = groupIndices[0];
  const primaryGroup = groups[0];
  return (
    <div key={`joint-${commissionId}`} style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px dashed rgba(249, 115, 22, 0.4)", borderRadius: "8px", padding: "9px 11px", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
        <Link2 size={11} style={{ color: "#fdba74", flexShrink: 0 }} />
        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#f8fafc", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "3px" }}>
          {groups.map((g, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
              {i > 0 && <span style={{ color: "#64748b", margin: "0 4px" }}>+</span>}
              {g.groupName || `Equipo ${groupIndices[i] + 1}`}
              {activeDepartment === "mixto" && <DeptBadge department={g.department || "pc"} small />}
            </span>
          ))}
        </span>
        {canEdit && (
          <button type="button" onClick={() => handleUngroup(commissionId)} style={{ marginLeft: "auto", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "4px", color: "#f87171", fontSize: "0.56rem", fontWeight: 700, padding: "2px 6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }} title="Desagrupar estos equipos">
            <Unlink size={9} /> Desagrupar
          </button>
        )}
      </div>
      <div style={{ fontSize: "0.58rem", color: "#94a3b8", marginBottom: "6px" }}>
        Comisión conjunta — indicadores compartidos
      </div>
      {canViewDetails && (
        <>
          {groups.map((g, i) => {
            const sched = formatSchedule(g.departureTime, g.arrivalTime);
            return (
              <div key={i} style={{ padding: "4px 0", borderBottom: i < groups.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", marginBottom: "2px" }}>
                  <span style={{ fontSize: "0.66rem", fontWeight: 700, color: "#e2e8f0" }}>{g.groupName || `Equipo ${groupIndices[i] + 1}`}</span>
                  {g.officersCount && <span style={{ fontSize: "0.6rem", color: "#94a3b8" }}>{g.officersCount} func.</span>}
                </div>
                <ReadRow label="Unidad / Vehículo" value={g.unitOut} />
                <ReadRow label="Encargado" value={g.managerName} />
                {g.managerPhone && <ReadRow label="Teléfono" value={g.managerPhone} />}
                {sched && <ReadRow label="Horario (24h)" value={sched} />}
              </div>
            );
          })}
          {canEdit && onGroupEdit ? (
            <MetricInputs group={primaryGroup} groupIdx={primaryIdx} onGroupFieldChange={(idx: number, field: string, value: string) => onGroupEdit(idx, field, value)} onDepartmentSelect={onDepartmentSelect} />
          ) : (
            <MetricBadges group={primaryGroup} />
          )}
          {showArrivalCheckbox && groupIndices.map((gIdx) => {
            const g = groups[groupIndices.indexOf(gIdx)];
            if (!g) return null;
            return (
              <label key={`arr-${gIdx}`} style={{ fontSize: "0.62rem", fontWeight: 700, color: g.hasArrived ? "#4ade80" : "#fdba74", display: "flex", alignItems: "center", gap: "5px", marginTop: "4px", cursor: "pointer" }}>
                <input type="checkbox" checked={!!g.hasArrived} onChange={(e) => onToggleArrival(gIdx, e.target.checked)} style={{ cursor: "pointer", width: "11px", height: "11px", accentColor: "#22c55e" }} />
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
  groupingMode?: boolean;
  setGroupingMode?: (value: boolean) => void;
  exitGroupingMode?: () => void;
  selectedIndices?: Set<number>;
  handleGroupSelected?: () => void;
  toggleSelect?: (idx: number) => void;
  handleUngroup?: (commissionId: string) => void;
  onGroupEdit?: (idx: number, field: string, value: string | boolean) => void;
  onToggleArrival: (idx: number, value: boolean) => void;
  onDepartmentSelect?: (dept: Department) => void;
}

const EMPTY_SELECTED = new Set<number>();
const NOOP = () => {};

export const WorkTeamsSection: React.FC<WorkTeamsSectionProps> = ({
  displayItems,
  activeDepartment,
  canEdit,
  canViewDetails,
  showArrivalCheckbox,
  groupingMode = false,
  setGroupingMode = NOOP,
  exitGroupingMode = NOOP,
  selectedIndices = EMPTY_SELECTED,
  handleGroupSelected = NOOP,
  toggleSelect = NOOP,
  handleUngroup = NOOP,
  onGroupEdit = NOOP,
  onToggleArrival,
  onDepartmentSelect,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
    <div style={flatSectionHeaderStyle}>
      <Users size={11} style={{ color: "#94a3b8" }} />
      <span>Equipos de Trabajo</span>
      {canEdit && (
        <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", userSelect: "none", fontSize: "0.6rem", fontWeight: 700, textTransform: "none", letterSpacing: 0, color: groupingMode ? "#fdba74" : "#94a3b8" }} title="Activar modo para agrupar equipos que trabajaron juntos">
          <input type="checkbox" checked={groupingMode} onChange={(e) => { setGroupingMode(e.target.checked); if (!e.target.checked) exitGroupingMode(); }} style={{ cursor: "pointer", width: "11px", height: "11px", accentColor: "#f97316" }} />
          Agrupar
        </label>
      )}
      {canEdit && groupingMode && selectedIndices.size >= 2 && (
        <button type="button" onClick={handleGroupSelected} style={{ background: "rgba(249, 115, 22, 0.16)", border: "1px solid rgba(249, 115, 22, 0.45)", borderRadius: "5px", color: "#fdba74", fontSize: "0.58rem", fontWeight: 700, padding: "2px 7px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
          <Link2 size={9} /> Agrupar {selectedIndices.size}
        </button>
      )}
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
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
          />
        );
      })}
    </div>
  </div>
);

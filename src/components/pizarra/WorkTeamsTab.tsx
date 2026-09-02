import React, { useState, useRef, useEffect } from "react";
import { WorkTeam } from "./types";
import { WorkTeamsToolbar, DeptFilter, ViewMode } from "./WorkTeamsToolbar";
import { WorkTeamsTableView } from "./WorkTeamsTableView";
import { WorkTeamCard } from "./WorkTeamCard";
import { SortField, SortDirection } from "./workTeamsSort";

export interface WorkTeamsTabProps {
  workTeams: WorkTeam[];
  deptFilter: DeptFilter;
  setDeptFilter: (filter: DeptFilter) => void;
  onEditTeam?: (team: WorkTeam) => void;
  onDeleteTeam?: (team: WorkTeam) => void;
}

export const WorkTeamsTab: React.FC<WorkTeamsTabProps> = ({
  workTeams,
  deptFilter,
  setDeptFilter,
  onEditTeam,
  onDeleteTeam,
}) => {
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("groupName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredTeams = workTeams.filter((t) => {
    const matchesSearch =
      t.groupName.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
      t.pointTitle.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
      (t.unitOut || "").toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
      (t.managerName || "").toLowerCase().includes(teamSearchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (deptFilter === "pc") {
      return (
        !t.department ||
        t.department === "pc" ||
        t.department.toLowerCase().includes("protección civil") ||
        t.department.toLowerCase().includes("proteccion civil")
      );
    }
    if (deptFilter === "bomberos") {
      return (
        t.department &&
        (t.department === "bomberos" ||
          t.department.toLowerCase().includes("bombero"))
      );
    }

    return true;
  });

  const sortedTeams = [...filteredTeams].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (aVal === undefined || aVal === null) aVal = "";
    if (bVal === undefined || bVal === null) bVal = "";

    if (typeof aVal === "boolean") {
      return sortDirection === "asc"
        ? (aVal === bVal ? 0 : aVal ? -1 : 1)
        : (aVal === bVal ? 0 : aVal ? 1 : -1);
    }

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totalOfficers = filteredTeams.reduce((sum, t) => sum + t.officersCount, 0);

  return (
    <main className="pizarra-main">
      <style>{`
        .team-card-container {
          position: relative;
        }
        .team-card-edit-btn {
          opacity: 0;
          transform: scale(0.85);
          transition: all 0.18s ease-in-out;
        }
        .team-card-container:hover .team-card-edit-btn {
          opacity: 1 !important;
          transform: scale(1) !important;
        }
        .team-table-row:hover {
          background: rgba(255, 255, 255, 0.02) !important;
        }
        .team-table-row .table-edit-btn {
          opacity: 0;
          transform: scale(0.85);
          transition: all 0.15s ease-in-out;
        }
        .team-table-row:hover .table-edit-btn {
          opacity: 1 !important;
          transform: scale(1) !important;
        }
        @media (hover: none), (max-width: 768px) {
          .team-card-edit-btn,
          .team-table-row .table-edit-btn {
            opacity: 1 !important;
            transform: scale(1) !important;
          }
        }
      `}</style>

      <WorkTeamsToolbar
        searchQuery={teamSearchQuery}
        onSearchChange={setTeamSearchQuery}
        deptFilter={deptFilter}
        onDeptFilterChange={setDeptFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortField={(field) => { setSortField(field); }}
        onSortDirection={setSortDirection}
        isSortOpen={isSortOpen}
        onToggleSort={() => setIsSortOpen((prev) => !prev)}
        sortRef={sortRef}
        totalTeams={filteredTeams.length}
        totalOfficers={totalOfficers}
      />

      {viewMode === "cards" ? (
        <div style={{ overflowY: "auto", flex: 1, minHeight: 0, paddingRight: "4px" }}>
          {sortedTeams.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              {teamSearchQuery ? "No se encontraron equipos que coincidan con la búsqueda." : "No hay equipos de trabajo registrados para la fecha seleccionada."}
            </div>
          ) : (
            <div className="pizarra-cards-grid">
              {sortedTeams.map((team) => (
                <WorkTeamCard key={team.id} team={team} onEditTeam={onEditTeam} onDeleteTeam={onDeleteTeam} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <WorkTeamsTableView
          teams={sortedTeams}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          searchQuery={teamSearchQuery}
          onEditTeam={onEditTeam}
          onDeleteTeam={onDeleteTeam}
        />
      )}
    </main>
  );
};

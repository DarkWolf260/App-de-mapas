import type { DailyLog, Department, DrawnFeature } from "../types";
import { getNormalizedGroupList, mergeLogs } from "./logUtils";

export interface RecoveryArea {
  featureId: number;
  title: string;
  count: number;
}

export interface TeamCount {
  name: string;
  count: number;
}

export interface DepartmentDashboardStats {
  teamsCount: number;
  teams: TeamCount[];
  personnel: number;
  recovered: number;
  edan: number;
  recoveryAreas: RecoveryArea[];
}

export interface DashboardStats {
  pc: DepartmentDashboardStats;
  bomberos: DepartmentDashboardStats;
  totalTeams: number;
  totalPersonnel: number;
  totalRecovered: number;
  totalEdan: number;
}

function emptyDeptStats(): DepartmentDashboardStats {
  return { teamsCount: 0, teams: [], personnel: 0, recovered: 0, edan: 0, recoveryAreas: [] };
}

/** Logs of a feature for a given date, bucketed per department (missing department defaults to "pc"). */
function getMergedLogForDepartment(feat: DrawnFeature, dateStr: string, dept: Department): DailyLog | null {
  const logs = (feat.dailyLogs || []).filter((l) => l.date === dateStr && (l.department || "pc") === dept);
  return mergeLogs(logs);
}

/** Recovered bodies for a log, de-duplicating joint commissions (same rule as getDayStats). */
function getLogRecovered(log: DailyLog): number {
  const groups = getNormalizedGroupList(log);
  const commRecovered = new Map<string, number>();
  let idx = 0;
  for (const g of groups) {
    const rc = parseInt(g.recoveredCount || "0", 10) || 0;
    const commKey = g.commissionId && g.commissionId !== "independiente" ? g.commissionId : `ind_${idx++}`;
    commRecovered.set(commKey, Math.max(commRecovered.get(commKey) || 0, rc));
  }
  let total = 0;
  commRecovered.forEach((val) => { total += val; });
  total += parseInt(log.recoveredCount || "0", 10) || 0;
  return total;
}

export function getDashboardStats(features: DrawnFeature[], dateStr: string): DashboardStats {
  const result: DashboardStats = {
    pc: emptyDeptStats(),
    bomberos: emptyDeptStats(),
    totalTeams: 0,
    totalPersonnel: 0,
    totalRecovered: 0,
    totalEdan: 0,
  };

  (["pc", "bomberos"] as Department[]).forEach((dept) => {
    const stats = result[dept];
    const teamCountsMap = new Map<string, { name: string; count: number }>();

    for (const feat of features) {
      const log = getMergedLogForDepartment(feat, dateStr, dept);
      if (!log) continue;

      const groups = getNormalizedGroupList(log);

      for (const g of groups) {
        const name = (g.groupName || "").trim();
        if (name) {
          const key = name.toLowerCase();
          if (teamCountsMap.has(key)) {
            teamCountsMap.get(key)!.count++;
          } else {
            teamCountsMap.set(key, { name, count: 1 });
          }
        }
        stats.personnel += parseInt(g.officersCount || "0", 10) || 0;
        stats.edan += parseInt(g.edanCount || "0", 10) || 0;
      }

      const recovered = getLogRecovered(log);
      stats.recovered += recovered;
      if (recovered > 0) {
        stats.recoveryAreas.push({ featureId: feat.id, title: feat.title, count: recovered });
      }
    }

    stats.teams = Array.from(teamCountsMap.values()).sort((a, b) => a.name.localeCompare(b.name, "es"));
    stats.teamsCount = stats.teams.reduce((sum, t) => sum + t.count, 0);
    stats.recoveryAreas.sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, "es"));
  });

  result.totalTeams = result.pc.teamsCount + result.bomberos.teamsCount;
  result.totalPersonnel = result.pc.personnel + result.bomberos.personnel;
  result.totalRecovered = result.pc.recovered + result.bomberos.recovered;
  result.totalEdan = result.pc.edan + result.bomberos.edan;

  return result;
}

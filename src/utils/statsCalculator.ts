import type { DailyLog, DrawnFeature, DepartmentView, FeatureType, GroupLogEntry } from "../types";
import { buildParentsMap } from "./spatialUtils";
import { getNormalizedGroupList, logHasAnyData } from "./groupParser";
import { isSectorFeature } from "./searchUtils";

export interface DayStats {
  totalPersonnel: number;
  totalRescued: number;
  totalRecovered: number;
  totalPets: number;
  totalPrehospitalCare: number;
  totalTransfers: number;
  activePoints: number;
  groupsArrived: number;
}

export function getDayStats(
  features: { dailyLogs?: DailyLog[] }[],
  dateStr: string,
  activeDepartment?: DepartmentView,
): DayStats {
  let totalPersonnel = 0;
  let totalRescued = 0;
  let totalRecovered = 0;
  let totalPets = 0;
  let totalPrehospitalCare = 0;
  let totalTransfers = 0;
  let activePoints = 0;
  let groupsArrived = 0;

  for (const f of features) {
    const logs = f.dailyLogs?.filter((l) =>
      l.date === dateStr && (activeDepartment === "mixto" || !activeDepartment || l.department === activeDepartment || !l.department)
    ) || [];
    const log = logs[0];
    if (!log || !logHasAnyData(log)) continue;

    activePoints++;

    const groups = getNormalizedGroupList(log);
    const commRescued = new Map<string, number>();
    const commRecovered = new Map<string, number>();
    const commPrehospital = new Map<string, number>();
    const commTransfers = new Map<string, number>();
    const commPets = new Map<string, number>();

    for (const g of groups) {
      const p = parseInt(g.officersCount || "0", 10) || 0;
      totalPersonnel += p;

      const r = parseInt(g.rescuedCount || "0", 10) || 0;
      const rc = parseInt(g.recoveredCount || "0", 10) || 0;
      const ph = parseInt(g.prehospitalCareCount || "0", 10) || 0;
      const tr = parseInt(g.transfersCount || "0", 10) || 0;
      const pets = parseInt(g.rescuedPetsCount || "0", 10) || 0;

      const commKey = g.commissionId && g.commissionId !== "independiente" ? g.commissionId : `ind_${Math.random()}`;
      commRescued.set(commKey, Math.max(commRescued.get(commKey) || 0, r));
      commRecovered.set(commKey, Math.max(commRecovered.get(commKey) || 0, rc));
      commPrehospital.set(commKey, Math.max(commPrehospital.get(commKey) || 0, ph));
      commTransfers.set(commKey, Math.max(commTransfers.get(commKey) || 0, tr));
      commPets.set(commKey, Math.max(commPets.get(commKey) || 0, pets));

      if (g.hasArrived) groupsArrived++;
    }

    commRescued.forEach((val) => { totalRescued += val; });
    commRecovered.forEach((val) => { totalRecovered += val; });
    commPrehospital.forEach((val) => { totalPrehospitalCare += val; });
    commTransfers.forEach((val) => { totalTransfers += val; });
    commPets.forEach((val) => { totalPets += val; });

    totalRescued += parseInt(log.rescuedCount || "0", 10) || 0;
    totalRecovered += parseInt(log.recoveredCount || "0", 10) || 0;
    totalPrehospitalCare += parseInt(log.prehospitalCareCount || "0", 10) || 0;
    totalTransfers += parseInt(log.transfersCount || "0", 10) || 0;
    totalPets += parseInt(log.rescuedPetsCount || "0", 10) || 0;
  }

  return { totalPersonnel, totalRescued, totalRecovered, totalPets, totalPrehospitalCare, totalTransfers, activePoints, groupsArrived };
}

export interface GroupStats {
  groupName: string;
  department?: string;
  daysActive: number;
  totalPersonnel: number;
  totalRescued: number;
  totalRecovered: number;
  totalPets: number;
  totalPrehospitalCare: number;
  totalTransfers: number;
  isVolunteer?: boolean;
  jointPartners?: string[];
  commissionId?: string;
}

export interface FeatureStat {
  featureId: number;
  featureTitle: string;
  featureType?: FeatureType;
  featureColor?: string;
  daysActive: number;
  containedPointsCount?: number;
  totalPersonnel: number;
  totalRescued: number;
  totalRecovered: number;
  totalPrehospitalCare: number;
  totalTransfers: number;
}

export interface JointCommissionGroupStat {
  groupName: string;
  department?: string;
  isVolunteer?: boolean;
  daysActive: number;
  rescued: number;
  recovered: number;
  prehospital: number;
  transfers: number;
  pets: number;
}

export interface JointCommissionStat {
  commissionId: string;
  commissionLabel: string;
  participatingGroups: JointCommissionGroupStat[];
  daysActive: number;
  totalPersonnel: number;
  totalRescued: number;
  totalRecovered: number;
  totalPrehospitalCare: number;
  totalTransfers: number;
  totalPets: number;
}

export interface PeriodStats {
  totalDaysWithData: number;
  totalPersonnel: number;
  totalRescued: number;
  totalRecovered: number;
  totalPets: number;
  totalPrehospitalCare: number;
  totalTransfers: number;
  groupStats: GroupStats[];
  independentGroupStats: GroupStats[];
  jointCommissionStats?: JointCommissionStat[];
  featureStats: FeatureStat[];
}

export function getPeriodStats(
  features: DrawnFeature[],
  activeDepartment?: DepartmentView,
): PeriodStats {
  const groupMap = new Map<string, GroupStats>();
  const featureStatsMap = new Map<number, FeatureStat>();
  const activeDates = new Set<string>();

  let totalPersonnel = 0;
  let totalRescued = 0;
  let totalRecovered = 0;
  let totalPets = 0;
  let totalPrehospitalCare = 0;
  let totalTransfers = 0;

  const { parentsMap } = buildParentsMap(features);
  const groupDatesMap = new Map<string, Set<string>>();

  function upsertGroupItem(g: GroupLogEntry, log: DailyLog) {
    const trimmed = g.groupName.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase() + "_" + (log.department || "");
    const existing = groupMap.get(key) || {
      groupName: trimmed,
      department: log.department,
      daysActive: 0,
      totalPersonnel: 0,
      totalRescued: 0,
      totalRecovered: 0,
      totalPets: 0,
      totalPrehospitalCare: 0,
      totalTransfers: 0,
      isVolunteer: !!g.isVolunteer,
    };

    if (g.isVolunteer) existing.isVolunteer = true;

    if (!groupDatesMap.has(key)) {
      groupDatesMap.set(key, new Set<string>());
    }
    const datesSet = groupDatesMap.get(key)!;
    datesSet.add(log.date);
    existing.daysActive = datesSet.size;

    existing.totalPersonnel += parseInt(g.officersCount || "0", 10) || 0;
    existing.totalRescued += parseInt(g.rescuedCount || "0", 10) || 0;
    existing.totalRecovered += parseInt(g.recoveredCount || "0", 10) || 0;
    existing.totalPrehospitalCare += parseInt(g.prehospitalCareCount || "0", 10) || 0;
    existing.totalTransfers += parseInt(g.transfersCount || "0", 10) || 0;
    existing.totalPets += parseInt(g.rescuedPetsCount || "0", 10) || 0;
    groupMap.set(key, existing);
  }

  for (const feat of features) {
    for (const log of feat.dailyLogs || []) {
      if (activeDepartment && activeDepartment !== "mixto" && log.department && log.department !== activeDepartment) continue;
      if (!logHasAnyData(log)) continue;

      activeDates.add(log.date);

      const groupList = getNormalizedGroupList(log);
      const commRescued = new Map<string, number>();
      const commRecovered = new Map<string, number>();
      const commPrehospital = new Map<string, number>();
      const commTransfers = new Map<string, number>();
      const commPets = new Map<string, number>();

      for (const g of groupList) {
        upsertGroupItem(g, log);

        const p = parseInt(g.officersCount || "0", 10) || 0;
        totalPersonnel += p;

        const r = parseInt(g.rescuedCount || "0", 10) || 0;
        const rc = parseInt(g.recoveredCount || "0", 10) || 0;
        const ph = parseInt(g.prehospitalCareCount || "0", 10) || 0;
        const tr = parseInt(g.transfersCount || "0", 10) || 0;
        const pets = parseInt(g.rescuedPetsCount || "0", 10) || 0;

        const commKey = g.commissionId && g.commissionId !== "independiente" ? g.commissionId : `ind_${Math.random()}`;
        commRescued.set(commKey, Math.max(commRescued.get(commKey) || 0, r));
        commRecovered.set(commKey, Math.max(commRecovered.get(commKey) || 0, rc));
        commPrehospital.set(commKey, Math.max(commPrehospital.get(commKey) || 0, ph));
        commTransfers.set(commKey, Math.max(commTransfers.get(commKey) || 0, tr));
        commPets.set(commKey, Math.max(commPets.get(commKey) || 0, pets));
      }

      commRescued.forEach((val) => { totalRescued += val; });
      commRecovered.forEach((val) => { totalRecovered += val; });
      commPrehospital.forEach((val) => { totalPrehospitalCare += val; });
      commTransfers.forEach((val) => { totalTransfers += val; });
      commPets.forEach((val) => { totalPets += val; });

      totalRescued += parseInt(log.rescuedCount || "0", 10) || 0;
      totalRecovered += parseInt(log.recoveredCount || "0", 10) || 0;
      totalPrehospitalCare += parseInt(log.prehospitalCareCount || "0", 10) || 0;
      totalTransfers += parseInt(log.transfersCount || "0", 10) || 0;
      totalPets += parseInt(log.rescuedPetsCount || "0", 10) || 0;

      const logCommGroups = new Map<string, GroupLogEntry[]>();
      for (const g of groupList) {
        const commKey = g.commissionId || "comision_1";
        if (commKey !== "independiente" && g.groupName.trim()) {
          if (!logCommGroups.has(commKey)) logCommGroups.set(commKey, []);
          logCommGroups.get(commKey)!.push(g);
        }
      }

      logCommGroups.forEach((gList) => {
        if (gList.length > 1) {
          const groupNames = gList.map((g) => g.groupName.trim());
          for (const gItem of gList) {
            const trimmedName = gItem.groupName.trim();
            const key = trimmedName.toLowerCase() + "_" + (log.department || "");
            const existing = groupMap.get(key);
            if (existing) {
              if (!existing.jointPartners) existing.jointPartners = [];
              groupNames.forEach((other) => {
                if (other !== trimmedName && !existing.jointPartners!.includes(other)) {
                  existing.jointPartners!.push(other);
                }
              });
            }
          }
        }
      });
    }
  }

  for (const feat of features) {
    const isSector = isSectorFeature(feat);
    const childFeatures = isSector ? features.filter((c) => String(parentsMap[c.id]) === String(feat.id)) : [];

    const fStat: FeatureStat = {
      featureId: feat.id,
      featureTitle: feat.title,
      featureType: feat.type,
      featureColor: feat.color,
      daysActive: 0,
      containedPointsCount: childFeatures.length,
      totalPersonnel: 0,
      totalRescued: 0,
      totalRecovered: 0,
      totalPrehospitalCare: 0,
      totalTransfers: 0,
    };

    const allRelevantFeatures = [feat, ...childFeatures];
    const featDates = new Set<string>();

    for (const fItem of allRelevantFeatures) {
      for (const log of fItem.dailyLogs || []) {
        if (activeDepartment && activeDepartment !== "mixto" && log.department && log.department !== activeDepartment) continue;
        if (!logHasAnyData(log)) continue;

        featDates.add(log.date);

        const gList = getNormalizedGroupList(log);
        const fCommRescued = new Map<string, number>();
        const fCommRecovered = new Map<string, number>();
        const fCommPrehospital = new Map<string, number>();
        const fCommTransfers = new Map<string, number>();

        for (const g of gList) {
          fStat.totalPersonnel += parseInt(g.officersCount || "0", 10) || 0;

          const r = parseInt(g.rescuedCount || "0", 10) || 0;
          const rc = parseInt(g.recoveredCount || "0", 10) || 0;
          const ph = parseInt(g.prehospitalCareCount || "0", 10) || 0;
          const tr = parseInt(g.transfersCount || "0", 10) || 0;

          const commKey = g.commissionId && g.commissionId !== "independiente" ? g.commissionId : `ind_${Math.random()}`;
          fCommRescued.set(commKey, Math.max(fCommRescued.get(commKey) || 0, r));
          fCommRecovered.set(commKey, Math.max(fCommRecovered.get(commKey) || 0, rc));
          fCommPrehospital.set(commKey, Math.max(fCommPrehospital.get(commKey) || 0, ph));
          fCommTransfers.set(commKey, Math.max(fCommTransfers.get(commKey) || 0, tr));
        }

        fCommRescued.forEach((val) => { fStat.totalRescued += val; });
        fCommRecovered.forEach((val) => { fStat.totalRecovered += val; });
        fCommPrehospital.forEach((val) => { fStat.totalPrehospitalCare += val; });
        fCommTransfers.forEach((val) => { fStat.totalTransfers += val; });
      }
    }

    fStat.daysActive = featDates.size;

    if (fStat.daysActive > 0 || fStat.totalRescued > 0 || fStat.totalRecovered > 0 || fStat.totalPrehospitalCare > 0 || fStat.totalTransfers > 0) {
      featureStatsMap.set(feat.id, fStat);
    }
  }

  const indepMap = new Map<string, {
    groupName: string;
    department?: string;
    isVolunteer?: boolean;
    datesSet: Set<string>;
    totalPersonnel: number;
    totalRescued: number;
    totalRecovered: number;
    totalPrehospitalCare: number;
    totalTransfers: number;
    totalPets: number;
  }>();

  const jointPairsMap = new Map<string, {
    commissionId: string;
    commissionLabel: string;
    groupsMap: Map<string, {
      groupName: string;
      department?: string;
      isVolunteer?: boolean;
      daysActive: number;
      rescued: number;
      recovered: number;
      prehospital: number;
      transfers: number;
      pets: number;
    }>;
    datesSet: Set<string>;
    rescued: number;
    recovered: number;
    prehospital: number;
    transfers: number;
    pets: number;
    personnel: number;
  }>();

  for (const feat of features) {
    for (const log of feat.dailyLogs || []) {
      if (activeDepartment && activeDepartment !== "mixto" && log.department && log.department !== activeDepartment) continue;
      if (!logHasAnyData(log)) continue;

      const groupList = getNormalizedGroupList(log).filter((g) => g.groupName.trim());
      if (groupList.length === 0) continue;

      const logCommBuckets = new Map<string, GroupLogEntry[]>();

      for (const g of groupList) {
        const name = g.groupName.trim();
        if (!name) continue;

        const isIndep = !g.commissionId || g.commissionId === "independiente";

        if (isIndep) {
          const key = name.toLowerCase() + "_" + (log.department || "");
          if (!indepMap.has(key)) {
            indepMap.set(key, {
              groupName: name,
              department: log.department,
              isVolunteer: !!g.isVolunteer,
              datesSet: new Set(),
              totalPersonnel: 0,
              totalRescued: 0,
              totalRecovered: 0,
              totalPrehospitalCare: 0,
              totalTransfers: 0,
              totalPets: 0,
            });
          }
          const item = indepMap.get(key)!;
          item.datesSet.add(log.date);
          if (g.isVolunteer) item.isVolunteer = true;
          item.totalPersonnel += parseInt(g.officersCount || "0", 10) || 0;
          item.totalRescued += parseInt(g.rescuedCount || "0", 10) || 0;
          item.totalRecovered += parseInt(g.recoveredCount || "0", 10) || 0;
          item.totalPrehospitalCare += parseInt(g.prehospitalCareCount || "0", 10) || 0;
          item.totalTransfers += parseInt(g.transfersCount || "0", 10) || 0;
          item.totalPets += parseInt(g.rescuedPetsCount || "0", 10) || 0;
        } else {
          const cid = g.commissionId && g.commissionId !== "independiente" ? g.commissionId : "comision_1";
          if (!logCommBuckets.has(cid)) logCommBuckets.set(cid, []);
          logCommBuckets.get(cid)!.push(g);
        }
      }

      logCommBuckets.forEach((gList, cid) => {
        const sortedNames = gList.map((g) => g.groupName.trim()).sort();
        const pairKey = cid + "_" + sortedNames.join("__");

        if (!jointPairsMap.has(pairKey)) {
          jointPairsMap.set(pairKey, {
            commissionId: cid,
            commissionLabel: cid.startsWith("comision_")
              ? `Comisión Conjunta ${cid.replace("comision_", "")}`
              : "Comisión Conjunta",
            groupsMap: new Map(),
            datesSet: new Set(),
            rescued: 0,
            recovered: 0,
            prehospital: 0,
            transfers: 0,
            pets: 0,
            personnel: 0,
          });
        }

        const jData = jointPairsMap.get(pairKey)!;
        jData.datesSet.add(log.date);

        gList.forEach((g) => {
          const name = g.groupName.trim();
          const gKey = name.toLowerCase();
          if (!jData.groupsMap.has(gKey)) {
            jData.groupsMap.set(gKey, {
              groupName: name,
              department: log.department,
              isVolunteer: !!g.isVolunteer,
              daysActive: 0,
              rescued: 0,
              recovered: 0,
              prehospital: 0,
              transfers: 0,
              pets: 0,
            });
          }
          const gData = jData.groupsMap.get(gKey)!;
          gData.daysActive++;
          if (g.isVolunteer) gData.isVolunteer = true;

          gData.rescued += parseInt(g.rescuedCount || "0", 10) || 0;
          gData.recovered += parseInt(g.recoveredCount || "0", 10) || 0;
          gData.prehospital += parseInt(g.prehospitalCareCount || "0", 10) || 0;
          gData.transfers += parseInt(g.transfersCount || "0", 10) || 0;
          gData.pets += parseInt(g.rescuedPetsCount || "0", 10) || 0;

          jData.personnel += parseInt(g.officersCount || "0", 10) || 0;
        });

        const maxR = Math.max(...gList.map((g) => parseInt(g.rescuedCount || "0", 10) || 0));
        const maxRc = Math.max(...gList.map((g) => parseInt(g.recoveredCount || "0", 10) || 0));
        const maxPh = Math.max(...gList.map((g) => parseInt(g.prehospitalCareCount || "0", 10) || 0));
        const maxTr = Math.max(...gList.map((g) => parseInt(g.transfersCount || "0", 10) || 0));
        const maxPets = parseInt(log.rescuedPetsCount || "0", 10) || 0;

        jData.rescued += maxR;
        jData.recovered += maxRc;
        jData.prehospital += maxPh;
        jData.transfers += maxTr;
        jData.pets += maxPets;
      });
    }
  }

  const jointCommissionStats: JointCommissionStat[] = [];
  jointPairsMap.forEach((jData) => {
    const participatingGroups: JointCommissionGroupStat[] = Array.from(jData.groupsMap.values()).map((item) => ({
      groupName: item.groupName,
      department: item.department,
      isVolunteer: item.isVolunteer,
      daysActive: item.daysActive,
      rescued: item.rescued,
      recovered: item.recovered,
      prehospital: item.prehospital,
      transfers: item.transfers,
      pets: item.pets,
    }));

    jointCommissionStats.push({
      commissionId: jData.commissionId,
      commissionLabel: jData.commissionLabel,
      participatingGroups,
      daysActive: jData.datesSet.size,
      totalPersonnel: jData.personnel,
      totalRescued: jData.rescued,
      totalRecovered: jData.recovered,
      totalPrehospitalCare: jData.prehospital,
      totalTransfers: jData.transfers,
      totalPets: jData.pets,
    });
  });

  const groupStats = Array.from(groupMap.values()).sort((a, b) => b.daysActive - a.daysActive);
  const independentGroupStats: GroupStats[] = Array.from(indepMap.values())
    .map((item) => ({
      groupName: item.groupName,
      department: item.department,
      isVolunteer: item.isVolunteer,
      daysActive: item.datesSet.size,
      totalPersonnel: item.totalPersonnel,
      totalRescued: item.totalRescued,
      totalRecovered: item.totalRecovered,
      totalPrehospitalCare: item.totalPrehospitalCare,
      totalTransfers: item.totalTransfers,
      totalPets: item.totalPets,
    }))
    .sort((a, b) => b.daysActive - a.daysActive);
  const featureStats = Array.from(featureStatsMap.values()).sort((a, b) => b.daysActive - a.daysActive);

  return {
    totalDaysWithData: activeDates.size,
    totalPersonnel,
    totalRescued,
    totalRecovered,
    totalPets,
    totalPrehospitalCare,
    totalTransfers,
    groupStats,
    independentGroupStats,
    jointCommissionStats,
    featureStats,
  };
}

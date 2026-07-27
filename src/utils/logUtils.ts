export { formatDateFriendly, getDatesRange, REPORT_START_DATE } from "./dateUtils";

export {
  splitGroupNames,
  emptyLog,
  getNormalizedGroupList,
  getTotalPersonnel,
  logHasPersonnel,
  logIsArrived,
  logMatchesArrivalFilter,
  logHasAnyData,
  getGroupData,
} from "./groupParser";
export type { GroupData } from "./groupParser";

export { mergeLogs } from "./logMerge";

export {
  getDayStats,
  getPeriodStats,
} from "./statsCalculator";
export type {
  DayStats,
  GroupStats,
  FeatureStat,
  JointCommissionGroupStat,
  JointCommissionStat,
  PeriodStats,
} from "./statsCalculator";

export { featureMatchesSearch, isSectorFeature } from "./searchUtils";

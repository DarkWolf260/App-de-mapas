import { CampamentoEntry } from "../../services/baseService";

export interface DeleteTarget {
  type: "camp" | "state";
  campId: string;
  stateIdTarget?: string;
  title: string;
  subtitle: string;
}

export interface WorkTeam {
  id: string;
  groupName: string;
  pointTitle: string;
  officersCount: number;
  hasArrived: boolean;
  department?: string;
  unitOut?: string;
  departureTime?: string;
  arrivalTime?: string;
  managerName?: string;
  managerPhone?: string;
}

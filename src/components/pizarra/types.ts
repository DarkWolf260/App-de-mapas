export interface DeleteTarget {
  type: "camp" | "state" | "team";
  campId?: string;
  stateIdTarget?: string;
  teamTarget?: WorkTeam;
  title: string;
  subtitle: string;
}

export interface WorkTeam {
  id: string;
  featureId: number | string;
  groupIndex: number;
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
  rescuedCount?: string;
  recoveredCount?: string;
  rescuedPetsCount?: string;
  prehospitalCareCount?: string;
  transfersCount?: string;
}

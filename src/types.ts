export type FeatureType = "point" | "polyline" | "polygon";

export type Department = "pc" | "bomberos";

export type DepartmentView = Department | "mixto";

export type BasemapKey = "topo-vector" | "satellite" | "hybrid" | "streets-vector" | "dark-gray-vector" | "osm";

export interface HtmlLabel {
  id: number | string;
  title: string;
  info: string;
  x: number;
  y: number;
  themeColor?: string;
  placement: "top" | "bottom" | "left" | "right";
  hasArrived?: boolean;
  prehospitalCount?: number;
  transfersCount?: number;
  rescuedCount?: number;
  recoveredCount?: number;
}

export interface MapPoint {
  x: number;
  y: number;
}

export interface ContainedItem {
  title: string;
  type: FeatureType;
}

export interface DailyLog {
  date: string;
  department?: Department;
  groupName: string;
  managerName: string;
  managerPhone: string;
  unitOut: string;
  departureTime?: string;
  arrivalTime?: string;
  officersCount?: string;
  rescuedCount?: string;
  recoveredCount?: string;
  rescuedPetsCount?: string;
  prehospitalCareCount?: string;
  transfersCount?: string;
  groupName2?: string;
  managerName2?: string;
  managerPhone2?: string;
  unitOut2?: string;
  departureTime2?: string;
  arrivalTime2?: string;
  officersCount2?: string;
  rescuedCount2?: string;
  recoveredCount2?: string;
  prehospitalCareCount2?: string;
  transfersCount2?: string;
  hasArrivedG1?: boolean;
  hasArrivedG2?: boolean;
  observations?: string;
}

export interface GeoJSONGeometry {
  type: "Point" | "LineString" | "Polygon";
  coordinates: number[] | number[][] | number[][][];
}

export interface DrawnFeature {
  id: number;
  title: string;
  type: FeatureType;
  description?: string;
  color?: string;
  locked?: boolean;
  dailyLogs?: DailyLog[];
  geojsonGeometry: GeoJSONGeometry;
  _isUpdate?: boolean;
}

export interface LayerVisibility {
  sketch: boolean;
  polygonLabels: boolean;
  pointLabels: boolean;
  hideNestedAreas: boolean;
  allowLabelOverlap: boolean;
  basemapLabels?: boolean;
}

export interface RemoveFeatureId {
  id: number;
  timestamp: number;
}

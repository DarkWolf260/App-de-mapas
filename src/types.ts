export interface DailyLog {
  date: string;
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
  groupName2?: string;
  managerName2?: string;
  managerPhone2?: string;
  unitOut2?: string;
  departureTime2?: string;
  arrivalTime2?: string;
  officersCount2?: string;
  rescuedCount2?: string;
  recoveredCount2?: string;
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
  type: "point" | "polyline" | "polygon";
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
}

export interface RemoveFeatureId {
  id: number;
  timestamp: number;
}

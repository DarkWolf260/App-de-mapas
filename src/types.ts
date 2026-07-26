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
  isCollapsed?: boolean;
  collapsedCount?: string | number;
}

export interface MapPoint {
  x: number;
  y: number;
}

export interface ContainedItem {
  title: string;
  type: FeatureType;
}

export interface GroupLogEntry {
  id: string;
  groupName: string;
  managerName?: string;
  managerPhone?: string;
  unitOut?: string;
  officersCount?: string;
  rescuedCount?: string;
  recoveredCount?: string;
  rescuedPetsCount?: string;
  prehospitalCareCount?: string;
  transfersCount?: string;
  hasArrived?: boolean;
  commissionId?: string; // e.g. "comision_1", "comision_2", "independiente"
  isVolunteer?: boolean;
}

export type NovedadType = "novedad" | "incidencia" | "actualización";

export interface NovedadEntry {
  id: string;
  timestamp: string;
  time: string;
  text: string;
  type: NovedadType;
}

export interface DailyLog {
  date: string;
  department?: Department;
  groups?: GroupLogEntry[];

  groupName?: string;
  managerName?: string;
  managerPhone?: string;
  unitOut?: string;
  officersCount?: string;
  rescuedCount?: string;
  recoveredCount?: string;
  rescuedPetsCount?: string;
  prehospitalCareCount?: string;
  transfersCount?: string;
  hasArrivedG1?: boolean;
  commissionId?: string;
  isVolunteer?: boolean;

  // Group 2
  groupName2?: string;
  managerName2?: string;
  managerPhone2?: string;
  unitOut2?: string;
  officersCount2?: string;
  rescuedCount2?: string;
  recoveredCount2?: string;
  rescuedPetsCount2?: string;
  prehospitalCareCount2?: string;
  transfersCount2?: string;
  hasArrivedG2?: boolean;
  commissionId2?: string;
  isVolunteer2?: boolean;

  // Group 3
  groupName3?: string;
  managerName3?: string;
  managerPhone3?: string;
  unitOut3?: string;
  officersCount3?: string;
  rescuedCount3?: string;
  recoveredCount3?: string;
  rescuedPetsCount3?: string;
  prehospitalCareCount3?: string;
  transfersCount3?: string;
  hasArrivedG3?: boolean;
  commissionId3?: string;
  isVolunteer3?: boolean;

  // Group 4
  groupName4?: string;
  managerName4?: string;
  managerPhone4?: string;
  unitOut4?: string;
  officersCount4?: string;
  rescuedCount4?: string;
  recoveredCount4?: string;
  rescuedPetsCount4?: string;
  prehospitalCareCount4?: string;
  transfersCount4?: string;
  hasArrivedG4?: boolean;
  commissionId4?: string;
  isVolunteer4?: boolean;

  observations?: string;
  novedades?: NovedadEntry[];
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
  isCollapsed?: boolean;
  collapsedCount?: string | number;
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

export interface WorkGroup {
  id: string;           // UUID
  name: string;         // Nombre del grupo
  leaderName: string;   // Encargado / Jefe
  leaderPhone: string;  // Teléfono de contacto
  corps?: string;       // Cuerpo o dependencia (opcional)
  department: Department; // "pc" | "bomberos"
  unitVehicle?: string; // Unidad / Vehículo habitual
  notes?: string;       // Observaciones adicionales
}

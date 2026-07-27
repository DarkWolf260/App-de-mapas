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

type GroupSuffix = "" | "2" | "3" | "4";

type GroupStringFields = {
  [K in `groupName${GroupSuffix}` | `managerName${GroupSuffix}` | `managerPhone${GroupSuffix}` | `unitOut${GroupSuffix}` | `officersCount${GroupSuffix}` | `rescuedCount${GroupSuffix}` | `recoveredCount${GroupSuffix}` | `rescuedPetsCount${GroupSuffix}` | `prehospitalCareCount${GroupSuffix}` | `transfersCount${GroupSuffix}` | `commissionId${GroupSuffix}`]?: string;
};

type GroupBoolFields = {
  [K in `isVolunteer${GroupSuffix}` | `hasArrivedG${"1" | "2" | "3" | "4"}`]?: boolean;
};

export type DailyLog = {
  date: string;
  department?: Department;
  groups?: GroupLogEntry[];
  observations?: string;
  novedades?: NovedadEntry[];
} & GroupStringFields & GroupBoolFields;

export type DailyLogIndexed = DailyLog & { [key: string]: string | boolean | GroupLogEntry[] | NovedadEntry[] | undefined };

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

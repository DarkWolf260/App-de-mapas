export type FeatureType = "point" | "polyline" | "polygon";

export type Department = "pc" | "bomberos";

export type DepartmentView = Department | "mixto";

export type BasemapKey = "satellite-free" | "google-satellite" | "topo-vector" | "satellite" | "hybrid" | "streets-vector" | "dark-gray-vector" | "osm";

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
  rescuedPetsCount?: number;
  isCollapsed?: boolean;
  collapsedCount?: string | number;
  teamNames?: string[];
  customActivities?: CustomActivity[];
  activityNotes?: string[];
}

export interface MapPoint {
  x: number;
  y: number;
}

export interface ContainedItem {
  title: string;
  type: FeatureType;
}

export interface CustomActivity {
  id: string;
  name: string;
  value: string;
  description?: string;
}

export interface GroupLogEntry {
  id: string;
  groupName: string;
  managerName?: string;
  managerPhone?: string;
  unitOut?: string;
  departureTime?: string;
  arrivalTime?: string;
  officersCount?: string;
  rescuedCount?: string;
  recoveredCount?: string;
  rescuedPetsCount?: string;
  prehospitalCareCount?: string;
  transfersCount?: string;
  edanCount?: string;
  hasArrived?: boolean;
  commissionId?: string;
  isVolunteer?: boolean;
  department?: string;
  customActivities?: CustomActivity[];
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
  observations?: string;
  novedades?: NovedadEntry[];
  rescuedCount?: string;
  recoveredCount?: string;
  rescuedPetsCount?: string;
  prehospitalCareCount?: string;
  transfersCount?: string;
  customActivities?: CustomActivity[];
}

export type GeoJSONGeometry =
  | { type: "Point"; coordinates: number[] }
  | { type: "LineString"; coordinates: number[][] }
  | { type: "Polygon"; coordinates: number[][][] };

export interface DrawnFeature {
  id: number | string;
  title: string;
  type: FeatureType;
  description?: string;
  color?: string;
  locked?: boolean;
  isCollapsed?: boolean;
  collapsedCount?: string | number;
  isCampement?: boolean;
  campementCount?: string | number;
  isHealthCenter?: boolean;
  healthCenterType?: string;
  otherCategoryName?: string;
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
  /** Dibujar los elementos como SVG (DOM) en vez del renderer WebGL. Útil en PCs antiguas. */
  svgOverlay: boolean;
  inspecciones?: boolean;
}

export interface InspeccionRecord {
  id: string;
  latitude: number;
  longitude: number;
  estado?: string;
  municipio?: string;
  parroquia?: string;
  fecha?: string;
  nombre_edificacion?: string;
  uso?: string;
  tipo_estructura?: string;
  riesgo_color?: string;
  evaluacion_riesgo?: string;
  codigo_edificacion?: string;
  sector?: string;
}

export interface RemoveFeatureId {
  id: number | string;
  timestamp: number;
}

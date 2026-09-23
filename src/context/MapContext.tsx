import React, { createContext, useContext } from "react";
import type { BasemapKey, DepartmentView, DrawnFeature, LayerVisibility } from "../types";

export interface MapContextValue {
  activeBasemap: BasemapKey;
  setActiveBasemap: (val: BasemapKey | ((prev: BasemapKey) => BasemapKey)) => void;
  layerVisibility: LayerVisibility;
  setLayerVisibility: (val: LayerVisibility | ((prev: LayerVisibility) => LayerVisibility)) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  activeDepartment: DepartmentView;
  setActiveDepartment: (dept: DepartmentView | ((prev: DepartmentView) => DepartmentView)) => void;
  zoomToFeature: DrawnFeature | null;
  setZoomToFeature: (feat: DrawnFeature | null) => void;
  zoomToCoords: { lat: number; lon: number } | null;
  setZoomToCoords: (coords: { lat: number; lon: number } | null) => void;
  hiddenFeatures: Record<string, boolean>;
  handleToggleFeatureVisibility: (id: string | number) => void;
  importedFeatures: DrawnFeature[];
  setImportedFeatures: React.Dispatch<React.SetStateAction<DrawnFeature[]>>;
  showAccumulated: boolean;
  setShowAccumulated: (val: boolean | ((prev: boolean) => boolean)) => void;
  showPoints: boolean;
  setShowPoints: (val: boolean | ((prev: boolean) => boolean)) => void;
  showAreas: boolean;
  setShowAreas: (val: boolean | ((prev: boolean) => boolean)) => void;
}

const MapContext = createContext<MapContextValue | null>(null);

export const MapProvider: React.FC<{
  value: MapContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return ctx;
}

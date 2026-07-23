import React, { useState } from "react";
import type { DrawnFeature, LayerVisibility, DepartmentView } from "../types";
import { useSpatialHierarchy, useCollapsedGroups, useCollapsedChildren } from "../hooks/useSpatialHierarchy";
import { SidebarHeader } from "./SidebarHeader";
import { DepartmentTabs } from "./DepartmentTabs";
import { MapSettingsPanel } from "./MapSettingsPanel";
import { DrawnFeaturesList } from "./DrawnFeaturesList";
import { DataToolsBar } from "./DataToolsBar";
import { Search, X } from "lucide-react";

interface SidebarProps {
  activeCity: string;
  layerVisibility: LayerVisibility;
  onToggleLayer: (layerName: keyof LayerVisibility) => void;
  drawnFeatures: DrawnFeature[];
  onRenameFeature: (id: number, newTitle: string) => void;
  onDeleteFeature: (id: number) => void;
  onZoomToFeature: (feat: DrawnFeature) => void;
  onExportGeoJSON: () => void;
  onImportPreview: (text: string) => void;
  hiddenFeatures: Record<number, boolean>;
  onToggleFeatureVisibility: (id: number) => void;
  onToggleFeaturesVisibility: (ids: number[], visible: boolean) => void;
  onReorderFeature: (id: number, direction: "up" | "down") => void;
  onUpdateFeatureDescription: (id: number, newDesc: string) => void;
  onToggleFeatureLock: (id: number, locked: boolean) => void;
  onSaveDailyLog?: (
    featureId: number,
    log: { date: string; groupName: string; managerName: string; managerPhone: string; unitOut: string; departureTime?: string; arrivalTime?: string; officersCount?: string }
  ) => Promise<void>;
  onOpenRangeReport?: (feat: DrawnFeature | "all") => void;
  activeDepartment: DepartmentView;
  onDepartmentChange: (dept: DepartmentView) => void;
  onGoToCoords?: (lat: number, lon: number) => void;
  onCreatePointAtCoords?: (lat: number, lon: number) => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  layerVisibility,
  onToggleLayer,
  drawnFeatures,
  onRenameFeature,
  onDeleteFeature,
  onZoomToFeature,
  onExportGeoJSON,
  onImportPreview,
  hiddenFeatures,
  onToggleFeatureVisibility,
  onToggleFeaturesVisibility,
  onReorderFeature,
  onUpdateFeatureDescription,
  onToggleFeatureLock,
  onSaveDailyLog: _onSaveDailyLog,
  onOpenRangeReport,
  activeDepartment,
  onDepartmentChange,
  onGoToCoords,
  onCreatePointAtCoords,
  className,
}) => {
  const [showMapSettings, setShowMapSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { collapsedGroups, toggleGroupCollapse } = useCollapsedGroups();
  const { collapsedChildren, toggleChildrenCollapse } = useCollapsedChildren();
  const { rootPoints, rootLines, rootPolygons, pointsByParent, childrenMap, polygonAreas } = useSpatialHierarchy(drawnFeatures);

  return (
    <div className={`sidebar glass-panel ${className ?? ""}`}>
      <SidebarHeader />
      <div className="sidebar-search-container">
        <Search size={14} className="sidebar-search-icon" />
        <input
          type="text"
          placeholder="Buscar elementos o coordenadas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sidebar-search-input"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="sidebar-search-clear" title="Limpiar búsqueda">
            <X size={13} />
          </button>
        )}
      </div>
      <DepartmentTabs activeDepartment={activeDepartment} onDepartmentChange={onDepartmentChange} />
      <MapSettingsPanel
        layerVisibility={layerVisibility}
        onToggleLayer={onToggleLayer}
        expanded={showMapSettings}
        onToggle={() => setShowMapSettings((v) => !v)}
      />
      <DrawnFeaturesList
        drawnFeatures={drawnFeatures}
        hiddenFeatures={hiddenFeatures}
        rootPoints={rootPoints}
        rootLines={rootLines}
        rootPolygons={rootPolygons}
        pointsByParent={pointsByParent}
        childrenMap={childrenMap}
        polygonAreas={polygonAreas}
        collapsedGroups={collapsedGroups}
        collapsedChildren={collapsedChildren}
        onToggleGroupCollapse={toggleGroupCollapse}
        onToggleChildrenCollapse={toggleChildrenCollapse}
        onToggleFeatureVisibility={onToggleFeatureVisibility}
        onToggleFeaturesVisibility={onToggleFeaturesVisibility}
        onRenameFeature={onRenameFeature}
        onDeleteFeature={onDeleteFeature}
        onZoomToFeature={onZoomToFeature}
        onReorderFeature={onReorderFeature}
        onUpdateFeatureDescription={onUpdateFeatureDescription}
        onToggleFeatureLock={onToggleFeatureLock}
        onOpenRangeReport={onOpenRangeReport}
        searchQuery={searchQuery}
        onGoToCoords={onGoToCoords}
        onCreatePointAtCoords={onCreatePointAtCoords}
      />
      <DataToolsBar
        onExportGeoJSON={onExportGeoJSON}
        onImportPreview={onImportPreview}
        onOpenRangeReport={onOpenRangeReport ? () => onOpenRangeReport("all") : undefined}
      />
    </div>
  );
};

export default Sidebar;

import React, { useState } from "react";
import type { DrawnFeature, LayerVisibility } from "../types";
import { useSpatialHierarchy, useCollapsedGroups, useCollapsedChildren } from "../hooks/useSpatialHierarchy";
import { SidebarHeader } from "./SidebarHeader";
import { MapSettingsPanel } from "./MapSettingsPanel";
import { DrawnFeaturesList } from "./DrawnFeaturesList";
import { DataToolsBar } from "./DataToolsBar";

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
  className,
}) => {
  const [showMapSettings, setShowMapSettings] = useState(false);
  const { collapsedGroups, toggleGroupCollapse } = useCollapsedGroups();
  const { collapsedChildren, toggleChildrenCollapse } = useCollapsedChildren();
  const { rootPoints, rootLines, rootPolygons, pointsByParent, childrenMap, polygonAreas } = useSpatialHierarchy(drawnFeatures);

  return (
    <div className={`sidebar glass-panel ${className ?? ""}`}>
      <SidebarHeader />
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

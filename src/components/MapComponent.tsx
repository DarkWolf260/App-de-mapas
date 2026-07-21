import React from "react";
import "@arcgis/core/assets/esri/themes/dark/main.css";
import type { DrawnFeature, LayerVisibility, RemoveFeatureId } from "../App";
import { DrawingToolbar } from "./DrawingToolbar";
import { CustomMapPopup } from "./CustomMapPopup";
import { useMapSetup } from "./useMapSetup";

interface MapComponentProps {
  apiKey: string;
  activeBasemap: string;
  activeCity: string;
  layerVisibility: LayerVisibility;
  drawnFeatures: DrawnFeature[];
  onFeatureAdded: (newFeat: DrawnFeature) => void;
  onFeatureDeleted: (id: number) => void;
  zoomToFeature: DrawnFeature | null;
  removeFeatureId: RemoveFeatureId | null;
  importedFeatures: DrawnFeature[];
  hiddenFeatures: Record<number, boolean>;
    onSaveDailyLog?: (
      featureId: number,
      log: { date: string; groupName: string; managerName: string; managerPhone: string; unitOut: string; departureTime?: string; arrivalTime?: string; officersCount?: string }
    ) => Promise<void>;
    onOpenRangeReport?: (feat: DrawnFeature) => void;
    onToggleFeatureLock?: (id: number, locked: boolean) => void;
    onRenameFeature?: (id: number, newTitle: string) => Promise<void>;
    onUpdateFeatureDescription?: (id: number, newDesc: string) => Promise<void>;
    onUpdateFeatureColor?: (id: number, newColor: string) => Promise<void>;
  }
  
  const MapComponent: React.FC<MapComponentProps> = (props) => {
    const {
      layerVisibility,
      drawnFeatures,
      onSaveDailyLog,
      onToggleFeatureLock,
      onRenameFeature,
      onUpdateFeatureDescription,
      onUpdateFeatureColor,
    } = props;

  const {
    mapDiv,
    activeTool,
    editMode,
    selectedGraphic,
    activeColor,
    tooltip,
    customPopup,
    popupScreenPos,
    showHistoryInPopup,
    popupEditDate,
    sketchLayer,
    currentZoom,
    htmlLabels,
    setCustomPopup,
    setShowHistoryInPopup,
    setPopupEditDate,
    handleSelectTool,
    handleCancel,
    handleDeleteSelected,
    handleToggleEditMode,
    handleColorChange,
  } = useMapSetup(props);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div className="map-view-container" ref={mapDiv} style={{ width: "100%", height: "100%" }} />
      {layerVisibility?.sketch && (
        <div className="draw-toolbar-wrapper">
          <DrawingToolbar
            activeTool={activeTool}
            editMode={editMode}
            onSelectTool={handleSelectTool}
            onCancel={handleCancel}
            onDelete={handleDeleteSelected}
            onToggleEditMode={handleToggleEditMode}
            hasSelection={!!selectedGraphic}
            activeColor={activeColor}
            onColorChange={handleColorChange}
          />
        </div>
      )}

      <CustomMapPopup
        customPopup={customPopup}
        popupScreenPos={popupScreenPos}
        drawnFeatures={drawnFeatures}
        layerVisibility={layerVisibility}
        popupEditDate={popupEditDate}
        setPopupEditDate={setPopupEditDate}
        showHistoryInPopup={showHistoryInPopup}
        setShowHistoryInPopup={setShowHistoryInPopup}
        onSaveDailyLog={onSaveDailyLog}
        onToggleFeatureLock={onToggleFeatureLock}
        onRenameFeature={onRenameFeature}
        onUpdateFeatureDescription={onUpdateFeatureDescription}
        onUpdateFeatureColor={onUpdateFeatureColor}
        sketchLayer={sketchLayer}
        onClose={() => setCustomPopup(null)}
      />

      {/* Floating hover tooltip for lines and polygons */}
      {tooltip.visible && (
        <div
          style={{
            position: "absolute",
            left: `${tooltip.x + 15}px`,
            top: `${tooltip.y + 15}px`,
            background: "rgba(10, 15, 29, 0.95)",
            border: "1px solid rgba(56, 189, 248, 0.4)",
            color: "#f8fafc",
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "none",
            letterSpacing: "0.03em",
            pointerEvents: "none",
            zIndex: 1000,
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            fontFamily: "var(--font-sans)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            whiteSpace: "pre-wrap",
          }}
        >
          {tooltip.text}
        </div>
      )}
      {/* Floating Zoom level indicator in bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          right: "16px",
          background: "rgba(10, 15, 29, 0.85)",
          border: "1px solid rgba(56, 189, 248, 0.35)",
          color: "#f8fafc",
          padding: "6px 12px",
          borderRadius: "8px",
          fontSize: "11px",
          fontWeight: 700,
          fontFamily: "var(--font-sans)",
          pointerEvents: "none",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 100,
          letterSpacing: "0.05em",
        }}
      >
        ZOOM: {currentZoom.toFixed(1)}
      </div>

      {/* HTML point labels with background (personnel info) */}
      {htmlLabels.map((lbl) => {
        const borderStyle = `1px solid ${lbl.themeColor ? `${lbl.themeColor}80` : "rgba(56, 189, 248, 0.5)"}`;
        
        let top = `${lbl.y - 12}px`;
        let left = `${lbl.x}px`;
        let transform = "translate(-50%, -100%)";
        let arrowStyle: React.CSSProperties = {};

        if (lbl.placement === "top") {
          top = `${lbl.y - 12}px`;
          left = `${lbl.x}px`;
          transform = "translate(-50%, -100%)";
          arrowStyle = {
            bottom: "0",
            left: "50%",
            transform: "translate(-50%, 50%) rotate(45deg)",
            borderRight: borderStyle,
            borderBottom: borderStyle,
          };
        } else if (lbl.placement === "bottom") {
          top = `${lbl.y + 12}px`;
          left = `${lbl.x}px`;
          transform = "translate(-50%, 0)";
          arrowStyle = {
            top: "0",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(45deg)",
            borderTop: borderStyle,
            borderLeft: borderStyle,
          };
        } else if (lbl.placement === "right") {
          top = `${lbl.y}px`;
          left = `${lbl.x + 12}px`;
          transform = "translate(0, -50%)";
          arrowStyle = {
            top: "50%",
            left: "0",
            transform: "translate(-50%, -50%) rotate(45deg)",
            borderBottom: borderStyle,
            borderLeft: borderStyle,
          };
        } else if (lbl.placement === "left") {
          top = `${lbl.y}px`;
          left = `${lbl.x - 12}px`;
          transform = "translate(-100%, -50%)";
          arrowStyle = {
            top: "50%",
            right: "0",
            transform: "translate(50%, -50%) rotate(45deg)",
            borderTop: borderStyle,
            borderRight: borderStyle,
          };
        }

        return (
          <div
            key={lbl.id}
            style={{
              position: "absolute",
              left,
              top,
              transform,
              background: "rgba(10, 15, 29, 0.95)",
              border: borderStyle,
              color: "#f8fafc",
              padding: "5px 10px",
              borderRadius: "6px",
              fontFamily: "var(--font-sans)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              pointerEvents: "none",
              zIndex: 2,
              whiteSpace: "nowrap",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: "11px", marginBottom: "2px", display: "flex", alignItems: "center", gap: "5px" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: (lbl as any).hasArrived ? "#22c55e" : "#f97316",
                    boxShadow: (lbl as any).hasArrived ? "0 0 6px #22c55e" : "0 0 6px #f97316",
                  }}
                />
                {lbl.title}
              </div>
              <div style={{ fontWeight: 500, fontSize: "9px", opacity: 0.85 }}>{lbl.info}</div>
            </div>

            {/* Rotated square acting as a bubble tail pointer */}
            <div
              style={{
                position: "absolute",
                width: "8px",
                height: "8px",
                background: "rgba(10, 15, 29, 0.95)",
                ...arrowStyle,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default MapComponent;

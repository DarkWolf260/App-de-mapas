import { useState } from "react";
import MapComponent from "./components/MapComponent";
import Sidebar from "./components/Sidebar";
import { ChevronLeft, Menu } from "lucide-react";
import { RangeReportModal } from "./components/RangeReportModal";
import { FloatingSearchBar } from "./components/FloatingSearchBar";
import { GlobalStatsWidget } from "./components/GlobalStatsWidget";
import { DateTimeline } from "./components/DateTimeline";
import type { DrawnFeature, LayerVisibility, RemoveFeatureId } from "./types";
import { useFeatureDB } from "./hooks/useFeatureDB";
import { useFeatureVisibility } from "./hooks/useFeatureVisibility";
import { useFeatureOrder } from "./hooks/useFeatureOrder";
import { useGeoJSONIO } from "./hooks/useGeoJSONIO";
import { useLocalStorageState } from "./hooks/useLocalStorageState";

function App() {
  const apiKey: string = import.meta.env.VITE_ARCGIS_API_KEY ?? "";
  const [activeCity] = useState<string>("venezuela");
  const [showSidebar, setShowSidebar] = useLocalStorageState<boolean>("pc_show_sidebar", true);
  const [layerVisibility, setLayerVisibility] = useLocalStorageState<LayerVisibility>("pc_layer_visibility", {
    sketch: true,
    polygonLabels: true,
    pointLabels: true,
    hideNestedAreas: false,
    allowLabelOverlap: false,
  });
  const [zoomToFeature, setZoomToFeature] = useState<DrawnFeature | null>(null);
  const [removeFeatureId, setRemoveFeatureId] = useState<RemoveFeatureId | null>(null);
  const [importedFeatures, setImportedFeatures] = useState<DrawnFeature[]>([]);
  const [rangeReportFeature, setRangeReportFeature] = useState<DrawnFeature | "all" | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toLocaleDateString("en-CA"));

  const {
    db,
    drawnFeatures,
    handleFeatureAdded,
    handleRenameFeature,
    handleUpdateFeatureDescription,
    handleUpdateFeatureColor,
    handleToggleFeatureLock,
    handleSaveDailyLog,
  } = useFeatureDB();

  const { hiddenFeatures, handleToggleFeatureVisibility, handleToggleFeaturesVisibility } = useFeatureVisibility();
  const { sortedDrawnFeatures, handleReorderFeature } = useFeatureOrder(drawnFeatures);
  const { handleExportGeoJSON, handleImportGeoJSON } = useGeoJSONIO(db, drawnFeatures, setImportedFeatures);

  const handleFeatureDeleted = async (id: number): Promise<void> => {
    setRemoveFeatureId({ id, timestamp: Date.now() });
    if (!db) return;
    try {
      const doc = await db.features.findOne(String(id)).exec();
      if (doc) await doc.remove();
    } catch (e) {
      console.warn("RxDB: Conflict during delete ignored safely", e);
    }
  };

  const handleToggleLayer = (layerName: keyof LayerVisibility): void => {
    setLayerVisibility((prev) => ({ ...prev, [layerName]: !prev[layerName] }));
  };

  return (
    <div className="app-container">
      <MapComponent
        apiKey={apiKey}
        activeCity={activeCity}
        activeBasemap="satellite-free"
        layerVisibility={layerVisibility}
        onFeatureAdded={handleFeatureAdded}
        onFeatureDeleted={handleFeatureDeleted}
        zoomToFeature={zoomToFeature}
        removeFeatureId={removeFeatureId}
        importedFeatures={importedFeatures}
        drawnFeatures={sortedDrawnFeatures}
        hiddenFeatures={hiddenFeatures}
        onSaveDailyLog={handleSaveDailyLog}
        onOpenRangeReport={(feat) => setRangeReportFeature(feat)}
        onToggleFeatureLock={handleToggleFeatureLock}
        onRenameFeature={handleRenameFeature}
        onUpdateFeatureDescription={handleUpdateFeatureDescription}
        onUpdateFeatureColor={handleUpdateFeatureColor}
        onZoomToFeature={setZoomToFeature}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
      />

      <FloatingSearchBar
        drawnFeatures={sortedDrawnFeatures}
        onZoomToFeature={setZoomToFeature}
        showSidebar={showSidebar}
      />

      <GlobalStatsWidget
        drawnFeatures={sortedDrawnFeatures}
        selectedDate={selectedDate}
      />

      <DateTimeline
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      <button
        className={`sidebar-toggle ${!showSidebar ? "collapsed" : ""}`}
        onClick={() => setShowSidebar((prev) => !prev)}
        title={showSidebar ? "Ocultar panel lateral" : "Mostrar panel lateral"}
      >
        {showSidebar ? <ChevronLeft size={18} /> : <Menu size={18} />}
      </button>

      <Sidebar
        activeCity={activeCity}
        layerVisibility={layerVisibility}
        onToggleLayer={handleToggleLayer}
        drawnFeatures={sortedDrawnFeatures}
        onRenameFeature={handleRenameFeature}
        onDeleteFeature={handleFeatureDeleted}
        onZoomToFeature={setZoomToFeature}
        onExportGeoJSON={handleExportGeoJSON}
        onImportGeoJSON={handleImportGeoJSON}
        hiddenFeatures={hiddenFeatures}
        onToggleFeatureVisibility={handleToggleFeatureVisibility}
        onToggleFeaturesVisibility={handleToggleFeaturesVisibility}
        onReorderFeature={handleReorderFeature}
        onUpdateFeatureDescription={handleUpdateFeatureDescription}
        onToggleFeatureLock={handleToggleFeatureLock}
        onSaveDailyLog={handleSaveDailyLog}
        onOpenRangeReport={(feat) => setRangeReportFeature(feat)}
        className={showSidebar ? "" : "collapsed"}
      />

      <RangeReportModal
        feat={rangeReportFeature}
        allFeatures={sortedDrawnFeatures.filter((f) => f.type === "point")}
        onClose={() => setRangeReportFeature(null)}
        onSaveDailyLog={handleSaveDailyLog}
      />
    </div>
  );
}

export default App;

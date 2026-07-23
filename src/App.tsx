import { useState } from "react";
import MapComponent from "./components/MapComponent";
import Sidebar from "./components/Sidebar";
import { ChevronLeft, Menu } from "lucide-react";
import { RangeReportModal } from "./components/RangeReportModal";
import { ImportPreviewModal } from "./components/ImportPreviewModal";
import { FloatingSearchBar } from "./components/FloatingSearchBar";
import { GlobalStatsWidget } from "./components/GlobalStatsWidget";
import { DateTimeline } from "./components/DateTimeline";
import type { DrawnFeature, LayerVisibility, RemoveFeatureId, DepartmentView } from "./types";
import type { ParsedFeature } from "./hooks/useGeoJSONIO";
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
  const [zoomToCoords, setZoomToCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [removeFeatureId, setRemoveFeatureId] = useState<RemoveFeatureId | null>(null);
  const [importedFeatures, setImportedFeatures] = useState<DrawnFeature[]>([]);
  const [rangeReportFeature, setRangeReportFeature] = useState<DrawnFeature | "all" | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toLocaleDateString("en-CA"));
  const [importPreview, setImportPreview] = useState<ParsedFeature[] | null>(null);
  const [activeDepartment, setActiveDepartment] = useLocalStorageState<DepartmentView>("pc_active_department", "pc");

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
  const { handleExportGeoJSON, parseAndCheckDuplicates, handleImportFeatures } = useGeoJSONIO(db, drawnFeatures, setImportedFeatures);

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

  const handleGoToCoords = (lat: number, lon: number) => {
    setZoomToCoords({ lat, lon });
  };

  const handleCreatePointAtCoords = async (lat: number, lon: number) => {
    const id = Date.now();
    const feat: DrawnFeature = {
      id,
      title: `Punto ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      type: "point",
      color: "#3b82f6",
      geojsonGeometry: { type: "Point", coordinates: [lon, lat] },
    };
    await handleFeatureAdded(feat);
    setZoomToFeature(feat);
  };

  const handleImportPreview = (text: string) => {
    const parsed = parseAndCheckDuplicates(text);
    if (!parsed || parsed.length === 0) {
      alert("No se encontraron geometrías válidas en el archivo.");
      return;
    }
    setImportPreview(parsed);
  };

  const handleImportConfirmed = async (features: ParsedFeature[]) => {
    const result = await handleImportFeatures(features);
    setImportPreview(null);
    if (result.imported > 0) {
      const parts = [`Se importaron ${result.imported} geometrías`];
      if (result.skipped > 0) parts.push(`${result.skipped} omitida(s)`);
      alert(parts.join(". ") + ".");
    }
  };

  return (
    <div className="app-container">
      <MapComponent
        apiKey={apiKey}
        activeCity={activeCity}
        activeBasemap="satellite-free"
        layerVisibility={layerVisibility}
        onToggleLayer={handleToggleLayer}
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
        zoomToCoords={zoomToCoords}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
        activeDepartment={activeDepartment}
        showSidebar={showSidebar}
      />

      <FloatingSearchBar
        drawnFeatures={sortedDrawnFeatures}
        onZoomToFeature={setZoomToFeature}
        onGoToCoords={handleGoToCoords}
        onCreatePointAtCoords={handleCreatePointAtCoords}
        showSidebar={showSidebar}
      />

      <GlobalStatsWidget
        drawnFeatures={sortedDrawnFeatures}
        selectedDate={selectedDate}
        activeDepartment={activeDepartment}
        showSidebar={showSidebar}
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
        onImportPreview={handleImportPreview}
        hiddenFeatures={hiddenFeatures}
        onToggleFeatureVisibility={handleToggleFeatureVisibility}
        onToggleFeaturesVisibility={handleToggleFeaturesVisibility}
        onReorderFeature={handleReorderFeature}
        onUpdateFeatureDescription={handleUpdateFeatureDescription}
        onToggleFeatureLock={handleToggleFeatureLock}
        onSaveDailyLog={handleSaveDailyLog}
        onOpenRangeReport={(feat) => setRangeReportFeature(feat)}
        activeDepartment={activeDepartment}
        onDepartmentChange={setActiveDepartment}
        onGoToCoords={handleGoToCoords}
        onCreatePointAtCoords={handleCreatePointAtCoords}
        className={showSidebar ? "" : "collapsed"}
      />

      <RangeReportModal
        feat={rangeReportFeature}
        allFeatures={sortedDrawnFeatures.filter((f) => f.type === "point")}
        onClose={() => setRangeReportFeature(null)}
        onSaveDailyLog={handleSaveDailyLog}
        activeDepartment={activeDepartment}
      />

      {importPreview && (
        <ImportPreviewModal
          features={importPreview}
          onImport={handleImportConfirmed}
          onClose={() => setImportPreview(null)}
        />
      )}
    </div>
  );
}

export default App;

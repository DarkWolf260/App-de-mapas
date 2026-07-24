import { useState, useMemo } from 'react';
import MapComponent from './components/MapComponent';
import { Sidebar } from './components/Sidebar';
import type { MapPoint, MapArea } from './components/Sidebar';
import { GlobalStatsWidget } from './components/GlobalStatsWidget';
import { DateTimeline } from './components/DateTimeline';
import { FloatingSearchBar } from './components/FloatingSearchBar';
import { RangeReportModal } from './components/RangeReportModal';
import { ImportPreviewModal } from './components/ImportPreviewModal';
import { 
  Menu,
  ChevronLeft
} from 'lucide-react';
import { useFeatureDB } from './hooks/useFeatureDB';
import { useFeatureVisibility } from './hooks/useFeatureVisibility';
import { useFeatureOrder } from './hooks/useFeatureOrder';
import { useGeoJSONIO, ParsedFeature } from './hooks/useGeoJSONIO';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import type { DepartmentView, DrawnFeature, LayerVisibility, RemoveFeatureId } from './types';
import './App.css';

const CATEGORY_COLORS = {
  riesgo: '#ef4444',
  refugio: '#10b981',
  salud: '#3b82f6',
  operativo: '#f97316',
  general: '#a855f7'
};

function App() {
  const apiKey: string = import.meta.env.VITE_ARCGIS_API_KEY || '';
  const [activeCity] = useState<string>('venezuela');
  
  const [layerVisibility, setLayerVisibility] = useLocalStorageState<LayerVisibility>('pc_layer_visibility', {
    sketch: true,
    polygonLabels: true,
    pointLabels: true,
    basemapLabels: true,
    hideNestedAreas: false,
    allowLabelOverlap: false,
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toLocaleDateString('en-CA'));
  const [activeDepartment, setActiveDepartment] = useLocalStorageState<DepartmentView>('pc_active_department', 'pc');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [zoomToFeature, setZoomToFeature] = useState<DrawnFeature | null>(null);
  const [zoomToCoords, setZoomToCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [removeFeatureId, setRemoveFeatureId] = useState<RemoveFeatureId | null>(null);
  const [importedFeatures, setImportedFeatures] = useState<DrawnFeature[]>([]);
  const [rangeReportFeature, setRangeReportFeature] = useState<DrawnFeature | 'all' | null>(null);
  const [importPreview, setImportPreview] = useState<ParsedFeature[] | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Conexión con RxDB
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

  const { hiddenFeatures } = useFeatureVisibility();
  const { sortedDrawnFeatures } = useFeatureOrder(drawnFeatures);
  const { handleImportFeatures } = useGeoJSONIO(db, drawnFeatures, setImportedFeatures);

  // Mapeo a Puntos de COE
  const points: MapPoint[] = useMemo(() => {
    return sortedDrawnFeatures
      .filter((f) => f.type === 'point' || f.geojsonGeometry?.type === 'Point')
      .map((f) => {
        const coords = f.geojsonGeometry?.coordinates as number[] | undefined;
        return {
          id: String(f.id),
          name: f.title || 'Punto Sin Nombre',
          description: f.description || '',
          category: 'general',
          color: f.color || CATEGORY_COLORS.salud,
          coordinates: {
            longitude: coords?.[0] ?? -66.9331,
            latitude: coords?.[1] ?? 10.6000
          },
          createdAt: Number(f.id) || Date.now()
        };
      });
  }, [sortedDrawnFeatures]);

  // Mapeo a Áreas de COE
  const areas: MapArea[] = useMemo(() => {
    return sortedDrawnFeatures
      .filter((f) => f.type === 'polygon' || f.geojsonGeometry?.type === 'Polygon')
      .map((f) => {
        const rings = f.geojsonGeometry?.coordinates as number[][][] | undefined;
        return {
          id: String(f.id),
          name: f.title || 'Área Sin Nombre',
          description: f.description || '',
          category: 'general',
          color: f.color || CATEGORY_COLORS.riesgo,
          rings: rings || [],
          areaHectares: 0,
          createdAt: Number(f.id) || Date.now()
        };
      });
  }, [sortedDrawnFeatures]);

  const handleToggleLayer = (layerName: keyof LayerVisibility): void => {
    setLayerVisibility((prev) => ({ ...prev, [layerName]: !prev[layerName] }));
  };

  const handleFeatureDeleted = async (id: number): Promise<void> => {
    setRemoveFeatureId({ id, timestamp: Date.now() });
    if (!db) return;
    try {
      const doc = await db.features.findOne(String(id)).exec();
      if (doc) await doc.remove();
    } catch (e) {
      console.warn("RxDB: Delete handled safely", e);
    }
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

  const handleImportConfirmed = async (features: ParsedFeature[]) => {
    const result = await handleImportFeatures(features);
    setImportPreview(null);
    if (result.imported > 0) {
      alert(`Se importaron ${result.imported} geometrías con éxito.`);
    }
  };

  const handleSelectItem = (id: string, _type: 'point' | 'area') => {
    setSelectedItemId(id);
    const feat = sortedDrawnFeatures.find((f) => String(f.id) === id);
    if (feat) {
      setZoomToFeature(feat);
    }
  };

  const handleDeleteItem = async (id: string, _type: 'point' | 'area') => {
    const numId = Number(id);
    if (!isNaN(numId)) {
      await handleFeatureDeleted(numId);
    }
  };

  const handleImportData = async (data: { points: MapPoint[]; areas: MapArea[] }) => {
    if (data.points) {
      for (const p of data.points) {
        await handleFeatureAdded({
          id: Number(p.id) || Date.now() + Math.floor(Math.random() * 1000),
          title: p.name,
          type: 'point',
          description: p.description,
          color: p.color,
          geojsonGeometry: {
            type: 'Point',
            coordinates: [p.coordinates.longitude, p.coordinates.latitude]
          }
        });
      }
    }
    if (data.areas) {
      for (const a of data.areas) {
        await handleFeatureAdded({
          id: Number(a.id) || Date.now() + Math.floor(Math.random() * 1000),
          title: a.name,
          type: 'polygon',
          description: a.description,
          color: a.color,
          geojsonGeometry: {
            type: 'Polygon',
            coordinates: a.rings
          }
        });
      }
    }
  };

  return (
    <div className="app-container">
      {/* Botón para colapsar / expandir Sidebar */}
      <button 
        className={`toggle-sidebar-btn ${sidebarCollapsed ? 'collapsed' : ''}`}
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        title={sidebarCollapsed ? "Mostrar panel lateral" : "Ocultar panel lateral"}
      >
        {sidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Widget de Estadísticas de COE */}
      <GlobalStatsWidget
        drawnFeatures={sortedDrawnFeatures}
        selectedDate={selectedDate}
        activeDepartment={activeDepartment}
        showSidebar={!sidebarCollapsed}
      />

      {/* Buscador Flotante de COE */}
      <FloatingSearchBar
        drawnFeatures={sortedDrawnFeatures}
        onZoomToFeature={setZoomToFeature}
        onGoToCoords={handleGoToCoords}
        onCreatePointAtCoords={handleCreatePointAtCoords}
        showSidebar={!sidebarCollapsed}
      />

      {/* Panel Lateral con Estilo COE */}
      <Sidebar
        points={points}
        areas={areas}
        onSelectItem={handleSelectItem}
        onDeleteItem={handleDeleteItem}
        onImportData={handleImportData}
        selectedItemId={selectedItemId}
        className={sidebarCollapsed ? 'collapsed' : ''}
        activeDepartment={activeDepartment}
        onDepartmentChange={setActiveDepartment}
      />

      {/* Mapa Principal de ArcGIS con Comportamiento Completo de Puntos y Polígonos */}
      <div className="map-viewport">
        <MapComponent
          apiKey={apiKey}
          activeCity={activeCity}
          activeBasemap="hybrid"
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
          showSidebar={!sidebarCollapsed}
        />
      </div>

      {/* Línea de tiempo inferior */}
      <DateTimeline
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Modal de Informe de Rango */}
      {rangeReportFeature && (
        <RangeReportModal
          feat={rangeReportFeature}
          allFeatures={sortedDrawnFeatures}
          onClose={() => setRangeReportFeature(null)}
          onSaveDailyLog={handleSaveDailyLog}
          activeDepartment={activeDepartment}
        />
      )}

      {/* Modal de Vista Previa de Importación */}
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

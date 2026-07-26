import { useState, useMemo } from 'react';
import MapComponent from './components/MapComponent';
import { Sidebar } from './components/Sidebar';
import type { MapPoint, MapArea } from './components/Sidebar';
import { GlobalStatsWidget } from './components/GlobalStatsWidget';
import { DateTimeline } from './components/DateTimeline';
import { FloatingSearchBar } from './components/FloatingSearchBar';
import { RangeReportModal } from './components/RangeReportModal';
import { ImportPreviewModal } from './components/ImportPreviewModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { AuthModal } from './components/AuthModal';
import { WorkGroupsModal } from './components/WorkGroupsModal';
import { useAuth } from './hooks/useAuth';
import { 
  Menu,
  ChevronLeft
} from 'lucide-react';
import { useFeatureDB } from './hooks/useFeatureDB';
import { useFeatureVisibility } from './hooks/useFeatureVisibility';
import { useFeatureOrder } from './hooks/useFeatureOrder';
import { useGeoJSONIO, ParsedFeature } from './hooks/useGeoJSONIO';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { useWorkGroups } from './hooks/useWorkGroups';
import type { DepartmentView, DrawnFeature, LayerVisibility, RemoveFeatureId, WorkGroup } from './types';
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
  const { isAdmin, isOperador } = useAuth();
  
  const [layerVisibility, setLayerVisibility] = useLocalStorageState<LayerVisibility>('pc_layer_visibility', {
    sketch: true,
    polygonLabels: true,
    pointLabels: true,
    basemapLabels: false,
    hideNestedAreas: true,
    allowLabelOverlap: true,
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string; type?: string } | null>(null);
  const [showWorkGroups, setShowWorkGroups] = useState(false);
  const { workGroups, saveWorkGroups: setWorkGroups } = useWorkGroups();

  // Conexión con Supabase en tiempo real
  const {
    drawnFeatures,
    handleFeatureAdded,
    handleRenameFeature,
    handleUpdateFeatureDescription,
    handleUpdateFeatureColor,
    handleToggleFeatureLock,
    handleUpdateFeatureCollapsed,
    handleSaveDailyLog,
    handleFeatureDeleted,
    globalNovedades,
    fetchGlobalNovedades,
    saveGlobalNovedad,
    deleteGlobalNovedad,
    refreshFeatures,
  } = useFeatureDB();

  const { hiddenFeatures } = useFeatureVisibility();
  const { sortedDrawnFeatures } = useFeatureOrder(drawnFeatures);
  const { handleImportFeatures } = useGeoJSONIO(null, drawnFeatures, setImportedFeatures);

  // Mapeo a Puntos de COE para Sidebar
  const points: MapPoint[] = useMemo(() => {
    return sortedDrawnFeatures
      .filter((f) => f.type === 'point' || f.geojsonGeometry?.type === 'Point')
      .map((f) => {
        const coords = f.geojsonGeometry?.coordinates as number[] | undefined;
        return {
          id: String(f.id),
          name: f.title || 'Punto Sin Nombre',
          description: f.description || '',
          category: 'general' as const,
          color: f.color || CATEGORY_COLORS.general,
          isCollapsed: !!f.isCollapsed,
          collapsedCount: f.collapsedCount,
          coordinates: {
            longitude: coords ? coords[0] : -66.9331,
            latitude: coords ? coords[1] : 10.6000,
          },
          createdAt: Number(f.id) || Date.now(),
        };
      });
  }, [sortedDrawnFeatures]);

  // Mapeo a Áreas de COE para Sidebar
  const areas: MapArea[] = useMemo(() => {
    return sortedDrawnFeatures
      .filter((f) => f.type === 'polygon' || f.geojsonGeometry?.type === 'Polygon')
      .map((f) => {
        const rings = f.geojsonGeometry?.coordinates as number[][][] | undefined;
        return {
          id: String(f.id),
          name: f.title || 'Área Sin Nombre',
          description: f.description || '',
          category: 'riesgo' as const,
          color: f.color || CATEGORY_COLORS.riesgo,
          rings: rings || [],
          areaHectares: 0,
          createdAt: Number(f.id) || Date.now(),
        };
      });
  }, [sortedDrawnFeatures]);

  const handleSelectItem = (id: string, _type: 'point' | 'area') => {
    setSelectedItemId(id);
    const feat = sortedDrawnFeatures.find((f) => String(f.id) === id);
    if (feat) {
      setZoomToFeature(feat);
    }
  };

  const handleDeleteItem = (id: string | number, _type?: 'point' | 'area') => {
    if (!isAdmin) return;
    const numId = Number(id);
    const feat = sortedDrawnFeatures.find((f) => String(f.id) === String(id));
    setDeleteTarget({
      id: isNaN(numId) ? (id as unknown as number) : numId,
      title: feat?.title || 'este elemento',
      type: feat?.type || _type,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    handleFeatureDeleted(deleteTarget.id);
    setRemoveFeatureId({ id: deleteTarget.id, timestamp: Date.now() });
    setDeleteTarget(null);
  };

  const handleToggleLayer = (layerName: keyof LayerVisibility) => {
    setLayerVisibility({
      ...layerVisibility,
      [layerName]: !layerVisibility[layerName]
    });
  };

  const handleImportData = (data: { points: MapPoint[]; areas: MapArea[] }) => {
    if (!isAdmin) return;
    if (data.points) {
      for (const p of data.points) {
        handleFeatureAdded({
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
        handleFeatureAdded({
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

  const handleImportConfirmed = (featuresToImport: ParsedFeature[]) => {
    if (!isAdmin) return;
    featuresToImport.forEach((f) => {
      handleFeatureAdded({
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: f.title,
        type: f.type,
        color: f.color || '#3b82f6',
        geojsonGeometry: f.geometry,
      });
    });
    setImportPreview(null);
  };

  const handleGoToCoords = (lat: number, lon: number) => {
    setZoomToCoords({ lat, lon });
  };

  const handleCreatePointAtCoords = (lat: number, lon: number) => {
    if (!isAdmin) return;
    const newPoint: DrawnFeature = {
      id: Date.now(),
      title: `Punto ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      type: 'point',
      color: '#3b82f6',
      geojsonGeometry: {
        type: 'Point',
        coordinates: [lon, lat]
      }
    };
    handleFeatureAdded(newPoint);
    setZoomToFeature(newPoint);
  };

  return (
    <div className="app-container">
      {/* Botón Discreto de Login de Administrador (Top-Right al lado de los controles de zoom) */}
      <div style={{ position: "absolute", top: "16px", right: "65px", zIndex: 130, pointerEvents: "auto" }}>
        <AuthModal />
      </div>

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
        isAdmin={isAdmin}
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
          onRefreshFeatures={refreshFeatures}
          onOpenRangeReport={(feat) => setRangeReportFeature(feat)}
          onOpenWorkGroups={() => setShowWorkGroups(true)}
          onToggleFeatureLock={handleToggleFeatureLock}
          onRenameFeature={handleRenameFeature}
          onUpdateFeatureDescription={handleUpdateFeatureDescription}
          onUpdateFeatureColor={handleUpdateFeatureColor}
          onUpdateFeatureCollapsed={handleUpdateFeatureCollapsed}
          onZoomToFeature={setZoomToFeature}
          zoomToCoords={zoomToCoords}
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
          activeDepartment={activeDepartment}
          showSidebar={!sidebarCollapsed}
          isAdmin={isAdmin}
          isOperador={isOperador}
          workGroups={workGroups}
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
          workGroups={workGroups}
          onClose={() => setRangeReportFeature(null)}
          onSaveDailyLog={handleSaveDailyLog}
          activeDepartment={activeDepartment}
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
          globalNovedades={globalNovedades}
          onFetchGlobalNovedades={fetchGlobalNovedades}
          onSaveGlobalNovedad={saveGlobalNovedad}
          onDeleteGlobalNovedad={deleteGlobalNovedad}
          onRefreshFeatures={refreshFeatures}
        />
      )}

      {/* Modal Directorio de Grupos de Trabajo */}
      {showWorkGroups && (
        <WorkGroupsModal
          groups={workGroups}
          onSave={setWorkGroups}
          onClose={() => setShowWorkGroups(false)}
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

      {/* Modal Personalizado de Confirmación de Eliminación */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        itemTitle={deleteTarget?.title}
        itemType={deleteTarget?.type}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default App;

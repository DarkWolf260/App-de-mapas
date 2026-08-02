import { useState, useMemo } from "react";
import { useFeatureDB } from "../hooks/useFeatureDB";
import { useFeatureVisibility } from "../hooks/useFeatureVisibility";
import { useFeatureOrder } from "../hooks/useFeatureOrder";
import { useGeoJSONIO, ParsedFeature } from "../hooks/useGeoJSONIO";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import type { DepartmentView, DrawnFeature, LayerVisibility, RemoveFeatureId } from "../types";
import type { MapPoint, MapArea } from "../components/Sidebar";

const CATEGORY_COLORS = {
  riesgo: '#ef4444',
  refugio: '#10b981',
  salud: '#3b82f6',
  operativo: '#f97316',
  general: '#a855f7'
};

export function useAppState(isAdmin: boolean) {
  const [layerVisibility, setLayerVisibility] = useLocalStorageState<LayerVisibility>('pc_layer_visibility', {
    sketch: true,
    polygonLabels: true,
    pointLabels: true,
    basemapLabels: false,
    hideNestedAreas: true,
    allowLabelOverlap: true,
    svgOverlay: false,
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
  const [showAccumulated, setShowAccumulated] = useState(false);
  const [showPoints, setShowPoints] = useState(true);
  const [showAreas, setShowAreas] = useState(true);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [mapInfoOpen, setMapInfoOpen] = useState(false);

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
    updateGlobalNovedad,
    dailyActivity,
    fetchDailyActivity,
    saveDailyActivity,
    refreshFeatures,
  } = useFeatureDB();

  const { hiddenFeatures, handleToggleFeatureVisibility } = useFeatureVisibility();
  const { sortedDrawnFeatures } = useFeatureOrder(drawnFeatures);
  const { handleImportFeatures: _handleImportFeatures } = useGeoJSONIO(null, drawnFeatures, setImportedFeatures);

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
    if (feat) setZoomToFeature(feat);
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
    setLayerVisibility({ ...layerVisibility, [layerName]: !layerVisibility[layerName] });
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
      geojsonGeometry: { type: 'Point', coordinates: [lon, lat] },
    };
    handleFeatureAdded(newPoint);
    setZoomToFeature(newPoint);
  };

  const handleImportData = (data: { points: MapPoint[]; areas: MapArea[] }) => {
    if (!isAdmin) return;
    const existingTitles = new Set(drawnFeatures.map((f) => `${f.title}|${f.type}`));
    if (data.points) {
      for (const p of data.points) {
        const key = `${p.name}|point`;
        if (existingTitles.has(key)) continue;
        existingTitles.add(key);
        handleFeatureAdded({
          id: Number(p.id) || Date.now() + Math.floor(Math.random() * 1000),
          title: p.name,
          type: 'point',
          description: p.description,
          color: p.color,
          geojsonGeometry: { type: 'Point', coordinates: [p.coordinates.longitude, p.coordinates.latitude] },
        });
      }
    }
    if (data.areas) {
      for (const a of data.areas) {
        const key = `${a.name}|polygon`;
        if (existingTitles.has(key)) continue;
        existingTitles.add(key);
        handleFeatureAdded({
          id: Number(a.id) || Date.now() + Math.floor(Math.random() * 1000),
          title: a.name,
          type: 'polygon',
          description: a.description,
          color: a.color,
          geojsonGeometry: { type: 'Polygon', coordinates: a.rings },
        });
      }
    }
  };

  return {
    layerVisibility,
    setLayerVisibility,
    selectedDate,
    setSelectedDate,
    activeDepartment,
    setActiveDepartment,
    sidebarCollapsed,
    setSidebarCollapsed,
    zoomToFeature,
    setZoomToFeature,
    zoomToCoords,
    setZoomToCoords,
    removeFeatureId,
    setRemoveFeatureId,
    importedFeatures,
    setImportedFeatures,
    rangeReportFeature,
    setRangeReportFeature,
    importPreview,
    setImportPreview,
    selectedItemId,
    setSelectedItemId,
    deleteTarget,
    setDeleteTarget,
    showAccumulated,
    setShowAccumulated,
    showPoints,
    setShowPoints,
    showAreas,
    setShowAreas,
    dashboardOpen,
    setDashboardOpen,
    mapInfoOpen,
    setMapInfoOpen,
    drawnFeatures: sortedDrawnFeatures,
    hiddenFeatures,
    points,
    areas,
    globalNovedades,
    handleFeatureAdded,
    handleRenameFeature,
    handleUpdateFeatureDescription,
    handleUpdateFeatureColor,
    handleToggleFeatureLock,
    handleUpdateFeatureCollapsed,
    handleSaveDailyLog,
    handleFeatureDeleted,
    fetchGlobalNovedades,
    saveGlobalNovedad,
    deleteGlobalNovedad,
    updateGlobalNovedad,
    dailyActivity,
    fetchDailyActivity,
    saveDailyActivity,
    refreshFeatures,
    handleToggleFeatureVisibility,
    handleSelectItem,
    handleDeleteItem,
    handleConfirmDelete,
    handleToggleLayer,
    handleImportConfirmed,
    handleGoToCoords,
    handleCreatePointAtCoords,
    handleImportData,
  };
}

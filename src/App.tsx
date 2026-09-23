import { useState, useEffect, useMemo } from 'react';
import MapComponent from './components/MapComponent';
import { Sidebar } from './components/Sidebar';
import { GlobalStatsWidget } from './components/GlobalStatsWidget';
import { DateTimeline } from './components/DateTimeline';
import { RangeReportModal } from './components/RangeReportModal';
import { Toast } from './components/Toast';
import { ImportPreviewModal } from './components/ImportPreviewModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { useAuth } from './hooks/useAuth';
import { useAppState } from './hooks/useAppState';
import { OperationalProvider, type OperationalContextValue } from './context/OperationalContext';
import { MapProvider, type MapContextValue } from './context/MapContext';
import { MobileBottomBar } from './components/MobileBottomBar';
import { MobilePersonalSheet } from './components/MobilePersonalSheet';
import { MobileSettingsSheet } from './components/MobileSettingsSheet';
import { MobileLayersSheet } from './components/MobileLayersSheet';
import { Sheet } from './components/Sheet';
import { UserNavMenu } from './components/UserNavMenu';
import { Activity, Menu } from 'lucide-react';
import { fetchInspecciones } from './services/inspeccionService';
import type { InspeccionRecord } from './types';
import './App.css';

function App() {
  const activeCity = 'venezuela';
  const { isAdmin, isOperador, isAuthenticated, isSuspended, permissions, loading } = useAuth();
  const canEdit = isAuthenticated && (isAdmin || isOperador || !!permissions?.edit_map);
  const state = useAppState(canEdit);

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [mobilePanel, setMobilePanel] = useState<'personal' | 'settings' | 'layers' | null>(null);
  const [inspeccionesRecords, setInspeccionesRecords] = useState<InspeccionRecord[]>([]);

  useEffect(() => {
    fetchInspecciones().then((records) => setInspeccionesRecords(records));
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile) {
      state.setSidebarCollapsed(true);
      state.setActiveDepartment('mixto');
    }
  }, [isMobile]);

  // Operational Context Value
  const operationalValue: OperationalContextValue = useMemo(() => ({
    drawnFeatures: state.drawnFeatures,
    handleFeatureAdded: state.handleFeatureAdded,
    handleRenameFeature: state.handleRenameFeature,
    handleUpdateFeatureDescription: state.handleUpdateFeatureDescription,
    handleUpdateFeatureColor: state.handleUpdateFeatureColor,
    handleToggleFeatureLock: state.handleToggleFeatureLock,
    handleUpdateFeatureCollapsed: state.handleUpdateFeatureCollapsed,
    handleSaveDailyLog: state.handleSaveDailyLog,
    handleFeatureDeleted: state.handleFeatureDeleted,
    globalNovedades: state.globalNovedades,
    fetchGlobalNovedades: state.fetchGlobalNovedades,
    saveGlobalNovedad: state.saveGlobalNovedad,
    deleteGlobalNovedad: state.deleteGlobalNovedad,
    updateGlobalNovedad: state.updateGlobalNovedad,
    dailyActivity: state.dailyActivity,
    fetchDailyActivity: state.fetchDailyActivity,
    saveDailyActivity: state.saveDailyActivity,
    refreshFeatures: state.refreshFeatures,
    realtimeStatus: state.realtimeStatus,
    isRealtimeConnected: state.isRealtimeConnected,
  }), [
    state.drawnFeatures,
    state.handleFeatureAdded,
    state.handleRenameFeature,
    state.handleUpdateFeatureDescription,
    state.handleUpdateFeatureColor,
    state.handleToggleFeatureLock,
    state.handleUpdateFeatureCollapsed,
    state.handleSaveDailyLog,
    state.handleFeatureDeleted,
    state.globalNovedades,
    state.fetchGlobalNovedades,
    state.saveGlobalNovedad,
    state.deleteGlobalNovedad,
    state.updateGlobalNovedad,
    state.dailyActivity,
    state.fetchDailyActivity,
    state.saveDailyActivity,
    state.refreshFeatures,
    state.realtimeStatus,
    state.isRealtimeConnected,
  ]);

  // Map Context Value
  const mapValue: MapContextValue = useMemo(() => ({
    activeBasemap: state.activeBasemap,
    setActiveBasemap: state.setActiveBasemap,
    layerVisibility: state.layerVisibility,
    setLayerVisibility: state.setLayerVisibility,
    selectedDate: state.selectedDate,
    setSelectedDate: state.setSelectedDate,
    activeDepartment: state.activeDepartment,
    setActiveDepartment: state.setActiveDepartment,
    zoomToFeature: state.zoomToFeature,
    setZoomToFeature: state.setZoomToFeature,
    zoomToCoords: state.zoomToCoords,
    setZoomToCoords: state.setZoomToCoords,
    hiddenFeatures: state.hiddenFeatures,
    handleToggleFeatureVisibility: state.handleToggleFeatureVisibility,
    importedFeatures: state.importedFeatures,
    setImportedFeatures: state.setImportedFeatures,
    showAccumulated: state.showAccumulated,
    setShowAccumulated: state.setShowAccumulated,
    showPoints: state.showPoints,
    setShowPoints: state.setShowPoints,
    showAreas: state.showAreas,
    setShowAreas: state.setShowAreas,
  }), [
    state.activeBasemap,
    state.setActiveBasemap,
    state.layerVisibility,
    state.setLayerVisibility,
    state.selectedDate,
    state.setSelectedDate,
    state.activeDepartment,
    state.setActiveDepartment,
    state.zoomToFeature,
    state.setZoomToFeature,
    state.zoomToCoords,
    state.setZoomToCoords,
    state.hiddenFeatures,
    state.handleToggleFeatureVisibility,
    state.importedFeatures,
    state.setImportedFeatures,
    state.showAccumulated,
    state.setShowAccumulated,
    state.showPoints,
    state.setShowPoints,
    state.showAreas,
    state.setShowAreas,
  ]);

  if (loading) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
        color: "var(--text-muted)",
        fontFamily: "var(--font-sans)",
        zIndex: 99999,
      }}>
        <div style={{
          width: "36px",
          height: "36px",
          border: "3px solid rgba(255,255,255,0.08)",
          borderTopColor: "var(--accent-orange)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <OperationalProvider value={operationalValue}>
      <MapProvider value={mapValue}>
        <div className="app-container">
          {/* Mobile AppBar */}
          {isMobile && (
            <div
              className="mobile-appbar"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                height: "58px",
                background: "rgba(10, 15, 29, 0.95)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                zIndex: 130,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 14px",
                color: "#ffffff",
                fontFamily: "var(--font-sans)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  onClick={() => state.setSidebarCollapsed(!state.sidebarCollapsed)}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  title="Abrir menú"
                >
                  <Menu size={20} />
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #f97316, #ea580c)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 12px rgba(249,115,22,0.45)",
                      flexShrink: 0,
                    }}
                  >
                    <Activity size={19} color="#ffffff" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                    <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#ffffff", letterSpacing: "0.02em" }}>
                      COE La Guaira
                    </span>
                    <span style={{ fontSize: "0.68rem", color: "var(--accent-orange)", fontWeight: 700 }}>
                      SIG Protección Civil
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <UserNavMenu />
              </div>
            </div>
          )}

          {!isMobile && (
            <div style={{ position: "absolute", top: "16px", right: "65px", zIndex: 130, pointerEvents: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
              <UserNavMenu />
            </div>
          )}

          <GlobalStatsWidget
            drawnFeatures={state.drawnFeatures}
            selectedDate={state.selectedDate}
            activeDepartment={state.activeDepartment}
            showSidebar={!state.sidebarCollapsed}
            showAccumulated={state.showAccumulated}
            onToggleAccumulated={() => state.setShowAccumulated(!state.showAccumulated)}
            compact={isMobile}
            isInspeccionesMode={state.layerVisibility.inspecciones ?? false}
            inspeccionesRecords={inspeccionesRecords}
          />

          <Sidebar
            points={state.points}
            areas={state.areas}
            onSelectItem={state.handleSelectItem}
            onDeleteItem={state.handleDeleteItem}
            selectedItemId={state.selectedItemId}
            className={state.sidebarCollapsed ? 'collapsed' : ''}
            isCollapsed={state.sidebarCollapsed}
            onToggleCollapse={() => state.setSidebarCollapsed(!state.sidebarCollapsed)}
            isMobile={isMobile}
            activeDepartment={state.activeDepartment}
            onDepartmentChange={state.setActiveDepartment}
            showPoints={state.showPoints}
            showAreas={state.showAreas}
            onToggleShowPoints={() => state.setShowPoints(!state.showPoints)}
            onToggleShowAreas={() => state.setShowAreas(!state.showAreas)}
            layerVisibility={state.layerVisibility}
            onToggleLayer={state.handleToggleLayer}
            onCloseMobile={() => state.setSidebarCollapsed(true)}
            onGoToCoords={state.handleGoToCoords}
            onCreatePointAtCoords={state.handleCreatePointAtCoords}
            onZoomToFeature={state.setZoomToFeature}
            drawnFeatures={state.drawnFeatures}
          />

          <div className="map-wrapper" style={{ flex: 1, position: 'relative' }}>
            <MapComponent
              activeCity={activeCity}
              activeBasemap={state.activeBasemap}
              onSelectBasemap={state.setActiveBasemap}
              layerVisibility={state.layerVisibility}
              onToggleLayer={state.handleToggleLayer}
              onToggleAccumulated={() => state.setShowAccumulated(!state.showAccumulated)}
              onZoomToFeature={state.setZoomToFeature}
              drawnFeatures={state.drawnFeatures}
              hiddenFeatures={state.hiddenFeatures}
              zoomToFeature={state.zoomToFeature}
              removeFeatureId={state.removeFeatureId}
              importedFeatures={state.importedFeatures}
              zoomToCoords={state.zoomToCoords}
              actions={{
                onFeatureAdded: state.handleFeatureAdded,
                onFeatureDeleted: state.handleFeatureDeleted,
                onSaveDailyLog: state.handleSaveDailyLog,
                onToggleFeatureLock: state.handleToggleFeatureLock,
                onRenameFeature: state.handleRenameFeature,
                onUpdateFeatureDescription: state.handleUpdateFeatureDescription,
                onUpdateFeatureColor: state.handleUpdateFeatureColor,
                onUpdateFeatureCollapsed: state.handleUpdateFeatureCollapsed,
                onRefreshFeatures: state.refreshFeatures,
                onOpenRangeReport: (feat) => state.setRangeReportFeature(feat),
              }}
              ui={{
                selectedDate: state.selectedDate,
                onSelectedDateChange: state.setSelectedDate,
                activeDepartment: state.activeDepartment,
                showSidebar: !state.sidebarCollapsed,
                isAdmin,
                isOperador,
                isAuthenticated,
                isSuspended,
                permissions,
                showAccumulated: state.showAccumulated,
                showPoints: state.showPoints,
                showAreas: state.showAreas,
                sidebarOpen: !state.sidebarCollapsed,
                bitacoraOpen: state.rangeReportFeature !== null,
                onFeatureClick: () => state.setRangeReportFeature(null),
              }}
            />
          </div>

          <DateTimeline
            selectedDate={state.selectedDate}
            onDateChange={state.setSelectedDate}
          />

          {state.rangeReportFeature && (
            <RangeReportModal
              feat={state.rangeReportFeature}
              allFeatures={state.drawnFeatures}
              onClose={() => state.setRangeReportFeature(null)}
              onSaveDailyLog={state.handleSaveDailyLog}
              activeDepartment={state.activeDepartment}
              selectedDate={state.selectedDate}
              onSelectedDateChange={state.setSelectedDate}
              globalNovedades={state.globalNovedades}
              onFetchGlobalNovedades={state.fetchGlobalNovedades}
              onSaveGlobalNovedad={state.saveGlobalNovedad}
              onDeleteGlobalNovedad={state.deleteGlobalNovedad}
              onUpdateGlobalNovedad={state.updateGlobalNovedad}
              onRefreshFeatures={state.refreshFeatures}
              onNavigateToFeature={(feat) => {
                state.setRangeReportFeature(null);
                state.setZoomToFeature(feat);
              }}
              canEdit={isAuthenticated}
            />
          )}

          {state.importPreview && (
            <ImportPreviewModal
              features={state.importPreview}
              onImport={state.handleImportConfirmed}
              onClose={() => state.setImportPreview(null)}
            />
          )}

          <ConfirmDeleteModal
            isOpen={!!state.deleteTarget}
            itemTitle={state.deleteTarget?.title}
            itemType={state.deleteTarget?.type}
            onConfirm={state.handleConfirmDelete}
            onCancel={() => state.setDeleteTarget(null)}
          />

          <Toast />

          {isMobile && (
            <MobileBottomBar
              onOpenPersonal={() => setMobilePanel(mobilePanel === 'personal' ? null : 'personal')}
              onOpenLayers={() => setMobilePanel(mobilePanel === 'layers' ? null : 'layers')}
              onOpenBitacora={() => { setMobilePanel(null); state.setRangeReportFeature('all'); }}
              onOpenSettings={() => setMobilePanel(mobilePanel === 'settings' ? null : 'settings')}
            />
          )}

          {isMobile && mobilePanel === 'personal' && (
            <Sheet open={true} onClose={() => setMobilePanel(null)} height="65vh">
              <MobilePersonalSheet
                drawnFeatures={state.drawnFeatures}
                selectedDate={state.selectedDate}
                activeDepartment={state.activeDepartment}
                onSelectFeature={(feat) => { setMobilePanel(null); state.setZoomToFeature(feat); }}
              />
            </Sheet>
          )}

          {isMobile && mobilePanel === 'layers' && (
            <Sheet open={true} onClose={() => setMobilePanel(null)} height="60vh">
              <MobileLayersSheet
                layerVisibility={state.layerVisibility}
                onToggleLayer={state.handleToggleLayer}
              />
            </Sheet>
          )}

          {isMobile && mobilePanel === 'settings' && (
            <Sheet open={true} onClose={() => setMobilePanel(null)} height="55vh">
              <MobileSettingsSheet
                layerVisibility={state.layerVisibility}
                onToggleLayer={state.handleToggleLayer}
                canEditMap={isAuthenticated && (isAdmin || !!permissions?.edit_map)}
              />
            </Sheet>
          )}
        </div>
      </MapProvider>
    </OperationalProvider>
  );
}

export default App;

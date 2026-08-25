import { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import { Sidebar } from './components/Sidebar';
import { GlobalStatsWidget } from './components/GlobalStatsWidget';
import { DateTimeline } from './components/DateTimeline';
import { FloatingSearchBar } from './components/FloatingSearchBar';
import { RangeReportModal } from './components/RangeReportModal';
import { Toast } from './components/Toast';
import { ImportPreviewModal } from './components/ImportPreviewModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { useAuth } from './hooks/useAuth';
import { useAppState } from './hooks/useAppState';
import { MobileBottomBar } from './components/MobileBottomBar';
import { MobilePersonalSheet } from './components/MobilePersonalSheet';
import { MobileSettingsSheet } from './components/MobileSettingsSheet';
import { Sheet } from './components/Sheet';
import { UserNavMenu } from './components/UserNavMenu';
import { Menu, ChevronLeft } from 'lucide-react';
import { fetchInspecciones } from './services/inspeccionService';
import type { InspeccionRecord } from './types';
import './App.css';

function App() {
  const activeCity = 'venezuela';
  const { isAdmin, isOperador, isAuthenticated, isSuspended, permissions, loading } = useAuth();
  const state = useAppState(isAdmin);

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [mobilePanel, setMobilePanel] = useState<'personal' | 'settings' | null>(null);
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
    <div className="app-container">
      {!isMobile && (
        <div style={{ position: "absolute", top: "16px", right: "65px", zIndex: 130, pointerEvents: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <UserNavMenu />
        </div>
      )}

      {!isMobile && (
        <button
          className={`toggle-sidebar-btn ${state.sidebarCollapsed ? 'collapsed' : ''}`}
          onClick={() => state.setSidebarCollapsed(!state.sidebarCollapsed)}
          title={state.sidebarCollapsed ? "Mostrar panel lateral" : "Ocultar panel lateral"}
        >
          {state.sidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
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

      <FloatingSearchBar
        drawnFeatures={state.drawnFeatures}
        onZoomToFeature={state.setZoomToFeature}
        onGoToCoords={state.handleGoToCoords}
        onCreatePointAtCoords={state.handleCreatePointAtCoords}
        showSidebar={!state.sidebarCollapsed}
        canViewDetails={isAdmin || isOperador}
      />

      <Sidebar
        points={state.points}
        areas={state.areas}
        onSelectItem={state.handleSelectItem}
        onDeleteItem={state.handleDeleteItem}
        selectedItemId={state.selectedItemId}
        className={state.sidebarCollapsed ? 'collapsed' : ''}
        isMobile={isMobile}
        showPoints={state.showPoints}
        showAreas={state.showAreas}
        onToggleShowPoints={() => state.setShowPoints(!state.showPoints)}
        onToggleShowAreas={() => state.setShowAreas(!state.showAreas)}
        layerVisibility={state.layerVisibility}
        onToggleLayer={state.handleToggleLayer}
      />

      <div className="map-wrapper" style={{ flex: 1, position: 'relative' }}>
        <MapComponent
          activeCity={activeCity}
          activeBasemap="satellite-free"
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

      {isMobile && mobilePanel === 'settings' && (
        <Sheet open={true} onClose={() => setMobilePanel(null)} height="55vh">
          <MobileSettingsSheet
            layerVisibility={state.layerVisibility}
            onToggleLayer={state.handleToggleLayer}
          />
        </Sheet>
      )}
    </div>
  );
}

export default App;

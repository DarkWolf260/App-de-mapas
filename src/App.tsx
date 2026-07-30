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
import { AuthModal } from './components/AuthModal';
import { useAuth } from './hooks/useAuth';
import { useAppState } from './hooks/useAppState';
import { MobileBottomBar } from './components/MobileBottomBar';
import { MobilePersonalSheet } from './components/MobilePersonalSheet';
import { MobileSettingsSheet } from './components/MobileSettingsSheet';
import { Sheet } from './components/Sheet';
import { DashboardView } from './components/dashboard/DashboardView';
import { MapInfoModal } from './components/MapInfoModal';
import { Menu, ChevronLeft, LayoutDashboard, FileSpreadsheet } from 'lucide-react';
import './App.css';

function App() {
  const apiKey: string = import.meta.env.VITE_ARCGIS_API_KEY || '';
  const [activeCity] = ['venezuela'];
  const { isAdmin, isOperador, isAuthenticated } = useAuth();
  const state = useAppState(isAdmin);

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [mobilePanel, setMobilePanel] = useState<'personal' | 'settings' | null>(null);

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

  return (
    <div className="app-container">
      {!isMobile && (
      <div style={{ position: "absolute", top: "16px", right: "65px", zIndex: 130, pointerEvents: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          onClick={() => state.setMapInfoOpen(true)}
          title="Información del Mapa y Exportar a Excel"
          style={{
            height: "34px",
            padding: "0 12px",
            borderRadius: "10px",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            background: "rgba(10, 15, 28, 0.9)",
            color: "#38bdf8",
            fontSize: "0.76rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
          }}
        >
          <FileSpreadsheet size={16} />
          <span>Equipos & Excel</span>
        </button>
        <button
          onClick={() => state.setDashboardOpen(true)}
          title="Abrir dashboard de situación"
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            background: "rgba(10, 15, 28, 0.9)",
            color: "var(--color-info)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
            padding: 0,
          }}
        >
          <LayoutDashboard size={17} />
        </button>
        <AuthModal />
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
        activeDepartment={state.activeDepartment}
        onDepartmentChange={state.setActiveDepartment}
        isAdmin={isAdmin}
        showPoints={state.showPoints}
        onToggleShowPoints={() => state.setShowPoints(!state.showPoints)}
        showAreas={state.showAreas}
        onToggleShowAreas={() => state.setShowAreas(!state.showAreas)}
        hiddenFeatures={state.hiddenFeatures}
        onToggleFeatureVisibility={state.handleToggleFeatureVisibility}
        onImportData={state.handleImportData}
      />

      <div className="map-viewport">
        <MapComponent
          apiKey={apiKey}
          activeCity={activeCity}
          activeBasemap="hybrid"
          layerVisibility={state.layerVisibility}
          onToggleLayer={state.handleToggleLayer}
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

      {state.dashboardOpen && (
        <DashboardView
          drawnFeatures={state.drawnFeatures}
          selectedDate={state.selectedDate}
          onSelectedDateChange={state.setSelectedDate}
          onClose={() => state.setDashboardOpen(false)}
          canEdit={isAuthenticated}
          dailyActivity={state.dailyActivity}
          onFetchDailyActivity={state.fetchDailyActivity}
          onSaveDailyActivity={state.saveDailyActivity}
          map={
            <MapComponent
              bare
              apiKey={apiKey}
              activeCity={activeCity}
              activeBasemap="hybrid"
              layerVisibility={{ ...state.layerVisibility, sketch: false }}
              drawnFeatures={state.drawnFeatures}
              hiddenFeatures={state.hiddenFeatures}
              zoomToFeature={null}
              removeFeatureId={state.removeFeatureId}
              importedFeatures={state.importedFeatures}
              zoomToCoords={null}
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
              }}
              ui={{
                selectedDate: state.selectedDate,
                activeDepartment: state.activeDepartment,
                showSidebar: false,
                isAdmin: false,
                isOperador,
                isAuthenticated,
                showAccumulated: state.showAccumulated,
                showPoints: state.showPoints,
                showAreas: state.showAreas,
                sidebarOpen: false,
                bitacoraOpen: false,
              }}
            />
          }
        />
      )}

      {state.mapInfoOpen && (
        <MapInfoModal
          drawnFeatures={state.drawnFeatures}
          selectedDate={state.selectedDate}
          onSelectedDateChange={state.setSelectedDate}
          onClose={() => state.setMapInfoOpen(false)}
          activeDepartment={state.activeDepartment}
          canEdit={isAuthenticated}
        />
      )}

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

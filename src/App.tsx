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
import { Menu, ChevronLeft } from 'lucide-react';
import './App.css';

function App() {
  const apiKey: string = import.meta.env.VITE_ARCGIS_API_KEY || '';
  const [activeCity] = ['venezuela'];
  const { isAdmin, isOperador } = useAuth();
  const state = useAppState(isAdmin);

  return (
    <div className="app-container">
      <div style={{ position: "absolute", top: "16px", right: "65px", zIndex: 130, pointerEvents: "auto" }}>
        <AuthModal />
      </div>

      <button
        className={`toggle-sidebar-btn ${state.sidebarCollapsed ? 'collapsed' : ''}`}
        onClick={() => state.setSidebarCollapsed(!state.sidebarCollapsed)}
        title={state.sidebarCollapsed ? "Mostrar panel lateral" : "Ocultar panel lateral"}
      >
        {state.sidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
      </button>

      <GlobalStatsWidget
        drawnFeatures={state.drawnFeatures}
        selectedDate={state.selectedDate}
        activeDepartment={state.activeDepartment}
        showSidebar={!state.sidebarCollapsed}
        showAccumulated={state.showAccumulated}
        onToggleAccumulated={() => state.setShowAccumulated(!state.showAccumulated)}
      />

      <FloatingSearchBar
        drawnFeatures={state.drawnFeatures}
        onZoomToFeature={state.setZoomToFeature}
        onGoToCoords={state.handleGoToCoords}
        onCreatePointAtCoords={state.handleCreatePointAtCoords}
        showSidebar={!state.sidebarCollapsed}
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
    </div>
  );
}

export default App;

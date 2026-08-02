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
import { Menu, ChevronLeft, LogOut, FileSpreadsheet, User, ChevronDown, Shield } from 'lucide-react';
import './App.css';

function App() {
  const apiKey: string = import.meta.env.VITE_ARCGIS_API_KEY || '';
  const [activeCity] = ['venezuela'];
  const { isAdmin, isOperador, isAuthenticated, user, logout, loading } = useAuth();
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

  const [navMenuOpen, setNavMenuOpen] = useState(false);

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
          {isAuthenticated ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setNavMenuOpen(!navMenuOpen)}
                title="Menú de Módulos y Usuario"
                style={{
                  height: "34px",
                  padding: "0 12px",
                  borderRadius: "10px",
                  border: navMenuOpen ? "1px solid var(--accent-orange)" : "1px solid rgba(255, 255, 255, 0.18)",
                  background: "rgba(10, 15, 28, 0.95)",
                  color: "#f8fafc",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                <User size={14} style={{ color: "var(--accent-orange)" }} />
                <span style={{ maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email?.split("@")[0]}
                </span>
                <ChevronDown size={14} style={{ color: "var(--text-muted)", transform: navMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
              </button>

              {navMenuOpen && (
                <>
                  <div
                    style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 129 }}
                    onClick={() => setNavMenuOpen(false)}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "42px",
                      right: 0,
                      width: "230px",
                      background: "rgba(10, 15, 29, 0.96)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "12px",
                      padding: "6px",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      zIndex: 135,
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div style={{ padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: "4px" }}>
                      <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Módulos Disponibles</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--accent-orange)", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {user?.email}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        window.open('/consolidado', '_blank');
                        setNavMenuOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 10px",
                        background: "transparent",
                        border: "none",
                        borderRadius: "8px",
                        color: "#f8fafc",
                        fontSize: "0.74rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        fontFamily: "var(--font-sans)",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(56, 189, 248, 0.12)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "#38bdf8", padding: "6px", borderRadius: "6px" }}>
                        <FileSpreadsheet size={15} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "#38bdf8" }}>Módulo de Información</div>
                        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Pizarra Operacional y Equipos</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        window.open('/admin', '_blank');
                        setNavMenuOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 10px",
                        background: "transparent",
                        border: "none",
                        borderRadius: "8px",
                        color: "#f8fafc",
                        fontSize: "0.74rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        fontFamily: "var(--font-sans)",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(249, 115, 22, 0.12)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ background: "rgba(249, 115, 22, 0.15)", border: "1px solid rgba(249, 115, 22, 0.3)", color: "var(--accent-orange)", padding: "6px", borderRadius: "6px" }}>
                        <Shield size={15} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--accent-orange)" }}>Panel de Administración</div>
                        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Módulo de Gestión Central</div>
                      </div>
                    </button>

                    <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "4px 0" }} />

                    <button
                      onClick={() => {
                        logout();
                        setNavMenuOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 10px",
                        background: "transparent",
                        border: "none",
                        borderRadius: "8px",
                        color: "#ef4444",
                        fontSize: "0.74rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        fontFamily: "var(--font-sans)",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "6px", borderRadius: "6px" }}>
                        <LogOut size={14} />
                      </div>
                      <span style={{ fontWeight: 700 }}>Cerrar Sesión</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => window.location.href = '/login'}
              title="Iniciar sesion"
              style={{
                height: "34px",
                padding: "0 14px",
                borderRadius: "10px",
                border: "1px solid rgba(249, 115, 22, 0.4)",
                background: "rgba(10, 15, 28, 0.9)",
                color: "#f97316",
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
              <LogOut size={14} style={{ transform: "rotate(180deg)" }} />
              <span>Iniciar Sesion</span>
            </button>
          )}
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
          activeBasemap="satellite-free"
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

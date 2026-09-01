import React, { useState } from 'react';
import { DepartmentTabs } from './DepartmentTabs';
import type { DepartmentView } from '../types';
import { getLocalDateStr } from '../utils/dateUtils';
import {
  MapPin,
  Trash2,
  Download,
  Upload,
  Search,
  Map,
  Activity,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';
import { RealtimeStatusBadge } from './RealtimeStatusBadge';
import type { RealtimeChannelStatus } from '../repositories/interfaces';

export interface MapPoint {
  id: string;
  name: string;
  description: string;
  category: 'riesgo' | 'refugio' | 'salud' | 'operativo' | 'general';
  color: string;
  isCollapsed?: boolean;
  collapsedCount?: string | number;
  coordinates: {
    longitude: number;
    latitude: number;
  };
  createdAt: number;
}

export interface MapArea {
  id: string;
  name: string;
  description: string;
  category: 'riesgo' | 'refugio' | 'salud' | 'operativo' | 'general';
  color: string;
  rings: number[][][];
  areaHectares: number;
  createdAt: number;
}

interface SidebarProps {
  points: MapPoint[];
  areas: MapArea[];
  onSelectItem: (id: string, type: 'point' | 'area') => void;
  onDeleteItem: (id: string, type: 'point' | 'area') => void;
  onImportData?: (data: { points: MapPoint[]; areas: MapArea[] }) => void;
  selectedItemId: string | null;
  className?: string;
  isMobile?: boolean;
  activeDepartment?: DepartmentView;
  onDepartmentChange?: (dept: DepartmentView) => void;
  isAdmin?: boolean;
  showPoints?: boolean;
  onToggleShowPoints?: () => void;
  showAreas?: boolean;
  onToggleShowAreas?: () => void;
  hiddenFeatures?: Record<string, boolean>;
  onToggleFeatureVisibility?: (id: string | number) => void;
  realtimeStatus?: RealtimeChannelStatus;
  layerVisibility?: any;
  onToggleLayer?: any;
  swipeActive?: boolean;
  onToggleSwipe?: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  points,
  areas,
  onSelectItem,
  onDeleteItem,
  onImportData,
  selectedItemId,
  className = '',
  activeDepartment = 'pc',
  onDepartmentChange,
  isAdmin = false,
  showPoints = true,
  onToggleShowPoints,
  showAreas = true,
  onToggleShowAreas,
  hiddenFeatures = {},
  onToggleFeatureVisibility,
  realtimeStatus,
  layerVisibility,
  onCloseMobile,
}) => {
  const isInspeccionesMode = layerVisibility?.inspecciones ?? false;
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrado de elementos
  const filteredPoints = points.filter(p => {
    const term = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      (p.isCollapsed && ("colapsado".includes(term) || String(p.collapsedCount || "").includes(term)));
  });

  const filteredAreas = areas.filter(a => {
    const term = searchTerm.toLowerCase();
    return a.name.toLowerCase().includes(term) ||
      a.description.toLowerCase().includes(term);
  });

  // Exportar datos a JSON
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ points, areas }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);

    const date = getLocalDateStr();
    downloadAnchor.setAttribute("download", `sig_la_guaira_${date}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Importar datos de JSON
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && (Array.isArray(parsed.points) || Array.isArray(parsed.areas))) {
            onImportData?.({
              points: parsed.points || [],
              areas: parsed.areas || []
            });
            alert('Datos importados con éxito.');
          } else {
            alert('El formato del archivo no es válido.');
          }
        } catch {
          alert('Error al leer el archivo JSON.');
        }
      };
    }
  };

  return (
    <aside className={`sidebar ${className}`}>
      {/* Encabezado */}
      <div className="sidebar-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="sidebar-logo">
              <Activity size={24} color="#ffffff" />
            </div>
            <div className="sidebar-title">
              <h1>COE La Guaira</h1>
              <p>{activeDepartment === 'bomberos' ? 'Cuerpo de Bomberos' : activeDepartment === 'mixto' ? 'Mando Mixto' : 'Protección Civil'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {realtimeStatus && <RealtimeStatusBadge status={realtimeStatus} />}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  padding: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Cerrar menú lateral"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
        {onDepartmentChange && (
          <DepartmentTabs activeDepartment={activeDepartment} onDepartmentChange={onDepartmentChange} />
        )}
      </div>

      {/* Contenido Principal */}
      <div className="sidebar-content" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", gap: "16px" }}>
        {/* Filtros e Historial */}
        <div className="sidebar-section" style={{ flexShrink: 0 }}>
          <div className="section-title">
            <Search size={14} />
            <span>Búsqueda</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '8px 10px 8px 32px',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>

        {/* Listado de Puntos (Oculto en modo Inspecciones para mostrar únicamente polígonos) */}
        {!isInspeccionesMode && (
          <div className="sidebar-section" style={{ flex: showPoints && !showAreas ? 1 : "0 1 auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div className="section-title" onClick={onToggleShowPoints} style={{ cursor: "pointer", flexShrink: 0 }}>
              <MapPin size={14} />
              <span>Puntos Operacionales ({filteredPoints.length})</span>
              <span style={{ marginLeft: "auto" }}>{showPoints ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
            </div>

            {showPoints && (
              <div className="element-list" style={{ flex: 1, maxHeight: showAreas ? "180px" : "none", overflowY: "auto", minHeight: 0 }}>
                {filteredPoints.length === 0 ? (
                  <div className="empty-state">No hay puntos registrados</div>
                ) : (
                  filteredPoints.map(point => (
                    <div
                      key={point.id}
                      className={`element-item ${selectedItemId === point.id ? 'active' : ''}`}
                      onClick={() => onSelectItem(point.id, 'point')}
                      style={{ borderLeftColor: point.color }}
                    >
                      <div className="element-header">
                        <span className="element-name">{point.name}</span>
                        {point.isCollapsed && (
                          <span
                            style={{
                              fontSize: "0.62rem",
                              fontWeight: 800,
                              color: "#f87171",
                              background: "rgba(239, 68, 68, 0.18)",
                              border: "1px solid rgba(239, 68, 68, 0.4)",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              marginLeft: "6px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Colapsado: {point.collapsedCount || "1"}
                          </span>
                        )}
                        <div className="element-actions" onClick={(e) => e.stopPropagation()}>
                          {onToggleFeatureVisibility && (
                            <input
                              type="checkbox"
                              checked={!hiddenFeatures[String(point.id)]}
                              onChange={() => onToggleFeatureVisibility(String(point.id))}
                              title={hiddenFeatures[String(point.id)] ? "Mostrar punto" : "Ocultar punto"}
                              style={{ cursor: "pointer", width: "14px", height: "14px", accentColor: "#38bdf8", flexShrink: 0 }}
                            />
                          )}
                          {isAdmin && (
                            <button
                              className="action-icon-btn"
                              onClick={() => onDeleteItem(point.id, 'point')}
                              title="Eliminar punto"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <span className="element-desc">{point.description || 'Sin descripción'}</span>
                      <div className="element-meta">
                        <span>• {point.coordinates.latitude.toFixed(4)}, {point.coordinates.longitude.toFixed(4)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Listado de Áreas */}
        <div className="sidebar-section" style={{ flex: showAreas ? 1 : "0 1 auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div className="section-title" onClick={onToggleShowAreas} style={{ cursor: "pointer", flexShrink: 0 }}>
            <Map size={14} />
            <span>Áreas y Polígonos ({filteredAreas.length})</span>
            <span style={{ marginLeft: "auto" }}>{showAreas ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
          </div>

          {showAreas && (
            <div className="element-list" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              {filteredAreas.length === 0 ? (
                <div className="empty-state">No hay áreas trazadas</div>
              ) : (
                filteredAreas.map(area => (
                  <div
                    key={area.id}
                    className={`element-item ${selectedItemId === area.id ? 'active' : ''}`}
                    onClick={() => onSelectItem(area.id, 'area')}
                    style={{ borderLeftColor: area.color }}
                  >
                    <div className="element-header">
                      <span className="element-name">{area.name}</span>
                      <div className="element-actions" onClick={(e) => e.stopPropagation()}>
                        {onToggleFeatureVisibility && (
                          <input
                            type="checkbox"
                            checked={!hiddenFeatures[String(area.id)]}
                            onChange={() => onToggleFeatureVisibility(String(area.id))}
                            title={hiddenFeatures[String(area.id)] ? "Mostrar área" : "Ocultar área"}
                            style={{ cursor: "pointer", width: "14px", height: "14px", accentColor: "#38bdf8", flexShrink: 0 }}
                          />
                        )}
                        {isAdmin && (
                          <button
                            className="action-icon-btn"
                            onClick={() => onDeleteItem(area.id, 'area')}
                            title="Eliminar área"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <span className="element-desc">{area.description || 'Sin descripción'}</span>
                    <div className="element-meta">
                      <span>• {area.areaHectares.toFixed(2)} Ha</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Botones de Importación/Exportación al final — Solo para Administradores */}
      {isAdmin && (
        <div className="transfer-buttons">
          <button className="btn-transfer" onClick={handleExport} title="Exportar datos a JSON">
            <Download size={16} />
            <span>Exportar</span>
          </button>
          <label className="btn-transfer" style={{ cursor: 'pointer' }} title="Importar datos desde JSON">
            <Upload size={16} />
            <span>Importar</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}

    </aside>
  );
};

export default Sidebar;

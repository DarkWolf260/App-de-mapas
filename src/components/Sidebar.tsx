import React, { useState, useEffect } from 'react';
import { DepartmentTabs } from './DepartmentTabs';
import type { DepartmentView } from '../types';
import { getLocalDateStr } from '../utils/dateUtils';
import {
  MapPin,
  Trash2,
  Download,
  Upload,
  Search,
  ShieldAlert,
  Home,
  HeartPulse,
  Layers,
  Map,
  Activity,
  Info,
  ChevronDown,
  ChevronRight,
  Building2,
  Satellite,
} from 'lucide-react';
import Select from './ui/Select';
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
  onToggleLayer,
}) => {
  const isInspeccionesMode = layerVisibility?.inspecciones ?? false;
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  useEffect(() => {
    const handleSwipeState = (e: CustomEvent<boolean>) => {
      setIsSwipeActive(!!e.detail);
    };
    window.addEventListener("swipe-state-changed", handleSwipeState as EventListener);
    return () => window.removeEventListener("swipe-state-changed", handleSwipeState as EventListener);
  }, []);

  const categories = [
    { value: 'all', label: 'Todas las categorías', color: '#9ca3af', icon: Layers },
    { value: 'riesgo', label: 'Zonas de Riesgo', color: '#ef4444', icon: ShieldAlert },
    { value: 'refugio', label: 'Refugios / Albergues', color: '#10b981', icon: Home },
    { value: 'salud', label: 'Puestos de Salud', color: '#3b82f6', icon: HeartPulse },
    { value: 'operativo', label: 'Puestos de Control', color: '#f97316', icon: Activity },
    { value: 'general', label: 'General / Otros', color: '#a855f7', icon: Info }
  ];

  // Filtrado de elementos
  const filteredPoints = points.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      (p.isCollapsed && ("colapsado".includes(term) || String(p.collapsedCount || "").includes(term)));
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredAreas = areas.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
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

  // Obtener icono según categoría
  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    const IconComponent = cat ? cat.icon : Info;
    return <IconComponent size={16} style={{ color: cat?.color || '#a855f7' }} />;
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
          {realtimeStatus && <RealtimeStatusBadge status={realtimeStatus} />}
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
            <span>Búsqueda y Filtros</span>
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

            <Select
              options={categories.map(cat => {
                const Icon = cat.icon;
                return { value: cat.value, label: cat.label, color: cat.color, icon: <Icon size={13} color={cat.color} /> };
              })}
              value={categoryFilter}
              onChange={setCategoryFilter}
            />
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
                        {getCategoryIcon(point.category)}
                        <span className="category-tag">{point.category}</span>
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
                      {getCategoryIcon(area.category)}
                      <span className="category-tag">{area.category}</span>
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

      {/* Botones de Acción al pie del Sidebar (Inspecciones y Antes / Después) */}
      <div className="sidebar-action-buttons" style={{ padding: "12px 16px 16px 16px", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0, background: "rgba(10, 15, 28, 0.4)" }}>
        <button
          className={`swipe-toggle-btn ${isInspeccionesMode ? "active" : ""}`}
          onClick={() => onToggleLayer?.("inspecciones")}
          title={isInspeccionesMode ? "Desactivar Capa de Inspecciones Kobo" : "Activar Capa de Inspecciones Kobo"}
          style={{
            position: "static",
            bottom: "auto",
            left: "auto",
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "9px 12px",
            borderRadius: "8px",
            border: `1px solid ${isInspeccionesMode ? "rgba(99, 102, 241, 0.8)" : "var(--border-color)"}`,
            backgroundColor: isInspeccionesMode ? "rgba(99, 102, 241, 0.25)" : "var(--bg-tertiary)",
            color: isInspeccionesMode ? "#818cf8" : "var(--text-primary)",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            transition: "all 0.2s ease",
          }}
        >
          <Building2 size={16} color={isInspeccionesMode ? "#818cf8" : "var(--text-muted)"} />
          <span>Inspecciones</span>
        </button>

        <div style={{ display: "flex", gap: "8px", width: "100%" }}>
          <button
            className={`swipe-toggle-btn ${isSwipeActive ? "active" : ""}`}
            onClick={() => window.dispatchEvent(new CustomEvent("toggle-swipe"))}
            title={isSwipeActive ? "Cerrar comparación" : "Comparar antes/después"}
            style={{
              position: "static",
              bottom: "auto",
              left: "auto",
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 12px",
              borderRadius: "8px",
              border: `1px solid ${isSwipeActive ? "rgba(56, 189, 248, 0.8)" : "var(--border-color)"}`,
              backgroundColor: isSwipeActive ? "rgba(56, 189, 248, 0.25)" : "var(--bg-tertiary)",
              color: isSwipeActive ? "#38bdf8" : "var(--text-primary)",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              transition: "all 0.2s ease",
            }}
          >
            <Satellite size={16} color={isSwipeActive ? "#38bdf8" : "var(--text-muted)"} />
            <span>{isSwipeActive ? "Cerrar" : "Antes / Después"}</span>
          </button>

          {isSwipeActive && (
            <button
              className="swipe-layer-toggle"
              onClick={() => window.dispatchEvent(new CustomEvent("toggle-swipe-panel"))}
              title="Seleccionar capas post-sismo"
              style={{
                position: "static",
                top: "auto",
                left: "auto",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-tertiary)",
                color: "#f8fafc",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Layers size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

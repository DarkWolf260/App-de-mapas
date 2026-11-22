import React, { useState } from 'react';
import { DepartmentTabs } from './DepartmentTabs';
import type { DepartmentView, DrawnFeature } from '../types';
import { getLocalDateStr } from '../utils/dateUtils';
import { shouldShowFeatureForLayerMode } from '../utils/activityCatalog';
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
  Menu,
  X,
  Crosshair,
  Plus,
  Square,
} from 'lucide-react';
import { showToast } from '../utils/toast';

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
  layerVisibility?: any;
  onToggleLayer?: any;
  swipeActive?: boolean;
  onToggleSwipe?: () => void;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onGoToCoords?: (lat: number, lon: number) => void;
  onCreatePointAtCoords?: (lat: number, lon: number) => void;
  onZoomToFeature?: (feat: DrawnFeature) => void;
  drawnFeatures?: DrawnFeature[];
}

function parseCoords(input: string): { lat: number; lon: number } | null {
  const cleaned = input.replace(/\s+/g, " ").trim();
  const parts = cleaned.split(/[;,]/).map((s) => s.trim());
  let nums: number[];

  if (parts.length === 2) {
    nums = parts.map(Number);
    if (nums.some(isNaN)) return null;
  } else {
    const spaceParts = cleaned.split(" ");
    if (spaceParts.length >= 2) {
      nums = spaceParts.map(Number).filter((n) => !isNaN(n));
      if (nums.length < 2) return null;
    } else {
      return null;
    }
  }

  const [a, b] = nums;

  if (a >= -90 && a <= 90 && b >= -180 && b <= 180) {
    return { lat: a, lon: b };
  }
  if (b >= -90 && b <= 90 && a >= -180 && a <= 180) {
    return { lat: b, lon: a };
  }

  return null;
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
  layerVisibility,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  onGoToCoords,
  onCreatePointAtCoords,
  onZoomToFeature,
  drawnFeatures = [],
}) => {
  const isInspeccionesMode = layerVisibility?.inspecciones ?? false;
  const [searchTerm, setSearchTerm] = useState('');

  const drawnById = React.useMemo(() => {
    const lookup: Record<string, DrawnFeature> = {};
    drawnFeatures.forEach((f) => {
      lookup[String(f.id)] = f;
    });
    return lookup;
  }, [drawnFeatures]);

  // Filtrado de elementos (respetando capa temática activa y búsqueda)
  const filteredPoints = points.filter(p => {
    if (layerVisibility?.formacion || layerVisibility?.demolidos) {
      const feat = drawnById[String(p.id)];
      if (feat && !shouldShowFeatureForLayerMode(feat, layerVisibility)) {
        return false;
      }
    }
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      (p.isCollapsed && ("colapsado".includes(term) || String(p.collapsedCount || "").includes(term)));
  });

  const filteredAreas = areas.filter(a => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return a.name.toLowerCase().includes(term) ||
      a.description.toLowerCase().includes(term);
  });

  const coords = searchTerm.trim() ? parseCoords(searchTerm) : null;

  // Matching features for dropdown when sidebar is collapsed
  const matchingFeatures = drawnFeatures.filter(f => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return false;
    return (f.title && f.title.toLowerCase().includes(q)) ||
           (f.description && f.description.toLowerCase().includes(q)) ||
           (f.isCollapsed && ("colapsado".includes(q) || String(f.collapsedCount || "").includes(q)));
  });

  const getFeatureIcon = (type: string, color?: string) => {
    const style = { color: color || "#94a3b8", flexShrink: 0 };
    if (type === 'point') return <MapPin size={14} style={style} />;
    if (type === 'polyline') return <Activity size={14} style={style} />;
    return <Square size={14} style={style} />;
  };

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
    const file = e.target.files?.[0];
    if (!file) return;
    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && (Array.isArray(parsed.points) || Array.isArray(parsed.areas))) {
          const pts = parsed.points || [];
          const ars = parsed.areas || [];
          onImportData?.({ points: pts, areas: ars });
          showToast(`Importación completada: ${pts.length} puntos y ${ars.length} áreas.`, "success");
        } else {
          showToast("Formato JSON inválido: el archivo debe incluir arreglos 'points' o 'areas'.", "error");
        }
      } catch {
        showToast("No se pudo leer el archivo JSON. Verifica que tenga sintaxis válida.", "error");
      } finally {
        e.target.value = "";
      }
    };
  };

  const subtitle =
    activeDepartment === 'bomberos'
      ? 'MANDO BOMBEROS'
      : activeDepartment === 'mixto'
        ? 'MANDO MIXTO'
        : 'MANDO PC';

  return (
    <aside className={`sidebar ${className}`}>
      {/* ── TARJETA FLOTANTE SUPERIOR (CABECERA) ── */}
      <div className="sidebar-header-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="sidebar-logo">
              <Activity size={22} color="#ffffff" />
            </div>
            <div className="sidebar-title">
              <h1>COE La Guaira</h1>
              <p>{subtitle}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onToggleCollapse || onCloseMobile}
              className="sidebar-card-toggle-btn"
              title={isCollapsed ? "Mostrar panel lateral" : "Ocultar panel lateral"}
              aria-label={isCollapsed ? "Mostrar panel lateral" : "Ocultar panel lateral"}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? <Menu size={16} /> : <X size={16} />}
            </button>
          </div>
        </div>
        {onDepartmentChange && (
          <DepartmentTabs activeDepartment={activeDepartment} onDepartmentChange={onDepartmentChange} />
        )}
      </div>

      {/* ── BARRA FLOTANTE DE BÚSQUEDA (SIEMPRE VISIBLE EN EL STACK) ── */}
      <div className="sidebar-search-card">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
          <span
            style={{ display: "inline-flex", alignItems: "center", cursor: coords && onGoToCoords ? 'pointer' : 'default' }}
            title={coords && onGoToCoords ? 'Ir a las coordenadas' : undefined}
            onClick={() => {
              if (coords && onGoToCoords) {
                onGoToCoords(coords.lat, coords.lon);
              }
            }}
          >
            <Search className="sidebar-search-icon" size={15} />
          </span>
          <input
            type="text"
            placeholder="Buscar áreas, puntos o coords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (coords && onGoToCoords) {
                  onGoToCoords(coords.lat, coords.lon);
                } else if (matchingFeatures.length > 0) {
                  const first = matchingFeatures[0];
                  if (onZoomToFeature) onZoomToFeature(first);
                  onSelectItem(String(first.id), first.type === 'point' ? 'point' : 'area');
                  setSearchTerm('');
                }
              }
            }}
            className="sidebar-search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="sidebar-search-clear"
              title="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Acciones de coordenadas si el texto ingresado coincide con formato coordenadas */}
        {coords && (
          <div className="sidebar-search-coord-actions">
            <span className="sidebar-search-coord-label">
              {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              {onGoToCoords && (
                <button
                  className="sidebar-coord-btn"
                  onClick={() => onGoToCoords(coords.lat, coords.lon)}
                >
                  <Crosshair size={12} />
                  Ir al punto
                </button>
              )}
              {onCreatePointAtCoords && (
                <button
                  className="sidebar-coord-btn accent"
                  onClick={() => {
                    onCreatePointAtCoords(coords.lat, coords.lon);
                    setSearchTerm('');
                  }}
                >
                  <Plus size={12} />
                  Crear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MENÚ DESPLEGABLE DE RESULTADOS CUANDO EL SIDEBAR ESTÁ CERRADO ── */}
      {isCollapsed && searchTerm.trim() && (
        <div className="sidebar-search-dropdown scrollable-thin">
          {matchingFeatures.length === 0 && !coords ? (
            <div className="sidebar-search-empty">
              {/^-?\d+[\d.,;\s-]*$/.test(searchTerm.trim())
                ? "Formato de coordenadas inválido. Usa: lat, lon (ej. 10.6001, -66.9332)"
                : "No se encontraron áreas ni puntos coincidentes"}
            </div>
          ) : (
            matchingFeatures.map((feat) => (
              <div
                key={feat.id}
                className="sidebar-search-item"
                onClick={() => {
                  if (onZoomToFeature) onZoomToFeature(feat);
                  onSelectItem(String(feat.id), feat.type === 'point' ? 'point' : 'area');
                  setSearchTerm('');
                }}
              >
                <div className="sidebar-search-item-header">
                  {getFeatureIcon(feat.type, feat.color)}
                  <span className="sidebar-search-item-title">{feat.title}</span>
                  <span className="sidebar-search-item-badge">
                    {feat.type === 'point' ? 'PUNTO' : feat.type === 'polyline' ? 'LÍNEA' : 'ÁREA'}
                  </span>
                </div>
                {feat.description && (
                  <p className="sidebar-search-item-desc">{feat.description}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── PANEL DE CONTENIDO (50% POLÍGONOS / 50% PUNTOS) ── */}
      {!isCollapsed && (
        <div className="sidebar-content-panel">
          {/* Listado de Áreas y Polígonos */}
          <div className={`sidebar-section half-split ${!showAreas ? 'section-collapsed' : ''}`}>
            <div className="section-title" onClick={onToggleShowAreas} style={{ cursor: "pointer", flexShrink: 0 }}>
              <Map size={13} />
              <span>Áreas y Polígonos ({filteredAreas.length})</span>
              <span style={{ marginLeft: "auto", display: "inline-flex" }}>
                {showAreas ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            </div>

            {showAreas && (
              <div className="element-list" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                {filteredAreas.length === 0 ? (
                  <div className="empty-state">
                    {searchTerm ? "No hay áreas coincidentes" : "No hay áreas trazadas"}
                  </div>
                ) : (
                  filteredAreas.map(area => {
                    const isHidden = !!hiddenFeatures[String(area.id)];
                    const desc = area.description?.trim();
                    return (
                      <div
                        key={area.id}
                        className={`element-item ${selectedItemId === area.id ? 'active' : ''} ${isHidden ? 'is-hidden' : ''}`}
                        onClick={() => onSelectItem(area.id, 'area')}
                      >
                        <div className="element-header">
                          <span
                            className="element-swatch is-area"
                            style={{ backgroundColor: area.color || '#f97316' }}
                            aria-hidden="true"
                          />
                          <span className="element-name" title={area.name}>{area.name}</span>
                          <div className="element-actions" onClick={(e) => e.stopPropagation()}>
                            {onToggleFeatureVisibility && (
                              <input
                                type="checkbox"
                                checked={!isHidden}
                                onChange={() => onToggleFeatureVisibility(String(area.id))}
                                title={isHidden ? "Mostrar área" : "Ocultar área"}
                                aria-label={isHidden ? `Mostrar ${area.name}` : `Ocultar ${area.name}`}
                                className="element-visibility-checkbox"
                              />
                            )}
                            {isAdmin && (
                              <button
                                type="button"
                                className="action-icon-btn"
                                onClick={() => onDeleteItem(area.id, 'area')}
                                title="Eliminar área"
                                aria-label={`Eliminar ${area.name}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                        {desc && <span className="element-desc" title={desc}>{desc}</span>}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Listado de Puntos Operacionales */}
          {!isInspeccionesMode && (
            <div className={`sidebar-section half-split ${!showPoints ? 'section-collapsed' : ''}`}>
              <div className="section-title" onClick={onToggleShowPoints} style={{ cursor: "pointer", flexShrink: 0 }}>
                <MapPin size={13} />
                <span>Puntos Operacionales ({filteredPoints.length})</span>
                <span style={{ marginLeft: "auto", display: "inline-flex" }}>
                  {showPoints ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              </div>

              {showPoints && (
                <div className="element-list" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                  {filteredPoints.length === 0 ? (
                    <div className="empty-state">
                      {searchTerm ? "No hay puntos coincidentes" : "No hay puntos registrados"}
                    </div>
                  ) : (
                    filteredPoints.map(point => {
                      const isHidden = !!hiddenFeatures[String(point.id)];
                      const desc = point.description?.trim();
                      return (
                        <div
                          key={point.id}
                          className={`element-item ${selectedItemId === point.id ? 'active' : ''} ${isHidden ? 'is-hidden' : ''}`}
                          onClick={() => onSelectItem(point.id, 'point')}
                        >
                          <div className="element-header">
                            <span
                              className="element-swatch"
                              style={{ backgroundColor: point.color || '#f97316' }}
                              aria-hidden="true"
                            />
                            <span className="element-name" title={point.name}>{point.name}</span>
                            {point.isCollapsed && (
                              <span className="element-collapsed-pill">
                                Colap: {point.collapsedCount || "1"}
                              </span>
                            )}
                            <div className="element-actions" onClick={(e) => e.stopPropagation()}>
                              {onToggleFeatureVisibility && (
                                <input
                                  type="checkbox"
                                  checked={!isHidden}
                                  onChange={() => onToggleFeatureVisibility(String(point.id))}
                                  title={isHidden ? "Mostrar punto" : "Ocultar punto"}
                                  aria-label={isHidden ? `Mostrar ${point.name}` : `Ocultar ${point.name}`}
                                  className="element-visibility-checkbox"
                                />
                              )}
                              {isAdmin && (
                                <button
                                  type="button"
                                  className="action-icon-btn"
                                  onClick={() => onDeleteItem(point.id, 'point')}
                                  title="Eliminar punto"
                                  aria-label={`Eliminar ${point.name}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                          {desc && <span className="element-desc" title={desc}>{desc}</span>}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* Botones de Importación/Exportación al final — Solo para Administradores */}
          {isAdmin && (
            <div className="transfer-buttons">
              <button type="button" className="btn-transfer" onClick={handleExport} title="Exportar datos a JSON">
                <Download size={14} />
                <span>Exportar</span>
              </button>
              <label className="btn-transfer" style={{ cursor: 'pointer' }} title="Importar datos desde JSON">
                <Upload size={14} />
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
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

import React, { useState } from 'react';
import { DepartmentTabs } from './DepartmentTabs';
import type { DepartmentView } from '../types';
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
  Info
} from 'lucide-react';

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
  onImportData: (data: { points: MapPoint[]; areas: MapArea[] }) => void;
  selectedItemId: string | null;
  className?: string;
  activeDepartment?: DepartmentView;
  onDepartmentChange?: (dept: DepartmentView) => void;
  isAdmin?: boolean;
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
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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
    
    const date = new Date().toISOString().slice(0,10);
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
            onImportData({
              points: parsed.points || [],
              areas: parsed.areas || []
            });
            alert('Datos importados con éxito.');
          } else {
            alert('El formato del archivo no es válido.');
          }
        } catch (err) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="sidebar-logo">
            <Activity size={24} color="#ffffff" />
          </div>
          <div className="sidebar-title">
            <h1>COE La Guaira</h1>
            <p>{activeDepartment === 'bomberos' ? 'Cuerpo de Bomberos' : activeDepartment === 'mixto' ? 'Mando Mixto' : 'Protección Civil'}</p>
          </div>
        </div>
        {onDepartmentChange && (
          <DepartmentTabs activeDepartment={activeDepartment} onDepartmentChange={onDepartmentChange} />
        )}
      </div>

      {/* Contenido Principal */}
      <div className="sidebar-content">
        {/* Filtros e Historial */}
        <div className="sidebar-section">
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

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: '100%',
                background: '#111827',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Listado de Puntos */}
        <div className="sidebar-section">
          <div className="section-title">
            <MapPin size={14} />
            <span>Puntos Operacionales ({filteredPoints.length})</span>
          </div>
          
          <div className="element-list">
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
                    {isAdmin && (
                      <div className="element-actions" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="action-icon-btn" 
                          onClick={() => onDeleteItem(point.id, 'point')}
                          title="Eliminar punto"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
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
        </div>

        {/* Listado de Áreas */}
        <div className="sidebar-section">
          <div className="section-title">
            <Map size={14} />
            <span>Áreas y Polígonos ({filteredAreas.length})</span>
          </div>
          
          <div className="element-list">
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
                    {isAdmin && (
                      <div className="element-actions" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="action-icon-btn" 
                          onClick={() => onDeleteItem(area.id, 'area')}
                          title="Eliminar área"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
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

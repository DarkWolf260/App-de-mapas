import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import type { MapPoint, MapArea } from '../components/Sidebar';

/**
 * Convierte un color hexadecimal en un array RGBA estructurado.
 */
export const hexToRgbArray = (hex: string, alpha: number): number[] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, alpha];
};

/**
 * SRP: Responsabilidad exclusiva de convertir datos de negocio de MapPoint
 * en un Graphic de ArcGIS tipado con WKID 4326.
 */
export const mapPointToGraphic = (p: MapPoint, isSelected: boolean): Graphic => {
  const markerSymbol = new SimpleMarkerSymbol({
    color: p.color,
    size: isSelected ? '16px' : '12px',
    outline: {
      color: isSelected ? '#ffffff' : [255, 255, 255, 0.7],
      width: isSelected ? 2.5 : 1.5
    }
  });

  const popupTemplate = {
    title: `📍 ${p.name}`,
    content: `
      <div style="font-family: var(--sans-font); padding: 8px 0; color: #f3f4f6;">
        <p style="font-size: 13px; line-height: 1.4; color: #d1d5db; margin-bottom: 8px;">${p.description || 'Sin descripción.'}</p>
        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #9ca3af; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
          <span><b>Categoría:</b> <span style="color: ${p.color}; font-weight: bold; text-transform: uppercase;">${p.category}</span></span>
          <span><b>Coordenadas:</b> ${p.coordinates.latitude.toFixed(6)}, ${p.coordinates.longitude.toFixed(6)}</span>
        </div>
      </div>
    `
  };

  return new Graphic({
    geometry: new Point({
      longitude: p.coordinates.longitude,
      latitude: p.coordinates.latitude,
      spatialReference: { wkid: 4326 }
    }),
    symbol: markerSymbol,
    attributes: {
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      type: 'point'
    },
    popupTemplate: popupTemplate
  });
};

/**
 * SRP: Responsabilidad exclusiva de convertir datos de negocio de MapArea
 * en un Graphic de ArcGIS tipado con WKID 4326 (solventa el error de proyección).
 */
export const mapAreaToGraphic = (a: MapArea, isSelected: boolean): Graphic => {
  const fillSymbol = new SimpleFillSymbol({
    color: hexToRgbArray(a.color, isSelected ? 0.45 : 0.25),
    outline: {
      color: a.color,
      width: isSelected ? 3 : 2
    }
  });

  const popupTemplate = {
    title: `📐 ${a.name}`,
    content: `
      <div style="font-family: var(--sans-font); padding: 8px 0; color: #f3f4f6;">
        <p style="font-size: 13px; line-height: 1.4; color: #d1d5db; margin-bottom: 8px;">${a.description || 'Sin descripción.'}</p>
        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #9ca3af; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
          <span><b>Categoría:</b> <span style="color: ${a.color}; font-weight: bold; text-transform: uppercase;">${a.category}</span></span>
          <span><b>Área Estimada:</b> <span style="color: #ffffff; font-weight: bold;">${a.areaHectares.toFixed(4)} Hectáreas</span> (${(a.areaHectares * 10000).toLocaleString(undefined, {maximumFractionDigits:0})} m²)</span>
        </div>
      </div>
    `
  };

  return new Graphic({
    geometry: new Polygon({
      rings: a.rings,
      spatialReference: { wkid: 4326 }
    }),
    symbol: fillSymbol,
    attributes: {
      id: a.id,
      name: a.name,
      description: a.description,
      category: a.category,
      type: 'area'
    },
    popupTemplate: popupTemplate
  });
};

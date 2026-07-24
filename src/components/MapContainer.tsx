import React, { useRef } from 'react';
import { useArcGISMap } from '../hooks/useArcGISMap';
import type { MapPoint, MapArea } from './Sidebar';

interface MapContainerProps {
  points: MapPoint[];
  areas: MapArea[];
  activeBasemap: string;
  drawingMode: 'point' | 'polygon' | null;
  setDrawingMode: (mode: 'point' | 'polygon' | null) => void;
  onAddRequest: (data: { type: 'point' | 'polygon'; geometry: any }) => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

/**
 * Componente con la única responsabilidad de renderizar el contenedor
 * y la barra flotante de coordenadas, delegando el comportamiento GIS al hook.
 */
export const MapContainer: React.FC<MapContainerProps> = ({
  points,
  areas,
  activeBasemap,
  drawingMode,
  setDrawingMode,
  onAddRequest,
  selectedItemId,
  setSelectedItemId
}) => {
  const mapDivRef = useRef<HTMLDivElement>(null);

  const { coords, zoom, scale } = useArcGISMap({
    mapDivRef,
    points,
    areas,
    activeBasemap,
    drawingMode,
    setDrawingMode,
    onAddRequest,
    selectedItemId,
    setSelectedItemId
  });

  return (
    <div className="map-viewport">
      <div ref={mapDivRef} className="map-container" />
      
      {/* Barra de Coordenadas Flotante */}
      <div className="status-bar-coordinates">
        <div><span>LAT:</span> {coords.lat.toFixed(6)}</div>
        <div><span>LNG:</span> {coords.lng.toFixed(6)}</div>
        <div><span>ZOOM:</span> {zoom}</div>
        {scale > 0 && <div><span>ESCALA:</span> 1:{scale.toLocaleString()}</div>}
      </div>
    </div>
  );
};

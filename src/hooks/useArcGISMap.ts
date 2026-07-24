import { useEffect, useRef, useState } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils';
import esriConfig from '@arcgis/core/config';
import type { MapPoint, MapArea } from '../components/Sidebar';
import { mapPointToGraphic, mapAreaToGraphic } from '../utils/graphicConverters';

// Configurar API Key
esriConfig.apiKey = import.meta.env.VITE_ARCGIS_API_KEY || '';

interface UseArcGISMapProps {
  mapDivRef: React.RefObject<HTMLDivElement | null>;
  points: MapPoint[];
  areas: MapArea[];
  activeBasemap: string;
  drawingMode: 'point' | 'polygon' | null;
  setDrawingMode: (mode: 'point' | 'polygon' | null) => void;
  onAddRequest: (data: { type: 'point' | 'polygon'; geometry: any }) => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

export const useArcGISMap = ({
  mapDivRef,
  points,
  areas,
  activeBasemap,
  drawingMode,
  setDrawingMode,
  onAddRequest,
  selectedItemId,
  setSelectedItemId
}: UseArcGISMapProps) => {
  const viewRef = useRef<MapView | null>(null);
  const graphicsLayerRef = useRef<GraphicsLayer | null>(null);
  const sketchVMRef = useRef<SketchViewModel | null>(null);

  const [coords, setCoords] = useState({ lat: 10.6000, lng: -66.9331 });
  const [zoom, setZoom] = useState(12);
  const [scale, setScale] = useState(0);

  // 1. Inicialización de ArcGIS
  useEffect(() => {
    if (!mapDivRef.current) return;

    const graphicsLayer = new GraphicsLayer({
      id: 'sig-graphics-layer'
    });
    graphicsLayerRef.current = graphicsLayer;

    const map = new Map({
      basemap: activeBasemap as any,
      layers: [graphicsLayer]
    });

    const view = new MapView({
      container: mapDivRef.current,
      map: map,
      center: [-66.9331, 10.6000], // La Guaira
      zoom: 12,
      ui: {
        components: ['zoom']
      }
    });
    viewRef.current = view;

    const sketchVM = new SketchViewModel({
      view: view,
      layer: graphicsLayer,
      pointSymbol: new SimpleMarkerSymbol({
        color: '#f97316',
        size: '12px',
        outline: { color: [255, 255, 255, 0.8], width: 1.5 }
      }),
      polygonSymbol: new SimpleFillSymbol({
        color: [249, 115, 22, 0.25],
        outline: { color: '#f97316', width: 2 }
      }),
      updateOnGraphicClick: false
    });
    sketchVMRef.current = sketchVM;

    // Escuchador de dibujo completado
    sketchVM.on('create', (event: any) => {
      if (event.state === 'complete' && event.graphic) {
        let geometry = event.graphic.geometry;
        
        // Quitar gráfico temporal del lienzo
        graphicsLayer.remove(event.graphic);

        // Convertir de Web Mercator a coordenadas geográficas WGS84 para el almacenamiento
        if (geometry.spatialReference?.isWebMercator) {
          geometry = webMercatorUtils.webMercatorToGeographic(geometry);
        }

        if (geometry && geometry.type === 'point') {
          onAddRequest({
            type: 'point',
            geometry: {
              longitude: (geometry as Point).longitude,
              latitude: (geometry as Point).latitude
            }
          });
        } else if (geometry && geometry.type === 'polygon') {
          // Computar área geodésica real en hectáreas
          const areaHectares = geometryEngine.geodesicArea(geometry as Polygon, 'hectares');
          onAddRequest({
            type: 'polygon',
            geometry: {
              rings: (geometry as Polygon).rings,
              areaHectares: areaHectares > 0 ? areaHectares : 0
            }
          });
        }
        
        setDrawingMode(null);
      }
    });

    // Rastreo del cursor para coordenadas
    view.on('pointer-move', (event: any) => {
      const point = view.toMap({ x: event.x, y: event.y });
      if (point) {
        setCoords({
          lat: point.latitude ?? 0,
          lng: point.longitude ?? 0
        });
      }
    });

    // Rastreo de Zoom y Escala
    view.watch('zoom', (newZoom: number) => {
      setZoom(Math.round(newZoom));
    });
    view.watch('scale', (newScale: number) => {
      setScale(Math.round(newScale));
    });

    // Selección al hacer clic en elementos
    view.on('click', (event: any) => {
      view.hitTest(event).then((response: any) => {
        const results = response.results.filter(
          (result: any) => result.type === 'graphic' && result.graphic.layer === graphicsLayer
        );
        
        if (results.length > 0) {
          const clickedGraphic = (results[0] as any).graphic;
          const id = clickedGraphic.attributes?.id;
          if (id) {
            setSelectedItemId(id);
          }
        } else {
          setSelectedItemId(null);
          view.closePopup();
        }
      });
    });

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []);

  // 2. Basemap dinámico
  useEffect(() => {
    if (viewRef.current && viewRef.current.map) {
      viewRef.current.map.basemap = activeBasemap as any;
    }
  }, [activeBasemap]);

  // 3. Activar/Desactivar dibujo
  useEffect(() => {
    if (!sketchVMRef.current) return;
    
    if (drawingMode === 'point') {
      sketchVMRef.current.cancel();
      sketchVMRef.current.create('point');
    } else if (drawingMode === 'polygon') {
      sketchVMRef.current.cancel();
      sketchVMRef.current.create('polygon');
    } else {
      sketchVMRef.current.cancel();
    }
  }, [drawingMode]);

  // 4. Sincronizar Puntos y Áreas (Capa de Gráficos)
  useEffect(() => {
    const graphicsLayer = graphicsLayerRef.current;
    if (!graphicsLayer || !viewRef.current) return;

    graphicsLayer.removeAll();

    points.forEach(p => {
      const g = mapPointToGraphic(p, selectedItemId === p.id);
      graphicsLayer.add(g);
    });

    areas.forEach(a => {
      const g = mapAreaToGraphic(a, selectedItemId === a.id);
      graphicsLayer.add(g);
    });
  }, [points, areas, selectedItemId]);

  // 5. Enfocar elemento seleccionado
  useEffect(() => {
    const view = viewRef.current;
    const graphicsLayer = graphicsLayerRef.current;
    if (!view || !graphicsLayer || !selectedItemId) return;

    const targetGraphic = graphicsLayer.graphics.find(g => g.attributes?.id === selectedItemId);
    
    if (targetGraphic && targetGraphic.geometry) {
      const isPoint = targetGraphic.geometry.type === 'point';
      view.goTo({
        target: targetGraphic,
        zoom: isPoint ? 14 : view.zoom
      }, {
        duration: 800,
        easing: 'ease-out-cubic' as any
      }).then(() => {
        view.openPopup({
          features: [targetGraphic],
          location: (isPoint 
            ? targetGraphic.geometry 
            : (targetGraphic.geometry as Polygon).centroid) as Point
        });
      });
    }
  }, [selectedItemId]);

  return { coords, zoom, scale };
};

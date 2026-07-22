import { useEffect, useState, useRef, useCallback } from "react";
import ImageryTileLayer from "@arcgis/core/layers/ImageryTileLayer";
import GroupLayer from "@arcgis/core/layers/GroupLayer";
import RasterStretchRenderer from "@arcgis/core/renderers/RasterStretchRenderer";
import { X, ChevronLeft, ChevronRight, AlertTriangle, Loader, Layers } from "lucide-react";
import type MapView from "@arcgis/core/views/MapView";

import "@arcgis/map-components/components/arcgis-swipe";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "arcgis-swipe": Record<string, unknown>;
    }
  }
}

const COG_SOURCES = [
  {
    id: "cogA",
    url: "https://vantor-opendata.s3.amazonaws.com/events/Venezuela-Earthquake-Jun-2026/B140001100B5C810.tif",
    label: "Escena A — Jun 29",
  },
  {
    id: "cogB",
    url: "https://vantor-opendata.s3.amazonaws.com/events/Venezuela-Earthquake-Jun-2026/B040001100075610.tif",
    label: "Escena B — Jun 26",
  },
] as const;

const LA_GUAIRA_CENTER: [number, number] = [-66.959, 10.603];
const LA_GUAIRA_ZOOM = 14;

const stretchRenderer = new RasterStretchRenderer({
  stretchType: "min-max",
  gamma: [1, 1, 1],
  useGamma: true,
});

interface SwipeComparisonProps {
  view: MapView;
  onClose: () => void;
}

export const SwipeComparison: React.FC<SwipeComparisonProps> = ({ view, onClose }) => {
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [layerVis, setLayerVis] = useState<Record<string, boolean>>({ cogA: true, cogB: true });
  const cogLayersRef = useRef<Map<string, ImageryTileLayer>>(new Map());
  const groupLayerRef = useRef<GroupLayer | null>(null);
  const cleanupRef = useRef<() => void>(() => {});

  const toggleLayer = useCallback((id: string) => {
    setLayerVis((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const layer = cogLayersRef.current.get(id);
      if (layer) layer.visible = next[id];
      return next;
    });
  }, []);

  useEffect(() => {
    let disposed = false;
    const allLayers: (ImageryTileLayer | GroupLayer)[] = [];

    const init = async () => {
      const loadPromises = COG_SOURCES.map((src) => {
        const layer = new ImageryTileLayer({
          url: src.url,
          bandIds: [2, 1, 0],
          renderer: stretchRenderer,
          title: src.label,
        });
        cogLayersRef.current.set(src.id, layer);
        return layer.load().then(() => ({ id: src.id, ok: true, layer })).catch(() => ({ id: src.id, ok: false, layer }));
      });

      const results = await Promise.all(loadPromises);
      if (disposed) return;

      const loaded = results.filter((r) => r.ok);
      const failed = results.filter((r) => !r.ok);

      if (loaded.length === 0) {
        setWarning("No se pudieron cargar las imagenes post-sismo");
        setLoading(false);
        return;
      }

      if (failed.length > 0) {
        const names = failed.map((r) => r.id === "cogA" ? "Escena A" : "Escena B").join(", ");
        setWarning(`${names} no disponible(s)`);
        setTimeout(() => setWarning(null), 6000);
      }

      const groupLayer = new GroupLayer({
        layers: loaded.map((r) => r.layer),
        title: "Post-sismo",
      });
      groupLayerRef.current = groupLayer;
      allLayers.push(groupLayer);

      const map = view.map!;
      if (!map.layers.includes(groupLayer)) map.add(groupLayer, 0);

      await view.whenLayerView(groupLayer).then(() => {}).catch(() => {});
      if (disposed) return;

      const swipeEl = document.querySelector("arcgis-swipe") as any;
      if (swipeEl) {
        swipeEl.view = view;
        swipeEl.leadingLayers = [];
        swipeEl.trailingLayers = [groupLayer];
        swipeEl.direction = "horizontal";
        swipeEl.position = 50;
      }

      setLoading(false);

      view
        .goTo(
          { center: LA_GUAIRA_CENTER, zoom: LA_GUAIRA_ZOOM },
          { duration: 1200, easing: "ease-in-out" },
        )
        .catch(() => {});
    };

    init();

    cleanupRef.current = () => {
      disposed = true;
      try {
        const swipeEl = document.querySelector("arcgis-swipe") as any;
        if (swipeEl) {
          swipeEl.leadingLayers = [];
          swipeEl.trailingLayers = [];
          swipeEl.view = null;
        }
        const map = view.map;
        if (map) {
          allLayers.forEach((l) => {
            try { map.remove(l); } catch {}
          });
        }
        cogLayersRef.current.clear();
        groupLayerRef.current = null;
      } catch {}
    };

    return () => cleanupRef.current();
  }, [view]);

  const handleClose = () => {
    cleanupRef.current();
    onClose();
  };

  return (
    <>
      <arcgis-swipe auto-destroy-disabled />

      <div className="swipe-overlay">
        <div className="swipe-label-bar">
          <span className="swipe-label swipe-label-before">
            <ChevronLeft size={14} />
            ACTUAL
          </span>
          <span className="swipe-label swipe-label-divider">|</span>
          <span className="swipe-label swipe-label-after">
            POST-SISMO
            <ChevronRight size={14} />
          </span>
        </div>
      </div>

      <button className="swipe-close-btn" onClick={handleClose} title="Cerrar comparacion">
        <X size={18} />
      </button>

      <button
        className="swipe-layer-toggle"
        onClick={() => setPanelOpen((p) => !p)}
        title="Seleccionar capas"
      >
        <Layers size={16} />
      </button>

      {panelOpen && (
        <div className="swipe-layer-panel">
          <div className="swipe-layer-panel-title">Capas post-sismo</div>
          {COG_SOURCES.map((src) => (
            <label key={src.id} className="swipe-layer-item">
              <input
                type="checkbox"
                checked={layerVis[src.id]}
                onChange={() => toggleLayer(src.id)}
              />
              <span>{src.label}</span>
            </label>
          ))}
        </div>
      )}

      {loading && (
        <div className="swipe-loading">
          <Loader size={16} className="spin" />
          Cargando imagenes satelitales...
        </div>
      )}

      {warning && (
        <div className="swipe-warning-toast">
          <AlertTriangle size={14} />
          {warning}
        </div>
      )}
    </>
  );
};

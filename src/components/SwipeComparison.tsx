import React, { useEffect, useState, useRef, useCallback } from "react";
import ImageryTileLayer from "@arcgis/core/layers/ImageryTileLayer";
import GroupLayer from "@arcgis/core/layers/GroupLayer";
import RasterStretchRenderer from "@arcgis/core/renderers/RasterStretchRenderer";
import Swipe from "@arcgis/core/widgets/Swipe";
import { X, ChevronLeft, ChevronRight, AlertTriangle, Layers, Check, Loader } from "lucide-react";
import type MapView from "@arcgis/core/views/MapView";

const COG_SOURCES = [
  {
    id: "cogA",
    url: "https://vantor-opendata.s3.amazonaws.com/events/Venezuela-Earthquake-Jun-2026/B140001100B5CA10.tif",
    label: "Escena A — Jun 29",
  },
  {
    id: "cogB",
    url: "https://vantor-opendata.s3.amazonaws.com/events/Venezuela-Earthquake-Jun-2026/B140001100B5C810.tif",
    label: "Escena B — Jun 29",
  },
  {
    id: "cogC",
    url: "https://vantor-opendata.s3.amazonaws.com/events/Venezuela-Earthquake-Jun-2026/B140001100B5C710.tif",
    label: "Escena C — Jun 29",
  },
  {
    id: "cogD",
    url: "https://vantor-opendata.s3.amazonaws.com/events/Venezuela-Earthquake-Jun-2026/B140001100B5C710.tif",
    label: "Escena D — Jun 29",
  },
] as const;

const stretchRenderer = new RasterStretchRenderer({
  stretchType: "min-max",
  gamma: [1, 1, 1],
  useGamma: true,
});

const globalCogCache = new Map<string, ImageryTileLayer>();

function getOrCreateCogLayer(id: string): ImageryTileLayer | null {
  const src = COG_SOURCES.find((s) => s.id === id);
  if (!src) return null;
  let layer = globalCogCache.get(id);
  if (!layer) {
    layer = new ImageryTileLayer({
      url: src.url,
      bandIds: [2, 1, 0],
      renderer: stretchRenderer,
      title: src.label,
    });
    globalCogCache.set(id, layer);
    layer.load().catch(() => {
      globalCogCache.delete(id);
    });
  }
  return layer;
}

// Precargar metadatos del COG principal en segundo plano
if (typeof window !== "undefined") {
  setTimeout(() => {
    getOrCreateCogLayer("cogB");
  }, 500);
}

type LayerStatus = "idle" | "loading" | "ok" | "error";

interface SwipeComparisonProps {
  view: MapView;
  onClose: () => void;
}

export const SwipeComparison: React.FC<SwipeComparisonProps> = ({ view, onClose: _onClose }) => {
  const [warning, setWarning] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [layerVis, setLayerVis] = useState<Record<string, boolean>>({ cogA: false, cogB: true, cogC: false, cogD: false });
  const [layerStatus, setLayerStatus] = useState<Record<string, LayerStatus>>({ cogA: "idle", cogB: "idle", cogC: "idle", cogD: "idle" });
  const groupLayerRef = useRef<GroupLayer | null>(null);
  const swipeWidgetRef = useRef<Swipe | null>(null);

  const leftPos = "16px";

  const setStatus = useCallback((id: string, status: LayerStatus) => {
    setLayerStatus((prev) => ({ ...prev, [id]: status }));
  }, []);

  const loadCog = useCallback(async (id: string) => {
    const src = COG_SOURCES.find((s) => s.id === id);
    if (!src || !groupLayerRef.current) return;

    const layer = getOrCreateCogLayer(id);
    if (!layer) return;

    if (layer.loaded) {
      if (!groupLayerRef.current.layers.includes(layer)) {
        groupLayerRef.current.add(layer);
      }
      setStatus(id, "ok");
      return;
    }

    setStatus(id, "loading");
    try {
      await layer.load();
      if (groupLayerRef.current && !groupLayerRef.current.layers.includes(layer)) {
        groupLayerRef.current.add(layer);
      }
      setStatus(id, "ok");
    } catch {
      setStatus(id, "error");
      globalCogCache.delete(id);
      setWarning(`${src.label} no disponible`);
      setTimeout(() => setWarning(null), 6000);
    }
  }, [setStatus]);

  const unloadCog = useCallback((id: string) => {
    const layer = globalCogCache.get(id);
    if (layer && groupLayerRef.current) {
      groupLayerRef.current.remove(layer);
      setStatus(id, "idle");
    }
  }, [setStatus]);

  const toggleLayer = useCallback((id: string) => {
    setLayerVis((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (next[id]) {
        loadCog(id);
      } else {
        unloadCog(id);
      }
      return next;
    });
  }, [loadCog, unloadCog]);

  useEffect(() => {
    if (!view) return;

    const groupLayer = new GroupLayer({ title: "Post-sismo" });
    groupLayerRef.current = groupLayer;

    const map = view.map;
    if (map && !map.layers.includes(groupLayer)) {
      map.add(groupLayer, 0);
    }

    const swipeWidget = new Swipe({
      view: view,
      leadingLayers: [],
      trailingLayers: [groupLayer],
      direction: "horizontal",
      position: 50,
    });

    swipeWidgetRef.current = swipeWidget;
    view.ui.add(swipeWidget);

    loadCog("cogB");

    return () => {
      try {
        if (swipeWidgetRef.current) {
          view.ui.remove(swipeWidgetRef.current);
          swipeWidgetRef.current.destroy();
          swipeWidgetRef.current = null;
        }
        if (map && groupLayerRef.current) {
          map.remove(groupLayerRef.current);
          groupLayerRef.current = null;
        }
      } catch (err) {
        console.error("Error cleaning up Swipe widget:", err);
      }
    };
  }, [view, loadCog]);

  return (
    <>
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

      <button
        className="swipe-layer-toggle"
        onClick={() => setPanelOpen((p) => !p)}
        title="Seleccionar capas"
        style={{ left: leftPos }}
      >
        <Layers size={16} />
      </button>

      {panelOpen && (
        <div
          className="swipe-layer-panel"
          style={{ left: leftPos }}
        >
          <div className="swipe-layer-panel-title">Capas post-sismo</div>
          {COG_SOURCES.map((src) => (
            <label key={src.id} className="swipe-layer-item">
              <input
                type="checkbox"
                checked={layerVis[src.id]}
                onChange={() => toggleLayer(src.id)}
              />
              <span>{src.label}</span>
              <span className="swipe-layer-status">
                {layerStatus[src.id] === "loading" && <Loader size={12} className="spin" />}
                {layerStatus[src.id] === "ok" && <Check size={12} />}
                {layerStatus[src.id] === "error" && <X size={12} />}
              </span>
            </label>
          ))}
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

import React, { useEffect, useState, useRef, useCallback } from "react";
import ImageryTileLayer from "@arcgis/core/layers/ImageryTileLayer";
import WebTileLayer from "@arcgis/core/layers/WebTileLayer";
import GroupLayer from "@arcgis/core/layers/GroupLayer";
import Swipe from "@arcgis/core/widgets/Swipe";
import { X, AlertTriangle, Check, Loader } from "lucide-react";
import type MapView from "@arcgis/core/views/MapView";
import type Layer from "@arcgis/core/layers/Layer";

interface ComparisonSource {
  id: string;
  type: "webtile" | "cog";
  url: string;
  label: string;
}

const COMPARISON_SOURCES: readonly ComparisonSource[] = [
  {
    id: "googleSat",
    type: "webtile",
    url: "https://mt{subDomain}.google.com/vt/lyrs=s&x={col}&y={row}&z={level}",
    label: "Google Satelital (Principal)",
  },
  {
    id: "cogA",
    type: "cog",
    url: "https://vantor-opendata.s3.amazonaws.com/events/Venezuela-Earthquake-Jun-2026/B140001100B5CA10.tif",
    label: "Escena A — Jun 29",
  },
  {
    id: "cogB",
    type: "cog",
    url: "https://vantor-opendata.s3.amazonaws.com/events/Venezuela-Earthquake-Jun-2026/B140001100B5C810.tif",
    label: "Escena B — Jun 29",
  },
  {
    id: "cogC",
    type: "cog",
    url: "https://vantor-opendata.s3.amazonaws.com/events/Venezuela-Earthquake-Jun-2026/B140001100B5C710.tif",
    label: "Escena C — Jun 29",
  },
  {
    id: "cogD",
    type: "cog",
    url: "https://vantor-opendata.s3.amazonaws.com/events/Venezuela-Earthquake-Jun-2026/B140001100B5C710.tif",
    label: "Escena D — Jun 29",
  },
] as const;

const globalLayerCache = new Map<string, Layer>();

function getOrCreateComparisonLayer(id: string): Layer | null {
  const src = COMPARISON_SOURCES.find((s) => s.id === id);
  if (!src) return null;
  let layer = globalLayerCache.get(id);
  if (!layer) {
    if (src.type === "webtile") {
      layer = new WebTileLayer({
        urlTemplate: src.url,
        subDomains: ["0", "1", "2", "3"],
        title: src.label,
      });
    } else {
      layer = new ImageryTileLayer({
        url: src.url,
        title: src.label,
      });
    }
    globalLayerCache.set(id, layer);
    layer.load().catch(() => {
      globalLayerCache.delete(id);
    });
  }
  return layer;
}

type LayerStatus = "idle" | "loading" | "ok" | "error";

interface SwipeComparisonProps {
  view: MapView;
  onClose: () => void;
}

export const SwipeComparison: React.FC<SwipeComparisonProps> = ({ view, onClose: _onClose }) => {
  const [warning, setWarning] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [layerVis, setLayerVis] = useState<Record<string, boolean>>({
    googleSat: true,
    cogA: false,
    cogB: false,
    cogC: false,
    cogD: false,
  });
  const [layerStatus, setLayerStatus] = useState<Record<string, LayerStatus>>({
    googleSat: "idle",
    cogA: "idle",
    cogB: "idle",
    cogC: "idle",
    cogD: "idle",
  });
  const groupLayerRef = useRef<GroupLayer | null>(null);
  const swipeWidgetRef = useRef<Swipe | null>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    const handleToggle = () => setPanelOpen((p) => !p);
    window.addEventListener("resize", check);
    window.addEventListener("toggle-swipe-panel", handleToggle);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("toggle-swipe-panel", handleToggle);
    };
  }, []);

  const setStatus = useCallback((id: string, status: LayerStatus) => {
    setLayerStatus((prev) => ({ ...prev, [id]: status }));
  }, []);

  const loadLayer = useCallback(async (id: string) => {
    const src = COMPARISON_SOURCES.find((s) => s.id === id);
    if (!src || !groupLayerRef.current) return;

    const layer = getOrCreateComparisonLayer(id);
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
      globalLayerCache.delete(id);
      setWarning(`${src.label} no disponible`);
      setTimeout(() => setWarning(null), 6000);
    }
  }, [setStatus]);

  const unloadLayer = useCallback((id: string) => {
    const layer = globalLayerCache.get(id);
    if (layer && groupLayerRef.current) {
      groupLayerRef.current.remove(layer);
      setStatus(id, "idle");
    }
  }, [setStatus]);

  const toggleLayer = useCallback((id: string) => {
    setLayerVis((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (next[id]) {
        loadLayer(id);
      } else {
        unloadLayer(id);
      }
      return next;
    });
  }, [loadLayer, unloadLayer]);

  useEffect(() => {
    if (!view) return;

    const groupLayer = new GroupLayer({ title: "Capa Después / Comparación" });
    groupLayerRef.current = groupLayer;

    const map = view.map;
    if (map && !map.layers.includes(groupLayer)) {
      map.add(groupLayer, 0);
    }

    const swipeDirection = isMobile ? "vertical" : "horizontal";

    const swipeWidget = new Swipe({
      view: view,
      leadingLayers: [],
      trailingLayers: [groupLayer],
      direction: swipeDirection,
      position: 50,
    });

    swipeWidgetRef.current = swipeWidget;
    view.ui.add(swipeWidget);

    // Cargar Google Satelital como capa principal inicial del Después
    loadLayer("googleSat");

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
  }, [view, loadLayer, isMobile]);

  return (
    <>
      {panelOpen && (
        <div
          className="swipe-layer-panel"
          style={{ position: "fixed", bottom: "68px", left: "132px", top: "auto", zIndex: 120 }}
        >
          <div className="swipe-layer-panel-title">Capas de Comparación (Después)</div>
          {COMPARISON_SOURCES.map((src) => (
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

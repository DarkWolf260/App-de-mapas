import { useEffect, useState, useRef } from "react";
import TileLayer from "@arcgis/core/layers/TileLayer";
import ImageryTileLayer from "@arcgis/core/layers/ImageryTileLayer";
import GroupLayer from "@arcgis/core/layers/GroupLayer";
import RasterStretchRenderer from "@arcgis/core/renderers/RasterStretchRenderer";
import { X, ChevronLeft, ChevronRight, AlertTriangle, Loader } from "lucide-react";
import type MapView from "@arcgis/core/views/MapView";

import "@arcgis/map-components/components/arcgis-swipe";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "arcgis-swipe": Record<string, unknown>;
    }
  }
}

const VANTOR_BEFORE_URL =
  "https://tiles.arcgis.com/tiles/F4wmVgGRtJMzSu8M/arcgis/rest/services/Vantor_Antes_WTL1/MapServer";

const VANTOR_AFTER_COG_A =
  "https://vantor-opendata.s3.amazonaws.com/events/Venezuela-Earthquake-Jun-2026/B140001100B5C810.tif";

const VANTOR_AFTER_COG_B =
  "https://vantor-opendata.s3.amazonaws.com/events/Venezuela-Earthquake-Jun-2026/B040001100075610.tif";

const WORLD_IMAGERY_URL =
  "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer";

const LA_GUAIRA_CENTER: [number, number] = [-66.959, 10.603];
const LA_GUAIRA_ZOOM = 14;

type SwipeLayer = TileLayer | ImageryTileLayer | GroupLayer;

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
  const cleanupRef = useRef<() => void>(() => {});

  useEffect(() => {
    let disposed = false;
    const allLayers: SwipeLayer[] = [];

    const init = async () => {
      const beforeLayer = new TileLayer({ url: VANTOR_BEFORE_URL });
      allLayers.push(beforeLayer);

      const cogA = new ImageryTileLayer({
        url: VANTOR_AFTER_COG_A,
        bandIds: [2, 1, 0],
        renderer: stretchRenderer,
        title: "Post-sismo A",
      });

      const cogB = new ImageryTileLayer({
        url: VANTOR_AFTER_COG_B,
        bandIds: [2, 1, 0],
        renderer: stretchRenderer,
        title: "Post-sismo B",
      });
      allLayers.push(cogA, cogB);

      const loadBefore = beforeLayer.load().then(() => true).catch(() => false);
      const loadA = cogA.load().then(() => true).catch(() => false);
      const loadB = cogB.load().then(() => true).catch(() => false);

      const [beforeOk, aOk, bOk] = await Promise.all([loadBefore, loadA, loadB]);
      if (disposed) return;

      if (!beforeOk) {
        setWarning("No se pudo cargar imagen pre-sismo");
      }

      let afterLayer: SwipeLayer;

      if (aOk || bOk) {
        const cogs: ImageryTileLayer[] = [];
        if (aOk) cogs.push(cogA);
        if (bOk) cogs.push(cogB);
        afterLayer = new GroupLayer({ layers: cogs, title: "Post-sismo" });
        allLayers.push(afterLayer);
      } else {
        const fallback = new TileLayer({ url: WORLD_IMAGERY_URL });
        allLayers.push(fallback);
        const fallbackOk = await fallback.load().then(() => true).catch(() => false);
        if (!fallbackOk) {
          setWarning("No se pudieron cargar las capas satelitales");
          setLoading(false);
          return;
        }
        afterLayer = fallback;
        setWarning("Imagen post-sismo no disponible — usando imagen actual");
        setTimeout(() => setWarning(null), 6000);
      }

      if (disposed) return;

      const map = view.map!;
      if (!map.layers.includes(beforeLayer)) map.add(beforeLayer, 0);
      if (!map.layers.includes(afterLayer)) map.add(afterLayer, 0);

      const waitForLayerView = (layer: SwipeLayer) =>
        view.whenLayerView(layer).then(() => {}).catch(() => {});

      await Promise.all([
        waitForLayerView(beforeLayer),
        waitForLayerView(afterLayer),
      ]);
      if (disposed) return;

      const swipeEl = document.querySelector("arcgis-swipe") as any;
      if (swipeEl) {
        swipeEl.view = view;
        swipeEl.leadingLayers = [beforeLayer];
        swipeEl.trailingLayers = [afterLayer];
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
            ANTES
          </span>
          <span className="swipe-label swipe-label-divider">|</span>
          <span className="swipe-label swipe-label-after">
            DESPUÉS
            <ChevronRight size={14} />
          </span>
        </div>
      </div>

      <button className="swipe-close-btn" onClick={handleClose} title="Cerrar comparacion">
        <X size={18} />
      </button>

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

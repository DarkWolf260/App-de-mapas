import { useEffect, useRef, useState, useCallback, type MutableRefObject } from "react";
import Map from "ol/Map";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import { getRenderPixel } from "ol/render";

export interface UseMapSwipeOptions {
  mapRef: MutableRefObject<Map | null>;
  isMobile: boolean;
  onBeforeActivate?: () => void;
}

export const useMapSwipe = ({ mapRef, isMobile, onBeforeActivate }: UseMapSwipeOptions) => {
  const [swipeActive, setSwipeActive] = useState(false);
  const [swipePosition, setSwipePosition] = useState(50);

  const swipePositionRef = useRef(swipePosition);
  useEffect(() => {
    swipePositionRef.current = swipePosition;
  }, [swipePosition]);

  const isMobileRef = useRef(isMobile);
  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);

  const swipeLayerRef = useRef<TileLayer<XYZ> | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (swipeActive) {
      if (!swipeLayerRef.current) {
        const swipeLayer = new TileLayer({
          preload: 0,
          source: new XYZ({
            url: "https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
            maxZoom: 20,
          }),
        });

        swipeLayer.on("prerender", (event: any) => {
          const ctx = event.context as CanvasRenderingContext2D;
          if (!ctx) return;
          const mapSize = map.getSize();
          if (!mapSize) return;
          const width = mapSize[0];
          const height = mapSize[1];
          const pos = swipePositionRef.current;
          const mobile = isMobileRef.current;

          if (mobile) {
            // En móvil: deslizamiento vertical (de arriba a abajo)
            const clipY = height * (pos / 100);
            const tl = getRenderPixel(event, [0, clipY]);
            const tr = getRenderPixel(event, [width, clipY]);
            const bl = getRenderPixel(event, [0, height]);
            const br = getRenderPixel(event, [width, height]);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(tl[0], tl[1]);
            ctx.lineTo(tr[0], tr[1]);
            ctx.lineTo(br[0], br[1]);
            ctx.lineTo(bl[0], bl[1]);
            ctx.closePath();
            ctx.clip();
          } else {
            // En escritorio: deslizamiento horizontal (de izquierda a derecha)
            const clipX = width * (pos / 100);
            const tl = getRenderPixel(event, [clipX, 0]);
            const tr = getRenderPixel(event, [width, 0]);
            const bl = getRenderPixel(event, [clipX, height]);
            const br = getRenderPixel(event, [width, height]);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(tl[0], tl[1]);
            ctx.lineTo(tr[0], tr[1]);
            ctx.lineTo(br[0], br[1]);
            ctx.lineTo(bl[0], bl[1]);
            ctx.closePath();
            ctx.clip();
          }
        });

        swipeLayer.on("postrender", (event: any) => {
          const ctx = event.context as CanvasRenderingContext2D;
          if (ctx) ctx.restore();
        });

        const layers = map.getLayers();
        layers.insertAt(1, swipeLayer);
        swipeLayerRef.current = swipeLayer;
      }
      map.render();
    } else {
      if (swipeLayerRef.current) {
        map.removeLayer(swipeLayerRef.current);
        swipeLayerRef.current = null;
        map.render();
      }
    }
  }, [swipeActive, swipePosition, mapRef]);

  const activateSwipe = useCallback(() => {
    onBeforeActivate?.();
    setSwipeActive(true);
  }, [onBeforeActivate]);

  const deactivateSwipe = useCallback(() => {
    setSwipeActive(false);
  }, []);

  return {
    swipeActive,
    swipePosition,
    setSwipePosition,
    activateSwipe,
    deactivateSwipe,
  };
};

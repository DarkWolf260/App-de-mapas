import React, { useEffect, useRef, useState } from "react";
import type MapView from "@arcgis/core/views/MapView";
import type GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import type Graphic from "@arcgis/core/Graphic";
import type TextSymbol from "@arcgis/core/symbols/TextSymbol";
import type SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import Point from "@arcgis/core/geometry/Point";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import { hexToRgb } from "../utils/colorUtils";
import type { DrawnFeature, HtmlLabel } from "../types";

/**
 * Capa de dibujo alternativa basada en SVG (DOM).
 * Dibuja los elementos guardados encima del mapa sin depender del renderer
 * WebGL de ArcGIS, útil en PCs antiguas donde los GraphicsLayer no se pintan.
 *
 * Se comporta igual que HtmlPointLabels: en cada cambio del view (extent/zoom)
 * se re-proyectan TODOS los gráficos con view.toScreen() y se re-renderiza, de
 * modo que los elementos quedan siempre exactamente sobre su ubicación, durante
 * el pan/zoom y sin desfase.
 *
 * El SVG NO intercepta eventos de puntero (siempre pointerEvents: none), así
 * que el arrastre/zoom del mapa funciona normal. Los clics sobre los elementos
 * se detectan con un hit-test geométrico propio sobre el evento "click" del view.
 */
interface FeatureSvgOverlayProps {
  view: MapView | null;
  sketchLayer: GraphicsLayer | null;
  sketchVMRef?: React.MutableRefObject<SketchViewModel | null> | null;
  enabled: boolean;
  drawnFeatures?: DrawnFeature[];
  /** Etiquetas HTML activas (tarjetas negras con personal). Se usan para que el
   *  overlay NO vuelva a dibujar esas mismas etiquetas y para re-renderizar el
   *  SVG cada vez que la deconflicción recalcula la visibilidad de las etiquetas. */
  htmlLabels?: HtmlLabel[];
  interactive?: boolean;
  onFeatureClick?: (featId: number | string, screenPt: { x: number; y: number }) => void;
}

type Rgba = [number, number, number, number];

const DEFAULT_COLOR: Rgba = [59, 130, 246, 1];

function toRgba(color: unknown, fallback: Rgba = DEFAULT_COLOR): Rgba {
  if (typeof color === "string") {
    if (color.startsWith("#") && color.length >= 7) return [...hexToRgb(color), 1];
    return fallback;
  }
  if (Array.isArray(color) && color.length >= 3) {
    const [r, g, b] = color as number[];
    const a = color.length > 3 ? (color[3] as number) : 1;
    return [r, g, b, a ?? 1];
  }
  return fallback;
}

function rgbaStr([r, g, b, a]: Rgba, alpha: number): string {
  return `rgba(${r}, ${g}, ${b}, ${a !== undefined ? a * alpha : alpha})`;
}

function projectVertex(view: MapView, x: number, y: number, spatialReference: any): [number, number] | null {
  try {
    const p = view.toScreen(new Point({ x, y, spatialReference }));
    if (p && isFinite(p.x) && isFinite(p.y)) return [p.x, p.y];
  } catch {
    /* punto fuera del view */
  }
  return null;
}

function projectPoint(view: MapView, geom: any): [number, number] | null {
  try {
    const p = view.toScreen(geom as Point);
    if (p && isFinite(p.x) && isFinite(p.y)) return [p.x, p.y];
  } catch { /* noop */ }
  return null;
}

function projectPolyline(view: MapView, geom: any): Array<[number, number]> | null {
  const out: Array<[number, number]> = [];
  for (const path of geom.paths ?? []) {
    for (const [x, y] of path) {
      const p = projectVertex(view, x, y, geom.spatialReference);
      if (p) out.push(p);
    }
  }
  return out.length ? out : null;
}

function projectPolygonRings(view: MapView, geom: any): Array<Array<[number, number]>> | null {
  const rings: Array<Array<[number, number]>> = [];
  for (const ring of geom.rings ?? []) {
    const pts: Array<[number, number]> = [];
    for (const [x, y] of ring) {
      const p = projectVertex(view, x, y, geom.spatialReference);
      if (p) pts.push(p);
    }
    if (pts.length) rings.push(pts);
  }
  return rings.length ? rings : null;
}

function featIdOf(g: Graphic): number | string {
  return g.attributes?.id ?? (g as any).uid;
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function pointInPolygon(px: number, py: number, ring: Array<[number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function hitPolyline(x: number, y: number, pts: Array<[number, number]>, tol: number): boolean {
  for (let i = 0; i + 1 < pts.length; i++) {
    if (distToSegment(x, y, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]) <= tol) return true;
  }
  return false;
}

function hitPolygon(x: number, y: number, rings: Array<Array<[number, number]>>, tol: number): boolean {
  let inside = false;
  for (const ring of rings) {
    if (pointInPolygon(x, y, ring)) inside = !inside;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      if (distToSegment(x, y, a[0], a[1], b[0], b[1]) <= tol) return true;
    }
  }
  return inside;
}

const FeatureSvgOverlayInner: React.FC<FeatureSvgOverlayProps> = ({
  view,
  sketchLayer,
  sketchVMRef,
  enabled,
  drawnFeatures,
  htmlLabels,
  interactive = true,
  onFeatureClick,
}) => {
  const [, setTick] = useState(0);

  // Refs para no depender de cierres obsoletos en el hit-test de clics.
  const drawnFeaturesRef = useRef(drawnFeatures);
  const onFeatureClickRef = useRef(onFeatureClick);
  useEffect(() => { drawnFeaturesRef.current = drawnFeatures; }, [drawnFeatures]);
  useEffect(() => { onFeatureClickRef.current = onFeatureClick; }, [onFeatureClick]);

  // Re-proyectar al mover/zoomear el mapa (igual que HtmlPointLabels), con rAF
  // para no re-renderizar más de una vez por frame.
  useEffect(() => {
    if (!enabled || !view) return;
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; setTick((t) => t + 1); });
    };
    const watchHandle = reactiveUtils.watch(
      () => [view.extent, view.zoom, view.stationary] as const,
      schedule,
    );
    const resizeHandle = view.on("resize", schedule);
    schedule();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      watchHandle.remove();
      resizeHandle.remove();
    };
  }, [view, enabled]);

  // Re-dibujar cuando cambia la colección de gráficos (agregar/eliminar) o
  // cuando se reasigna la geometría de alguno (preview del SketchViewModel).
  useEffect(() => {
    if (!enabled || !sketchLayer) return;
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; setTick((t) => t + 1); });
    };
    const handles = [
      reactiveUtils.on(() => sketchLayer.graphics, "change", schedule),
      reactiveUtils.watch(
        () => sketchLayer.graphics.toArray().map((g) => g.geometry),
        schedule,
      ),
    ];
    return () => {
      if (raf) cancelAnimationFrame(raf);
      handles.forEach((h) => h.remove());
    };
  }, [enabled, sketchLayer]);

  // Re-dibujar cuando cambian los features/datos o cuando la deconflicción
  // recalcula la visibilidad de las etiquetas (htmlLabels cambia en cada corrida).
  useEffect(() => {
    if (enabled) setTick((t) => t + 1);
  }, [enabled, drawnFeatures, htmlLabels]);

  // Hit-test geométrico propio para clics (el SVG no intercepta puntero, así el
  // arrastre/zoom del mapa funciona normal). Lee valores frescos por ref.
  useEffect(() => {
    if (!enabled || !view || !sketchLayer || !interactive) return;
    const handle = view.on("click", (evt: any) => {
      if (sketchVMRef?.current?.activeTool) return;
      const x = evt.x;
      const y = evt.y;
      const knownIds = new Set((drawnFeaturesRef.current || []).map((f) => String(f.id)));
      let best: Graphic | null = null;
      for (const g of sketchLayer.graphics.toArray()) {
        if (g.attributes?.isLabel) continue;
        if (!g.visible || !g.geometry) continue;
        const fid = featIdOf(g);
        if (!knownIds.has(String(fid))) continue;
        const t = g.geometry.type;
        let hit = false;
        if (t === "point") {
          const pt = projectPoint(view, g.geometry);
          hit = !!pt && Math.hypot(pt[0] - x, pt[1] - y) <= 10;
        } else if (t === "polyline") {
          const pts = projectPolyline(view, g.geometry);
          hit = !!pts && hitPolyline(x, y, pts, 6);
        } else if (t === "polygon") {
          const rings = projectPolygonRings(view, g.geometry);
          hit = !!rings && hitPolygon(x, y, rings, 6);
        }
        if (hit) best = g;
      }
      if (best) onFeatureClickRef.current?.(featIdOf(best), { x, y });
    });
    return () => handle.remove();
  }, [enabled, view, sketchLayer, interactive, sketchVMRef]);

  if (!enabled || !view || !sketchLayer) return null;

  const colorById = new Map<string | number, string>();
  (drawnFeatures || []).forEach((f) => colorById.set(f.id, f.color || "#3b82f6"));

  const graphics = sketchLayer.graphics.toArray();
  const nodes: React.ReactNode[] = [];
  let key = 0;

  // Primer pase: geometrías (polígonos, líneas, puntos).
  for (const g of graphics) {
    if (g.attributes?.isLabel) continue;
    if (!g.visible || !g.geometry) continue;
    const fid = featIdOf(g);
    const color = toRgba(g.attributes?._color, toRgba(colorById.get(fid), DEFAULT_COLOR));

    if (g.geometry.type === "point") {
      const pt = projectPoint(view, g.geometry);
      if (!pt) continue;
      const [cx, cy] = pt;
      nodes.push(
        <circle
          key={`p${key++}`}
          cx={cx}
          cy={cy}
          r={6}
          fill={rgbaStr(color, 0.9)}
          stroke="rgba(255,255,255,0.8)"
          strokeWidth={1.5}
        />,
      );
    } else if (g.geometry.type === "polyline") {
      const pts = projectPolyline(view, g.geometry);
      if (!pts) continue;
      nodes.push(
        <polyline
          key={`l${key++}`}
          points={pts.map(([x, y]) => `${x},${y}`).join(" ")}
          fill="none"
          stroke={rgbaStr(color, 0.95)}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />,
      );
    } else if (g.geometry.type === "polygon") {
      const rings = projectPolygonRings(view, g.geometry);
      if (!rings) continue;
      const allPoints = rings.map((ring) => ring.map(([x, y]) => `${x},${y}`).join(" ")).join(" ");
      nodes.push(
        <polygon
          key={`a${key++}`}
          points={allPoints}
          fillRule="evenodd"
          fill={rgbaStr(color, 0.25)}
          stroke={rgbaStr(color, 0.95)}
          strokeWidth={2}
          strokeLinejoin="round"
        />,
      );
    }
  }

  // Segundo pase: etiquetas de texto visibles (respetan los umbrales de zoom y la deconflicción).
  // Las tarjetas negras (con personal) se renderizan en HtmlPointLabels, no aquí.
  const personnelIds = new Set((htmlLabels || []).map((l) => String(l.id)));
  for (const g of graphics) {
    if (!g.attributes?.isLabel) continue;
    if (personnelIds.has(String(g.attributes?.parentId))) continue;
    if (!g.visible || !g.geometry) continue;
    const pt = projectPoint(view, g.geometry);
    if (!pt) continue;
    const sym = g.symbol as TextSymbol;
    const [cx, cy] = pt;
    const text = sym?.text || "";
    if (!text) continue;
    const fontSize = typeof sym?.font?.size === "number" ? sym.font.size : 11;
    const yoffset = typeof sym?.yoffset === "number" ? sym.yoffset : 0;
    const textColor = sym?.color;
    const haloColor = sym?.haloColor;

    nodes.push(
      <text
        key={`t${key++}`}
        x={cx}
        y={cy + yoffset}
        textAnchor="middle"
        fill={rgbaStr(toRgba(textColor, [255, 255, 255, 1]), 1)}
        stroke={rgbaStr(toRgba(haloColor, [0, 0, 0, 1]), 1)}
        strokeWidth={2.5}
        strokeLinejoin="round"
        paintOrder="stroke"
        fontSize={fontSize}
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        {text}
      </text>,
    );
  }

  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      {nodes}
    </svg>
  );
};

export const FeatureSvgOverlay = React.memo(FeatureSvgOverlayInner);

export default FeatureSvgOverlay;

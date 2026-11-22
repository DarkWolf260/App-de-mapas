import { useEffect, useState, useMemo, type MutableRefObject } from "react";
import VectorSource from "ol/source/Vector";
import { fetchInspecciones, subscribeInspeccionesUpdates } from "../../services/inspeccionService";
import { syncInspeccionesToGraphics } from "../../utils/graphicsSync";
import type { InspeccionRecord, LayerVisibility } from "../../types";

export interface UseMapInspeccionesOptions {
  inspeccionesSourceRef: MutableRefObject<VectorSource | null>;
  layerVisibility: LayerVisibility;
  selectedDate: string;
  showAccumulated?: boolean;
}

export const useMapInspecciones = ({
  inspeccionesSourceRef,
  layerVisibility,
  selectedDate,
  showAccumulated = false,
}: UseMapInspeccionesOptions) => {
  const [inspeccionesRecords, setInspeccionesRecords] = useState<InspeccionRecord[]>([]);
  const [selectedColorFilter, setSelectedColorFilter] = useState<"all" | "rojo" | "amarillo" | "verde">("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("");

  const isInspeccionesVisible = !!layerVisibility.inspecciones;

  useEffect(() => {
    if (!isInspeccionesVisible) return;
    let isMounted = true;
    const unsub = subscribeInspeccionesUpdates((fresh) => {
      if (isMounted) setInspeccionesRecords(fresh);
    });
    if (inspeccionesRecords.length === 0) {
      fetchInspecciones().then((records) => {
        if (isMounted) {
          setInspeccionesRecords(records);
        }
      });
    }
    return () => {
      isMounted = false;
      unsub();
    };
  }, [isInspeccionesVisible, inspeccionesRecords.length]);

  const filteredInspeccionesRecords = useMemo(() => {
    return inspeccionesRecords.filter((r) => {
      if (!showAccumulated && !selectedDateFilter) {
        if (selectedDate && selectedDate.trim().length >= 8 && r.fecha) {
          if (!r.fecha.startsWith(selectedDate)) {
            return false;
          }
        }
      } else if (selectedDateFilter) {
        if (r.fecha && !r.fecha.startsWith(selectedDateFilter)) {
          return false;
        }
      }
      if (selectedColorFilter !== "all") {
        const tag = String(r.riesgo_color || "").toLowerCase();
        if (selectedColorFilter === "rojo") {
          return tag.includes("rojo") || tag.includes("roja") || tag.includes("alto") || tag.includes("insegur");
        }
        if (selectedColorFilter === "amarillo") {
          return tag.includes("amarillo") || tag.includes("amarilla") || tag.includes("medio") || tag.includes("precau");
        }
        if (selectedColorFilter === "verde") {
          return (
            !tag.includes("rojo") &&
            !tag.includes("roja") &&
            !tag.includes("alto") &&
            !tag.includes("amarillo") &&
            !tag.includes("amarilla") &&
            !tag.includes("medio")
          );
        }
      }
      return true;
    });
  }, [inspeccionesRecords, selectedDateFilter, selectedDate, showAccumulated, selectedColorFilter]);

  useEffect(() => {
    const source = inspeccionesSourceRef.current;
    if (!source) return;
    syncInspeccionesToGraphics(source, filteredInspeccionesRecords, layerVisibility.inspecciones ?? false);
  }, [filteredInspeccionesRecords, layerVisibility.inspecciones, inspeccionesSourceRef]);

  return {
    inspeccionesRecords,
    filteredInspeccionesRecords,
    selectedColorFilter,
    setSelectedColorFilter,
    selectedDateFilter,
    setSelectedDateFilter,
  };
};

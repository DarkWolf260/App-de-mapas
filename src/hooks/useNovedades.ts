import { useState, useCallback } from "react";
import { supabaseNovedadRepo } from "../repositories/supabaseImpl";
import type { INovedadRepository } from "../repositories/interfaces";
import type { NovedadEntry } from "../types";
import { showToast } from "../utils/toast";

export interface UseNovedadesOptions {
  novedadRepo?: INovedadRepository;
}

export function useNovedades(opts: UseNovedadesOptions = {}) {
  const novedadRepo = opts.novedadRepo ?? supabaseNovedadRepo;
  const [globalNovedades, setGlobalNovedades] = useState<NovedadEntry[]>([]);

  const fetchGlobalNovedades = useCallback(
    async (date: string, department?: string) => {
      try {
        const entries = await novedadRepo.fetch(date, department);
        setGlobalNovedades(entries);
      } catch (err) {
        console.error("[useNovedades] fetch error:", err);
      }
    },
    [novedadRepo]
  );

  const saveGlobalNovedad = useCallback(
    async (entry: NovedadEntry, date: string, department = "pc") => {
      setGlobalNovedades((prev) => [...prev, entry]);
      try {
        await novedadRepo.insert(entry, date, department);
      } catch {
        setGlobalNovedades((prev) => prev.filter((n) => n.id !== entry.id));
        showToast("Error al guardar novedad. Verifique su conexión.", "error");
      }
    },
    [novedadRepo]
  );

  const deleteGlobalNovedad = useCallback(
    async (entryId: string) => {
      let removed: NovedadEntry | undefined;
      setGlobalNovedades((prev) => {
        removed = prev.find((n) => n.id === entryId);
        return prev.filter((n) => n.id !== entryId);
      });
      try {
        await novedadRepo.delete(entryId);
      } catch {
        if (removed) setGlobalNovedades((prev) => [...prev, removed!]);
        showToast("Error al eliminar novedad. Verifique su conexión.", "error");
      }
    },
    [novedadRepo]
  );

  const updateGlobalNovedad = useCallback(
    async (entryId: string, newText: string, newTime?: string) => {
      let previous: NovedadEntry | undefined;
      setGlobalNovedades((prev) => {
        const idx = prev.findIndex((n) => n.id === entryId);
        if (idx === -1) return prev;
        previous = prev[idx];
        const updated = [...prev];
        updated[idx] = {
          ...prev[idx],
          text: newText,
          ...(newTime !== undefined ? { time: newTime } : {}),
        };
        return updated;
      });
      try {
        const payload: Record<string, string> = { text: newText };
        if (newTime !== undefined) payload.time = newTime;
        await novedadRepo.update(entryId, payload);
      } catch {
        if (previous) {
          setGlobalNovedades((prev) => prev.map((n) => (n.id === entryId ? previous! : n)));
        }
        showToast("Error al editar novedad. Verifique su conexión.", "error");
      }
    },
    [novedadRepo]
  );

  return {
    globalNovedades,
    setGlobalNovedades,
    fetchGlobalNovedades,
    saveGlobalNovedad,
    deleteGlobalNovedad,
    updateGlobalNovedad,
  };
}

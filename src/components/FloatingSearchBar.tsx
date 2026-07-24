import React, { useState, useEffect, useRef, useMemo } from "react";
import type { DrawnFeature } from "../types";
import { Search, MapPin, Activity, Square, X, Crosshair, Plus } from "lucide-react";

interface FloatingSearchBarProps {
  drawnFeatures: DrawnFeature[];
  onZoomToFeature: (feat: DrawnFeature) => void;
  onGoToCoords: (lat: number, lon: number) => void;
  onCreatePointAtCoords: (lat: number, lon: number) => void;
  showSidebar: boolean;
}

function parseCoords(input: string): { lat: number; lon: number } | null {
  const cleaned = input.replace(/\s+/g, " ").trim();
  const parts = cleaned.split(/[;,]/).map((s) => s.trim());
  let nums: number[];

  if (parts.length === 2) {
    nums = parts.map(Number);
    if (nums.some(isNaN)) return null;
  } else {
    const spaceParts = cleaned.split(" ");
    if (spaceParts.length >= 2) {
      nums = spaceParts.map(Number).filter((n) => !isNaN(n));
      if (nums.length < 2) return null;
    } else {
      return null;
    }
  }

  const [a, b] = nums;

  if (a >= -90 && a <= 90 && b >= -180 && b <= 180) {
    return { lat: a, lon: b };
  }
  if (b >= -90 && b <= 90 && a >= -180 && a <= 180) {
    return { lat: b, lon: a };
  }

  return null;
}

export const FloatingSearchBar: React.FC<FloatingSearchBarProps> = ({
  drawnFeatures,
  onZoomToFeature,
  onGoToCoords,
  onCreatePointAtCoords,
  showSidebar,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filtered = query.trim()
    ? drawnFeatures.filter((feat) => {
        const q = query.toLowerCase();
        const titleMatch = feat.title?.toLowerCase().includes(q);
        const descMatch = feat.description?.toLowerCase().includes(q);
        const collapsedMatch = !!feat.isCollapsed && ("colapsado".includes(q) || String(feat.collapsedCount || "").includes(q));
        return titleMatch || descMatch || collapsedMatch;
      })
    : [];

  const coords = useMemo(() => {
    if (!query.trim()) return null;
    return parseCoords(query);
  }, [query]);

  const showDropdown = isOpen && query.trim() && (filtered.length > 0 || coords);

  const handleSelect = (feat: DrawnFeature) => {
    onZoomToFeature(feat);
    setIsOpen(false);
    setQuery("");
  };

  const handleGoToCoords = () => {
    if (!coords) return;
    onGoToCoords(coords.lat, coords.lon);
    setIsOpen(false);
  };

  const handleCreatePoint = () => {
    if (!coords) return;
    onCreatePointAtCoords(coords.lat, coords.lon);
    setIsOpen(false);
    setQuery("");
  };

  const getFeatureIcon = (type: "point" | "polyline" | "polygon", color: string) => {
    const style = { color: color || "var(--color-info)", flexShrink: 0 };
    switch (type) {
      case "point":
        return <MapPin size={14} style={style} />;
      case "polyline":
        return <Activity size={14} style={style} />;
      case "polygon":
        return <Square size={14} style={style} />;
    }
  };

  const getFeatureTypeText = (type: "point" | "polyline" | "polygon") => {
    switch (type) {
      case "point":
        return "Punto";
      case "polyline":
        return "Línea";
      case "polygon":
        return "Polígono";
    }
  };

  if (showSidebar) return null;

  return (
    <div
      ref={containerRef}
      className="floating-search-container"
      style={{ left: "80px" }}
    >
      <div className="floating-search-bar">
        <Search className="floating-search-icon" size={16} />
        <input
          type="text"
          placeholder="Buscar puntos o coordenadas..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="floating-search-input"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="floating-search-clear"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="floating-search-dropdown scrollable-thin">
          {coords && (
            <div className="floating-search-coord-result">
              <div className="floating-search-coord-header">
                <Crosshair size={14} style={{ color: "rgba(56, 189, 248, 0.9)" }} />
                <span className="floating-search-coord-label">Coordenadas</span>
                <span className="floating-search-coord-value">
                  {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
                </span>
              </div>
              <div className="floating-search-coord-actions">
                <button className="floating-search-coord-btn" onClick={handleGoToCoords}>
                  <Crosshair size={12} />
                  Ir al punto
                </button>
                <button className="floating-search-coord-btn accent" onClick={handleCreatePoint}>
                  <Plus size={12} />
                  Crear punto
                </button>
              </div>
            </div>
          )}

          {filtered.length > 0 && (
            <>
              {filtered.map((feat) => (
                <div
                  key={feat.id}
                  onClick={() => handleSelect(feat)}
                  className="floating-search-item"
                >
                  <div className="floating-search-item-header">
                    {getFeatureIcon(feat.type, feat.color || "")}
                    <span className="floating-search-item-title">{feat.title}</span>
                    {feat.isCollapsed && (
                      <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "#f87171", background: "rgba(239, 68, 68, 0.2)", padding: "1px 5px", borderRadius: "4px", border: "1px solid rgba(239, 68, 68, 0.4)", marginLeft: "4px" }}>
                        Colapsado: {feat.collapsedCount || "1"}
                      </span>
                    )}
                    <span className="floating-search-item-badge">
                      {getFeatureTypeText(feat.type)}
                    </span>
                  </div>
                  {feat.description && (
                    <p className="floating-search-item-desc">{feat.description}</p>
                  )}
                </div>
              ))}
            </>
          )}

          {!coords && filtered.length === 0 && (
            <div className="floating-search-empty">No se encontraron elementos</div>
          )}
        </div>
      )}
    </div>
  );
};

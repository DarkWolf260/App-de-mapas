import React, { useState, useEffect, useRef } from "react";
import type { DrawnFeature } from "../App";
import { Search, MapPin, Activity, Square, X } from "lucide-react";

interface FloatingSearchBarProps {
  drawnFeatures: DrawnFeature[];
  onZoomToFeature: (feat: DrawnFeature) => void;
  showSidebar: boolean;
}

export const FloatingSearchBar: React.FC<FloatingSearchBarProps> = ({
  drawnFeatures,
  onZoomToFeature,
  showSidebar,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close
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

  // Filter drawn features
  const filtered = query.trim()
    ? drawnFeatures.filter((feat) => {
        const titleMatch = feat.title?.toLowerCase().includes(query.toLowerCase());
        const descMatch = feat.description?.toLowerCase().includes(query.toLowerCase());
        return titleMatch || descMatch;
      })
    : [];

  const handleSelect = (feat: DrawnFeature) => {
    onZoomToFeature(feat);
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

  // Compute absolute left dynamically to follow sidebar transition smoothly
  const leftPos = showSidebar ? "470px" : "80px";

  return (
    <div
      ref={containerRef}
      className="floating-search-container"
      style={{ left: leftPos }}
    >
      <div className="floating-search-bar">
        <Search className="floating-search-icon" size={16} />
        <input
          type="text"
          placeholder="Buscar puntos o polígonos..."
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

      {isOpen && query.trim() && (
        <div className="floating-search-dropdown scrollable-thin">
          {filtered.length > 0 ? (
            filtered.map((feat) => (
              <div
                key={feat.id}
                onClick={() => handleSelect(feat)}
                className="floating-search-item"
              >
                <div className="floating-search-item-header">
                  {getFeatureIcon(feat.type, feat.color || "")}
                  <span className="floating-search-item-title">{feat.title}</span>
                  <span className="floating-search-item-badge">
                    {getFeatureTypeText(feat.type)}
                  </span>
                </div>
                {feat.description && (
                  <p className="floating-search-item-desc">{feat.description}</p>
                )}
              </div>
            ))
          ) : (
            <div className="floating-search-empty">No se encontraron elementos</div>
          )}
        </div>
      )}
    </div>
  );
};

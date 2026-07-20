import React from "react";
import { ColorPicker, Color } from "./ColorPicker";

export const DRAW_TOOLS = [
  { id: "point",     label: "Punto",     icon: "📍" },
  { id: "polyline",  label: "Linea",     icon: "📏" },
  { id: "polygon",   label: "Poligono",  icon: "⬡"  },
  { id: "rectangle", label: "Rect.",     icon: "▭"  },
  { id: "circle",    label: "Circulo",   icon: "○"  },
] as const;

export type ToolId = typeof DRAW_TOOLS[number]["id"];

interface DrawingToolbarProps {
  activeTool: ToolId | null;
  editMode: "transform" | "reshape";
  onSelectTool: (toolId: ToolId) => void;
  onCancel: () => void;
  onDelete: () => void;
  onToggleEditMode: (mode: "transform" | "reshape") => void;
  hasSelection: boolean;
  activeColor: Color;
  onColorChange: (color: Color) => void;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  editMode,
  onSelectTool,
  onCancel,
  onDelete,
  onToggleEditMode,
  hasSelection,
  activeColor,
  onColorChange,
}) => (
  <div className="draw-toolbar">
    {/* Draw tools */}
    {DRAW_TOOLS.map((tool) => (
      <button
        key={tool.id}
        className={"draw-tool-btn" + (activeTool === tool.id ? " active" : "")}
        title={tool.label}
        onClick={() => onSelectTool(tool.id)}
      >
        <span className="draw-tool-icon">{tool.icon}</span>
        <span className="draw-tool-label">{tool.label}</span>
      </button>
    ))}

    <div className="draw-toolbar-divider" />

    {/* Color picker */}
    <ColorPicker activeColor={activeColor} onColorChange={onColorChange} />

    <div className="draw-toolbar-divider" />

    {/* Edit mode toggle — only when something is selected or no active draw tool */}
    {hasSelection && !activeTool && (
      <>
        <button
          className={"draw-tool-btn" + (editMode === "transform" ? " active" : "")}
          title="Mover / Escalar"
          onClick={() => onToggleEditMode("transform")}
        >
          <span className="draw-tool-icon">✥</span>
          <span className="draw-tool-label">Mover</span>
        </button>
        <button
          className={"draw-tool-btn" + (editMode === "reshape" ? " active" : "")}
          title="Editar vertices"
          onClick={() => onToggleEditMode("reshape")}
        >
          <span className="draw-tool-icon">⟡</span>
          <span className="draw-tool-label">Vertices</span>
        </button>
        <button className="draw-tool-btn danger" title="Eliminar seleccionado" onClick={onDelete}>
          <span className="draw-tool-icon">🗑</span>
          <span className="draw-tool-label">Eliminar</span>
        </button>
      </>
    )}

    {activeTool && (
      <button className="draw-tool-btn cancel" title="Cancelar" onClick={onCancel}>
        <span className="draw-tool-icon">✕</span>
        <span className="draw-tool-label">Cancelar</span>
      </button>
    )}
  </div>
);

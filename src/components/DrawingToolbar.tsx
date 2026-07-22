import React from "react";
import { ColorPicker, Color } from "./ColorPicker";
import { MapPin, Ruler, Hexagon, Square, Circle, Move, Pencil, Trash2, X } from "lucide-react";

export const DRAW_TOOLS = [
  { id: "point",     label: "Punto",     icon: <MapPin size={14} /> },
  { id: "polyline",  label: "Linea",     icon: <Ruler size={14} /> },
  { id: "polygon",   label: "Poligono",  icon: <Hexagon size={14} /> },
  { id: "rectangle", label: "Rect.",     icon: <Square size={14} /> },
  { id: "circle",    label: "Circulo",   icon: <Circle size={14} /> },
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
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
  popoverDirection?: "top" | "bottom";
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
  dragHandleProps,
  popoverDirection = "top",
}) => (
  <div className="draw-toolbar">
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

    <ColorPicker activeColor={activeColor} onColorChange={onColorChange} direction={popoverDirection} />

    <div className="draw-toolbar-divider" />

    {hasSelection && !activeTool && (
      <>
        <button
          className={"draw-tool-btn" + (editMode === "transform" ? " active" : "")}
          title="Mover / Escalar"
          onClick={() => onToggleEditMode("transform")}
        >
          <span className="draw-tool-icon"><Move size={14} /></span>
          <span className="draw-tool-label">Mover</span>
        </button>
        <button
          className={"draw-tool-btn" + (editMode === "reshape" ? " active" : "")}
          title="Editar vertices"
          onClick={() => onToggleEditMode("reshape")}
        >
          <span className="draw-tool-icon"><Pencil size={14} /></span>
          <span className="draw-tool-label">Vertices</span>
        </button>
        <button className="draw-tool-btn danger" title="Eliminar seleccionado" onClick={onDelete}>
          <span className="draw-tool-icon"><Trash2 size={14} /></span>
          <span className="draw-tool-label">Eliminar</span>
        </button>
      </>
    )}

    {activeTool && (
      <button className="draw-tool-btn cancel" title="Cancelar" onClick={onCancel}>
        <span className="draw-tool-icon"><X size={14} /></span>
        <span className="draw-tool-label">Cancelar</span>
      </button>
    )}

    {dragHandleProps && (
      <span className="drag-handle" title="Arrastrar toolbar" {...dragHandleProps}>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
          <circle cx="2" cy="2" r="1.2" />
          <circle cx="6" cy="2" r="1.2" />
          <circle cx="2" cy="7" r="1.2" />
          <circle cx="6" cy="7" r="1.2" />
          <circle cx="2" cy="12" r="1.2" />
          <circle cx="6" cy="12" r="1.2" />
        </svg>
      </span>
    )}
  </div>
);

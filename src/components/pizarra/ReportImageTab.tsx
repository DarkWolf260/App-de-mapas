import React, { useEffect, useRef, useState } from "react";
import {
  Download,
  Calendar,
  Clock,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Sliders,
  Type,
  Maximize2,
  Square,
  Circle,
  Minus,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Image as ImageIcon,
  Move,
  ZoomIn,
  ZoomOut,
  Sparkles,
  RotateCcw,
  Lock,
  Unlock,
  Copy,
} from "lucide-react";
import type { DrawnFeature, DepartmentView } from "../../types";
import {
  renderReportToCanvas,
  generateAndDownloadReportImage,
  renderFullSlideToCanvas,
  renderFullSlideToCanvasAsync,
  generateAndDownloadFullSlideImage,
  type SlideCustomImage,
  type SlideShape,
} from "../../utils/reportImageExporter";

interface ReportImageTabProps {
  features: DrawnFeature[];
  selectedDate: string;
}

const LOCAL_STORAGE_KEY_IMAGES = "pc_slide_custom_images_v5";
const LOCAL_STORAGE_KEY_SHAPES = "pc_slide_custom_shapes_v5";

export const ReportImageTab: React.FC<ReportImageTabProps> = ({
  features,
  selectedDate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"flag" | "images" | "shapes" | "texts">("flag");

  // Mode: Full 16:9 Presentation Slide vs Table Only
  const [renderMode, setRenderMode] = useState<"slide" | "table">("slide");

  // Zoom Level (1.0 = Fit, 1.25 = 125%, 0.85 = 85%)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // Date & Time
  const [startDate, setStartDate] = useState<string>(selectedDate || new Date().toLocaleDateString("en-CA"));
  const [endDate, setEndDate] = useState<string>(selectedDate || new Date().toLocaleDateString("en-CA"));
  const [startTime, setStartTime] = useState<string>("00:00");
  const [endTime, setEndTime] = useState<string>("23:59");

  // Texts
  const [customTitle, setCustomTitle] = useState<string>("PROTECCIÓN CIVIL");
  const [headerTitle, setHeaderTitle] = useState<string>(
    "DIRECCIÓN NACIONAL DE PROTECCIÓN CIVIL\nY ADMINISTRACIÓN DE DESASTRES"
  );
  const [subTitle, setSubTitle] = useState<string>(
    "REPORTE DIARIO DE RESCATES DE PERSONAS, CUERPOS RECUPERADOS Y MASCOTAS RESCATADAS"
  );

  // Header Title calibration state
  const [headerConfig, setHeaderConfig] = useState<{ x: number; y: number; fontSize: number; fontWeight: string }>(() => {
    try {
      const saved = localStorage.getItem("report_header_text_config");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: 960, y: 58, fontSize: 42, fontWeight: "bold" };
  });

  // Subtitle Banner calibration state
  const [subtitleConfig, setSubtitleConfig] = useState<{ x: number; y: number; fontSize: number; fontWeight: string }>(() => {
    try {
      const saved = localStorage.getItem("report_subtitle_text_config");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: 959, y: 249, fontSize: 32, fontWeight: "bold" };
  });

  // La Guaira text calibration state
  const [laguairaConfig, setLaguairaConfig] = useState<{ x: number; y: number; fontSize: number; fontWeight: string }>(() => {
    try {
      const saved = localStorage.getItem("report_laguaira_text_config");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: 537, y: 923, fontSize: 23, fontWeight: "bold" };
  });

  useEffect(() => {
    try {
      localStorage.setItem("report_header_text_config", JSON.stringify(headerConfig));
    } catch {}
  }, [headerConfig]);

  useEffect(() => {
    try {
      localStorage.setItem("report_subtitle_text_config", JSON.stringify(subtitleConfig));
    } catch {}
  }, [subtitleConfig]);

  useEffect(() => {
    try {
      localStorage.setItem("report_laguaira_text_config", JSON.stringify(laguairaConfig));
    } catch {}
  }, [laguairaConfig]);

  // Flag logo calibration state
  const [flagConfig, setFlagConfig] = useState<{ x: number; y: number; width: number; height: number }>(() => {
    try {
      const saved = localStorage.getItem("report_flag_logo_config");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: -63, y: -67, width: 356, height: 318 };
  });

  // Cuadrantes de Paz logo calibration state
  const [pazConfig, setPazConfig] = useState<{ x: number; y: number; width: number; height: number }>(() => {
    try {
      const saved = localStorage.getItem("report_paz_logo_config");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: 219, y: -24, width: 269, height: 221 };
  });

  useEffect(() => {
    try {
      localStorage.setItem("report_flag_logo_config", JSON.stringify(flagConfig));
    } catch {}
  }, [flagConfig]);

  useEffect(() => {
    try {
      localStorage.setItem("report_paz_logo_config", JSON.stringify(pazConfig));
    } catch {}
  }, [pazConfig]);

  // Clean up any stale localStorage items on mount
  useEffect(() => {
    try {
      localStorage.removeItem("report_table_custom_config_v2");
      localStorage.removeItem("report_table_custom_config");
      localStorage.removeItem("pc_slide_custom_images_v5");
      localStorage.removeItem("pc_slide_custom_shapes_v5");
    } catch {}
  }, []);

  // Operational Matrix Table adjustment state (starts clean each session/day)
  const [tableConfig, setTableConfig] = useState<{ offsetX: number; offsetY: number; scaleX: number; scaleY: number }>({
    offsetX: 0,
    offsetY: 0,
    scaleX: 1.0,
    scaleY: 1.0,
  });
  const [renderedTableBounds, setRenderedTableBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Department
  const [activeDept, setActiveDept] = useState<DepartmentView>("pc");
  const [isRendering, setIsRendering] = useState(false);

  // Additional custom images uploaded by user (starts fresh each session/day)
  const [customImages, setCustomImages] = useState<SlideCustomImage[]>([]);

  // Custom Shapes (starts fresh each session/day)
  const [customShapes, setCustomShapes] = useState<SlideShape[]>([]);

  // Selection
  const [selectedElement, setSelectedElement] = useState<{ type: "image" | "shape"; id: string } | null>(null);

  // Drag & Resize State
  const [draggingItem, setDraggingItem] = useState<{
    type: "image" | "shape" | "table";
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const [resizingItem, setResizingItem] = useState<{
    type: "image" | "shape" | "table";
    id: string;
    handle: "nw" | "ne" | "se" | "sw" | "n" | "s" | "e" | "w";
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
    initialX: number;
    initialY: number;
    initialScaleX?: number;
    initialScaleY?: number;
  } | null>(null);

  // Synchronize date and reset positions on date change
  useEffect(() => {
    if (selectedDate) {
      setStartDate(selectedDate);
      setEndDate(selectedDate);
    }
    // Always reset table adjustments, shapes, images and selection when date changes
    setTableConfig({ offsetX: 0, offsetY: 0, scaleX: 1.0, scaleY: 1.0 });
    setCustomShapes([]);
    setCustomImages([]);
    setSelectedElement(null);
  }, [selectedDate]);

  // Render canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    setIsRendering(true);

    const timer = setTimeout(async () => {
      if (canvasRef.current) {
        if (renderMode === "slide") {
          const stats = await renderFullSlideToCanvasAsync(canvasRef.current, {
            features,
            startDate,
            endDate,
            startTime,
            endTime,
            activeDepartment: activeDept,
            customDepartmentTitle: customTitle,
            headerTitle,
            subTitle,
            customImages: [], // Handled in DOM overlay for zero latency
            customShapes: [],
            flagLogoConfig: flagConfig,
            pazLogoConfig: pazConfig,
            headerConfig,
            subtitleConfig,
            laguairaConfig,
            tableScaleX: tableConfig.scaleX,
            tableScaleY: tableConfig.scaleY,
            tableOffsetX: tableConfig.offsetX,
            tableOffsetY: tableConfig.offsetY,
          });
          if (stats?.tableBounds) {
            setRenderedTableBounds(stats.tableBounds);
          }
        } else {
          renderReportToCanvas(canvasRef.current, {
            features,
            startDate,
            endDate,
            startTime,
            endTime,
            activeDepartment: activeDept,
            customDepartmentTitle: customTitle,
          });
        }
      }
      setIsRendering(false);
    }, 10);

    return () => clearTimeout(timer);
  }, [
    features,
    startDate,
    endDate,
    startTime,
    endTime,
    activeDept,
    customTitle,
    renderMode,
    headerTitle,
    subTitle,
    flagConfig,
    pazConfig,
    headerConfig,
    subtitleConfig,
    laguairaConfig,
    tableConfig,
  ]);

  const handleDownload = async () => {
    if (renderMode === "slide") {
      await generateAndDownloadFullSlideImage({
        features,
        startDate,
        endDate,
        startTime,
        endTime,
        activeDepartment: activeDept,
        customDepartmentTitle: customTitle,
        headerTitle,
        subTitle,
        customImages,
        customShapes,
        flagLogoConfig: flagConfig,
        pazLogoConfig: pazConfig,
        headerConfig,
        subtitleConfig,
        laguairaConfig,
        tableScaleX: tableConfig.scaleX,
        tableScaleY: tableConfig.scaleY,
        tableOffsetX: tableConfig.offsetX,
        tableOffsetY: tableConfig.offsetY,
      });
    } else {
      generateAndDownloadReportImage({
        features,
        startDate,
        endDate,
        startTime,
        endTime,
        activeDepartment: activeDept,
        customDepartmentTitle: customTitle,
      });
    }
  };

  // Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const aspect = img.naturalWidth / (img.naturalHeight || 1);
        const defaultWidth = 200;
        const defaultHeight = Math.round(defaultWidth / aspect);

        const newImage: SlideCustomImage = {
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^/.]+$/, ""),
          dataUrl,
          x: 200,
          y: 200,
          width: defaultWidth,
          height: defaultHeight,
          visible: true,
          locked: false,
        };

        setCustomImages((prev) => [...prev, newImage]);
        setSelectedElement({ type: "image", id: newImage.id });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Shape Creation
  const handleAddShape = (type: "rect" | "circle" | "bar" | "text") => {
    const newId = crypto.randomUUID();
    let newShape: SlideShape;

    if (type === "circle") {
      newShape = {
        id: newId,
        type: "circle",
        name: `Círculo ${customShapes.length + 1}`,
        x: 860,
        y: 450,
        width: 160,
        height: 160,
        fillColor: "#ea580c",
        borderColor: "#ffffff",
        borderWidth: 2,
        opacity: 0.9,
        visible: true,
        locked: false,
      };
    } else if (type === "bar") {
      newShape = {
        id: newId,
        type: "bar",
        name: `Barra ${customShapes.length + 1}`,
        x: 460,
        y: 200,
        width: 1000,
        height: 10,
        fillColor: "#2563eb",
        borderRadius: 5,
        opacity: 1,
        visible: true,
        locked: false,
      };
    } else if (type === "text") {
      newShape = {
        id: newId,
        type: "text",
        name: `Texto ${customShapes.length + 1}`,
        x: 760,
        y: 480,
        width: 400,
        height: 60,
        fillColor: "transparent",
        text: "INFORMACIÓN OPERATIVA",
        textColor: "#1e3a8a",
        fontSize: 24,
        fontWeight: "bold",
        visible: true,
        locked: false,
      };
    } else {
      // Rect
      newShape = {
        id: newId,
        type: "rect",
        name: `Rectángulo ${customShapes.length + 1}`,
        x: 800,
        y: 400,
        width: 280,
        height: 160,
        fillColor: "rgba(37, 99, 235, 0.15)",
        borderColor: "#2563eb",
        borderWidth: 2,
        borderRadius: 8,
        opacity: 1,
        visible: true,
        locked: false,
      };
    }

    setCustomShapes((prev) => [...prev, newShape]);
    setSelectedElement({ type: "shape", id: newId });
  };

  // Drag & Move
  const handlePointerDownElement = (
    e: React.PointerEvent,
    type: "image" | "shape",
    id: string,
    curX: number,
    curY: number,
    isLocked?: boolean
  ) => {
    e.stopPropagation();
    setSelectedElement({ type, id });

    if (isLocked) return;

    setDraggingItem({
      type,
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: curX,
      initialY: curY,
    });

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerDownHandle = (
    e: React.PointerEvent,
    type: "image" | "shape",
    id: string,
    handle: "nw" | "ne" | "se" | "sw" | "n" | "s" | "e" | "w",
    curX: number,
    curY: number,
    curW: number,
    curH: number,
    isLocked?: boolean
  ) => {
    e.stopPropagation();
    if (isLocked) return;

    setResizingItem({
      type,
      id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: curW,
      initialHeight: curH,
      initialX: curX,
      initialY: curY,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const container = slideContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const scaleFactorX = 1920 / rect.width;
    const scaleFactorY = 1080 / rect.height;

    if (draggingItem) {
      const deltaX = (e.clientX - draggingItem.startX) * scaleFactorX;
      const deltaY = (e.clientY - draggingItem.startY) * scaleFactorY;

      const newX = Math.round(draggingItem.initialX + deltaX);
      const newY = Math.round(draggingItem.initialY + deltaY);

      if (draggingItem.type === "image") {
        setCustomImages((prev) =>
          prev.map((img) => (img.id === draggingItem.id ? { ...img, x: newX, y: newY } : img))
        );
      } else if (draggingItem.type === "shape") {
        setCustomShapes((prev) =>
          prev.map((shp) => (shp.id === draggingItem.id ? { ...shp, x: newX, y: newY } : shp))
        );
      } else if (draggingItem.type === "table") {
        setTableConfig((prev) => ({
          ...prev,
          offsetX: Math.round(draggingItem.initialX + deltaX),
          offsetY: Math.round(draggingItem.initialY + deltaY),
        }));
      }
    } else if (resizingItem) {
      const deltaX = (e.clientX - resizingItem.startX) * scaleFactorX;
      const deltaY = (e.clientY - resizingItem.startY) * scaleFactorY;

      let newWidth = resizingItem.initialWidth;
      let newHeight = resizingItem.initialHeight;
      let newX = resizingItem.initialX;
      let newY = resizingItem.initialY;

      if (resizingItem.handle === "se") {
        newWidth = Math.max(15, Math.round(resizingItem.initialWidth + deltaX));
        newHeight = Math.max(15, Math.round(resizingItem.initialHeight + deltaY));
      } else if (resizingItem.handle === "sw") {
        newWidth = Math.max(15, Math.round(resizingItem.initialWidth - deltaX));
        newHeight = Math.max(15, Math.round(resizingItem.initialHeight + deltaY));
        newX = Math.round(resizingItem.initialX + deltaX);
      } else if (resizingItem.handle === "ne") {
        newWidth = Math.max(15, Math.round(resizingItem.initialWidth + deltaX));
        newHeight = Math.max(15, Math.round(resizingItem.initialHeight - deltaY));
        newY = Math.round(resizingItem.initialY + deltaY);
      } else if (resizingItem.handle === "nw") {
        newWidth = Math.max(15, Math.round(resizingItem.initialWidth - deltaX));
        newHeight = Math.max(15, Math.round(resizingItem.initialHeight - deltaY));
        newX = Math.round(resizingItem.initialX + deltaX);
        newY = Math.round(resizingItem.initialY + deltaY);
      } else if (resizingItem.handle === "e") {
        newWidth = Math.max(15, Math.round(resizingItem.initialWidth + deltaX));
      } else if (resizingItem.handle === "s") {
        newHeight = Math.max(15, Math.round(resizingItem.initialHeight + deltaY));
      } else if (resizingItem.handle === "w") {
        newWidth = Math.max(15, Math.round(resizingItem.initialWidth - deltaX));
        newX = Math.round(resizingItem.initialX + deltaX);
      } else if (resizingItem.handle === "n") {
        newHeight = Math.max(15, Math.round(resizingItem.initialHeight - deltaY));
        newY = Math.round(resizingItem.initialY + deltaY);
      }

      if (resizingItem.type === "image") {
        setCustomImages((prev) =>
          prev.map((img) =>
            img.id === resizingItem.id
              ? { ...img, x: newX, y: newY, width: newWidth, height: newHeight }
              : img
          )
        );
      } else if (resizingItem.type === "shape") {
        setCustomShapes((prev) =>
          prev.map((shp) =>
            shp.id === resizingItem.id
              ? { ...shp, x: newX, y: newY, width: newWidth, height: newHeight }
              : shp
          )
        );
      } else if (resizingItem.type === "table") {
        const initW = resizingItem.initialWidth || 1450;
        const initH = resizingItem.initialHeight || 480;
        const initScaleX = resizingItem.initialScaleX ?? 1.0;
        const initScaleY = resizingItem.initialScaleY ?? 1.0;
        const initOffsetX = resizingItem.initialX;
        const initOffsetY = resizingItem.initialY;

        let newScaleX = initScaleX;
        let newScaleY = initScaleY;
        let newOffsetX = initOffsetX;
        let newOffsetY = initOffsetY;

        // Ancho
        if (resizingItem.handle.includes("e")) {
          const deltaScaleX = deltaX / (initW / initScaleX);
          newScaleX = Math.max(0.25, Math.min(2.5, +(initScaleX + deltaScaleX).toFixed(3)));
          newOffsetX = Math.round(initOffsetX + deltaX / 2);
        } else if (resizingItem.handle.includes("w")) {
          const deltaScaleX = -deltaX / (initW / initScaleX);
          newScaleX = Math.max(0.25, Math.min(2.5, +(initScaleX + deltaScaleX).toFixed(3)));
          newOffsetX = Math.round(initOffsetX + deltaX / 2);
        }

        // Alto
        if (resizingItem.handle.includes("s")) {
          const deltaScaleY = deltaY / (initH / initScaleY);
          newScaleY = Math.max(0.25, Math.min(2.5, +(initScaleY + deltaScaleY).toFixed(3)));
          newOffsetY = Math.round(initOffsetY + deltaY / 2);
        } else if (resizingItem.handle.includes("n")) {
          const deltaScaleY = -deltaY / (initH / initScaleY);
          newScaleY = Math.max(0.25, Math.min(2.5, +(initScaleY + deltaScaleY).toFixed(3)));
          newOffsetY = Math.round(initOffsetY + deltaY / 2);
        }

        setTableConfig({
          scaleX: newScaleX,
          scaleY: newScaleY,
          offsetX: newOffsetX,
          offsetY: newOffsetY,
        });
      }
    }
  };

  const handlePointerUp = () => {
    if (draggingItem) setDraggingItem(null);
    if (resizingItem) setResizingItem(null);
  };

  const selectedImage =
    selectedElement?.type === "image"
      ? customImages.find((img) => img.id === selectedElement.id)
      : null;

  const selectedShape =
    selectedElement?.type === "shape"
      ? customShapes.find((shp) => shp.id === selectedElement.id)
      : null;

  const COLOR_PALETTE = [
    "#ea580c",
    "#0a2158",
    "#2563eb",
    "#22c55e",
    "#ef4444",
    "#eab308",
    "#a855f7",
    "#ffffff",
    "#000000",
    "transparent",
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
        background: "#0f172a",
      }}
    >
      {/* ── BARRA SUPERIOR DE HERRAMIENTAS ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "8px 16px",
          background: "rgba(15, 23, 42, 0.98)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(12px)",
          flexWrap: "wrap",
          zIndex: 30,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* BOTÓN TOGGLE SIDEBAR */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              background: isSidebarOpen ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.08)",
              border: `1px solid ${isSidebarOpen ? "rgba(56, 189, 248, 0.3)" : "rgba(255, 255, 255, 0.12)"}`,
              borderRadius: "6px",
              color: isSidebarOpen ? "#38bdf8" : "#f8fafc",
              padding: "5px 10px",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            title={isSidebarOpen ? "Ocultar panel lateral" : "Mostrar panel lateral"}
          >
            {isSidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
            <span>{isSidebarOpen ? "Ocultar Panel" : "Panel de Diseño"}</span>
          </button>

          {/* SELECTOR DE MODO */}
          <div style={{ display: "flex", background: "rgba(0,0,0,0.5)", borderRadius: "8px", padding: "2px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <button
              type="button"
              onClick={() => setRenderMode("slide")}
              style={{
                background: renderMode === "slide" ? "#2563eb" : "transparent",
                color: renderMode === "slide" ? "#fff" : "var(--text-muted)",
                border: "none",
                borderRadius: "6px",
                padding: "5px 12px",
                fontSize: "0.74rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Maximize2 size={13} />
              <span>Diapositiva (16:9)</span>
            </button>
            <button
              type="button"
              onClick={() => setRenderMode("table")}
              style={{
                background: renderMode === "table" ? "#ea580c" : "transparent",
                color: renderMode === "table" ? "#fff" : "var(--text-muted)",
                border: "none",
                borderRadius: "6px",
                padding: "5px 12px",
                fontSize: "0.74rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Layers size={13} />
              <span>Solo Tabla</span>
            </button>
          </div>

          {/* FECHA Y HORAS */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--accent-orange)", display: "flex", alignItems: "center", gap: "3px" }}>
              <Calendar size={12} /> Fecha:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                const newDate = e.target.value;
                setStartDate(newDate);
                setEndDate(newDate);
                setTableConfig({ offsetX: 0, offsetY: 0, scaleX: 1.0, scaleY: 1.0 });
                setCustomShapes([]);
                setCustomImages([]);
                setSelectedElement(null);
              }}
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "6px",
                color: "#f8fafc",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "3px 6px",
                outline: "none",
              }}
            />
            <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "2px" }}>
              <Clock size={11} />
            </span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "6px",
                color: "#f8fafc",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "3px 4px",
                outline: "none",
              }}
            />
            <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>-</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "6px",
                color: "#f8fafc",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "3px 4px",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* BOTÓN DESCARGAR */}
        <button
          onClick={handleDownload}
          style={{
            height: "34px",
            background: renderMode === "slide" ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "linear-gradient(135deg, #ea580c, #c2410c)",
            border: `1px solid ${renderMode === "slide" ? "rgba(59, 130, 246, 0.5)" : "rgba(249, 115, 22, 0.5)"}`,
            borderRadius: "8px",
            color: "#fff",
            fontSize: "0.76rem",
            fontWeight: 800,
            padding: "0 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
          }}
        >
          <Download size={15} />
          <span>{renderMode === "slide" ? "Descargar Diapositiva (16:9 PNG)" : "Descargar Solo Tabla"}</span>
        </button>
      </div>

      {/* ── CUERPO PRINCIPAL (SIDEBAR + ESCENARIO DE HOJA POWERPOINT) ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {/* SIDEBAR LATERAL IZQUIERDO */}
        {isSidebarOpen && (
          <div
            style={{
              width: "310px",
              minWidth: "290px",
              maxWidth: "330px",
              background: "rgba(15, 23, 42, 0.98)",
              borderRight: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              boxSizing: "border-box",
              zIndex: 20,
              transition: "all 0.2s ease",
            }}
          >
            {/* PESTAÑAS DE CONTROL DEL SIDEBAR */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)" }}>
              <button
                type="button"
                onClick={() => setSidebarTab("images")}
                style={{
                  flex: 1,
                  padding: "9px 4px",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  border: "none",
                  borderBottom: sidebarTab === "images" ? "2px solid #38bdf8" : "2px solid transparent",
                  background: sidebarTab === "images" ? "rgba(56, 189, 248, 0.1)" : "transparent",
                  color: sidebarTab === "images" ? "#38bdf8" : "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <ImageIcon size={12} />
                <span>Imágenes ({customImages.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab("shapes")}
                style={{
                  flex: 1,
                  padding: "9px 4px",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  border: "none",
                  borderBottom: sidebarTab === "shapes" ? "2px solid #ea580c" : "2px solid transparent",
                  background: sidebarTab === "shapes" ? "rgba(234, 88, 12, 0.1)" : "transparent",
                  color: sidebarTab === "shapes" ? "#ea580c" : "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <Square size={12} />
                <span>Formas ({customShapes.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab("texts")}
                style={{
                  flex: 1,
                  padding: "9px 4px",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  border: "none",
                  borderBottom: sidebarTab === "texts" ? "2px solid #a855f7" : "2px solid transparent",
                  background: sidebarTab === "texts" ? "rgba(168, 85, 247, 0.1)" : "transparent",
                  color: sidebarTab === "texts" ? "#a855f7" : "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <Type size={12} />
                <span>Textos</span>
              </button>
            </div>

            <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* TAB 1: IMÁGENES ADICIONALES */}
              {sidebarTab === "images" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#38bdf8" }}>Imágenes y Fotos</span>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png, image/jpeg, image/svg+xml, image/webp"
                      style={{ display: "none" }}
                      onChange={handleImageUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: "rgba(56, 189, 248, 0.15)",
                        border: "1px solid rgba(56, 189, 248, 0.35)",
                        borderRadius: "6px",
                        color: "#38bdf8",
                        padding: "4px 8px",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Plus size={12} />
                      <span>Subir Imagen</span>
                    </button>
                  </div>

                  <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: "8px", fontStyle: "italic" }}>
                    🔒 Los logos oficiales del Ministerio y Protección Civil ya están 100% fijos en la plantilla de fondo.
                  </div>

                  {/* LISTA DE IMÁGENES */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {customImages.length === 0 ? (
                      <div style={{ padding: "12px", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "8px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.66rem" }}>
                        No has añadido imágenes adicionales. Si deseas colocar fotos de terreno o sellos extras, haz clic en <strong>+ Subir Imagen</strong>.
                      </div>
                    ) : (
                      customImages.map((img) => {
                        const isSelected = selectedElement?.type === "image" && selectedElement.id === img.id;
                        return (
                          <div
                            key={img.id}
                            onClick={() => setSelectedElement({ type: "image", id: img.id })}
                            style={{
                              background: isSelected ? "rgba(37, 99, 235, 0.25)" : "rgba(0,0,0,0.3)",
                              border: `1px solid ${isSelected ? "#3b82f6" : "rgba(255,255,255,0.08)"}`,
                              borderRadius: "6px",
                              padding: "6px 8px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <img
                              src={img.dataUrl}
                              alt={img.name}
                              style={{ width: "24px", height: "24px", objectFit: "contain", borderRadius: "3px", background: "rgba(255,255,255,0.05)" }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {img.name}
                              </div>
                              <div style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>
                                X:{img.x} Y:{img.y} {img.locked ? "🔒 Fijo" : "🔓 Libre"}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCustomImages((prev) =>
                                  prev.map((i) => (i.id === img.id ? { ...i, locked: !i.locked } : i))
                                );
                              }}
                              style={{ background: "none", border: "none", color: img.locked ? "#eab308" : "var(--text-muted)", cursor: "pointer", padding: "2px" }}
                              title={img.locked ? "Desbloquear posición" : "Fijar y bloquear posición"}
                            >
                              {img.locked ? <Lock size={12} /> : <Unlock size={12} />}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCustomImages((prev) =>
                                  prev.map((i) => (i.id === img.id ? { ...i, visible: i.visible === false } : i))
                                );
                              }}
                              style={{ background: "none", border: "none", color: img.visible === false ? "var(--text-muted)" : "var(--color-green)", cursor: "pointer", padding: "2px" }}
                            >
                              {img.visible === false ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCustomImages((prev) => prev.filter((i) => i.id !== img.id));
                                if (selectedElement?.id === img.id) setSelectedElement(null);
                              }}
                              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "2px" }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* AJUSTES FINOS DE IMAGEN SELECCIONADA */}
                  {selectedImage && (
                    <div style={{ marginTop: "10px", background: "rgba(0,0,0,0.4)", borderRadius: "8px", padding: "10px", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
                      <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#38bdf8", marginBottom: "6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span>Ajustes: {selectedImage.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomImages((prev) =>
                              prev.map((i) => (i.id === selectedImage.id ? { ...i, locked: !i.locked } : i))
                            );
                          }}
                          style={{ background: selectedImage.locked ? "rgba(234, 179, 8, 0.2)" : "rgba(255,255,255,0.08)", border: "none", color: selectedImage.locked ? "#eab308" : "#fff", borderRadius: "4px", padding: "2px 6px", fontSize: "0.62rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}
                        >
                          {selectedImage.locked ? <Lock size={10} /> : <Unlock size={10} />}
                          <span>{selectedImage.locked ? "Bloqueado" : "Fijar"}</span>
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>
                        <div>
                          <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>Pos X:</span>
                          <input
                            type="number"
                            value={selectedImage.x}
                            onChange={(e) =>
                              setCustomImages((prev) =>
                                prev.map((i) => (i.id === selectedImage.id ? { ...i, x: parseInt(e.target.value, 10) || 0 } : i))
                              )
                            }
                            style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", color: "#fff", padding: "2px 4px", fontSize: "0.68rem" }}
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>Pos Y:</span>
                          <input
                            type="number"
                            value={selectedImage.y}
                            onChange={(e) =>
                              setCustomImages((prev) =>
                                prev.map((i) => (i.id === selectedImage.id ? { ...i, y: parseInt(e.target.value, 10) || 0 } : i))
                              )
                            }
                            style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", color: "#fff", padding: "2px 4px", fontSize: "0.68rem" }}
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>Ancho:</span>
                          <input
                            type="number"
                            value={selectedImage.width}
                            onChange={(e) =>
                              setCustomImages((prev) =>
                                prev.map((i) => (i.id === selectedImage.id ? { ...i, width: parseInt(e.target.value, 10) || 10 } : i))
                              )
                            }
                            style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", color: "#fff", padding: "2px 4px", fontSize: "0.68rem" }}
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>Alto:</span>
                          <input
                            type="number"
                            value={selectedImage.height}
                            onChange={(e) =>
                              setCustomImages((prev) =>
                                prev.map((i) => (i.id === selectedImage.id ? { ...i, height: parseInt(e.target.value, 10) || 10 } : i))
                              )
                            }
                            style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", color: "#fff", padding: "2px 4px", fontSize: "0.68rem" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: FORMAS VECTORIALES Y COLORES */}
              {sidebarTab === "shapes" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#ea580c" }}>Formas y Elementos</span>
                  </div>

                  {/* BOTONES PARA AÑADIR FORMAS */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "12px" }}>
                    <button
                      type="button"
                      onClick={() => handleAddShape("rect")}
                      style={{ background: "rgba(234, 88, 12, 0.15)", border: "1px solid rgba(234, 88, 12, 0.35)", borderRadius: "6px", color: "#ea580c", padding: "5px", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                    >
                      <Square size={12} />
                      <span>Rectángulo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddShape("circle")}
                      style={{ background: "rgba(234, 88, 12, 0.15)", border: "1px solid rgba(234, 88, 12, 0.35)", borderRadius: "6px", color: "#ea580c", padding: "5px", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                    >
                      <Circle size={12} />
                      <span>Círculo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddShape("bar")}
                      style={{ background: "rgba(234, 88, 12, 0.15)", border: "1px solid rgba(234, 88, 12, 0.35)", borderRadius: "6px", color: "#ea580c", padding: "5px", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                    >
                      <Minus size={12} />
                      <span>Barra Línea</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddShape("text")}
                      style={{ background: "rgba(234, 88, 12, 0.15)", border: "1px solid rgba(234, 88, 12, 0.35)", borderRadius: "6px", color: "#ea580c", padding: "5px", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                    >
                      <Type size={12} />
                      <span>Caja Texto</span>
                    </button>
                  </div>

                  {/* LISTA DE FORMAS CREADAS */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {customShapes.length === 0 ? (
                      <div style={{ padding: "12px", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "8px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.66rem" }}>
                        No hay formas creadas. Haz clic en una forma arriba para añadirla.
                      </div>
                    ) : (
                      customShapes.map((shp) => {
                        const isSelected = selectedElement?.type === "shape" && selectedElement.id === shp.id;
                        return (
                          <div
                            key={shp.id}
                            onClick={() => setSelectedElement({ type: "shape", id: shp.id })}
                            style={{
                              background: isSelected ? "rgba(234, 88, 12, 0.25)" : "rgba(0,0,0,0.3)",
                              border: `1px solid ${isSelected ? "#ea580c" : "rgba(255,255,255,0.08)"}`,
                              borderRadius: "6px",
                              padding: "6px 8px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div style={{ width: "16px", height: "16px", borderRadius: shp.type === "circle" ? "50%" : "3px", background: shp.fillColor === "transparent" ? "#fff" : shp.fillColor, border: "1px solid rgba(255,255,255,0.3)" }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {shp.name}
                              </div>
                              <div style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>
                                X:{shp.x} Y:{shp.y} {shp.locked ? "🔒 Fijo" : "🔓 Libre"}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCustomShapes((prev) =>
                                  prev.map((s) => (s.id === shp.id ? { ...s, locked: !s.locked } : s))
                                );
                              }}
                              style={{ background: "none", border: "none", color: shp.locked ? "#eab308" : "var(--text-muted)", cursor: "pointer", padding: "2px" }}
                              title={shp.locked ? "Desbloquear posición" : "Fijar y bloquear posición"}
                            >
                              {shp.locked ? <Lock size={12} /> : <Unlock size={12} />}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCustomShapes((prev) =>
                                  prev.map((s) => (s.id === shp.id ? { ...s, visible: s.visible === false } : s))
                                );
                              }}
                              style={{ background: "none", border: "none", color: shp.visible === false ? "var(--text-muted)" : "var(--color-green)", cursor: "pointer", padding: "2px" }}
                            >
                              {shp.visible === false ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCustomShapes((prev) => prev.filter((s) => s.id !== shp.id));
                                if (selectedElement?.id === shp.id) setSelectedElement(null);
                              }}
                              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "2px" }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* AJUSTES DE COLOR Y TAMAÑO DE LA FORMA SELECCIONADA */}
                  {selectedShape && (
                    <div style={{ marginTop: "10px", background: "rgba(0,0,0,0.4)", borderRadius: "8px", padding: "10px", border: "1px solid rgba(234, 88, 12, 0.3)" }}>
                      <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#ea580c", marginBottom: "6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span>Ajustes: {selectedShape.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomShapes((prev) =>
                              prev.map((s) => (s.id === selectedShape.id ? { ...s, locked: !s.locked } : s))
                            );
                          }}
                          style={{ background: selectedShape.locked ? "rgba(234, 179, 8, 0.2)" : "rgba(255,255,255,0.08)", border: "none", color: selectedShape.locked ? "#eab308" : "#fff", borderRadius: "4px", padding: "2px 6px", fontSize: "0.62rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}
                        >
                          {selectedShape.locked ? <Lock size={10} /> : <Unlock size={10} />}
                          <span>{selectedShape.locked ? "Bloqueado" : "Fijar"}</span>
                        </button>
                      </div>

                      {/* TEXT CONTENT (IF TEXT TYPE) */}
                      {selectedShape.type === "text" && (
                        <div style={{ marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>Texto:</span>
                          <input
                            type="text"
                            value={selectedShape.text || ""}
                            onChange={(e) =>
                              setCustomShapes((prev) =>
                                prev.map((s) => (s.id === selectedShape.id ? { ...s, text: e.target.value } : s))
                              )
                            }
                            style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", color: "#fff", padding: "3px 6px", fontSize: "0.68rem" }}
                          />
                        </div>
                      )}

                      {/* COLOR PALETTE */}
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                          Color de Relleno:
                        </span>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
                          {COLOR_PALETTE.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() =>
                                setCustomShapes((prev) =>
                                  prev.map((s) => (s.id === selectedShape.id ? { ...s, fillColor: c } : s))
                                )
                              }
                              style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "3px",
                                background: c === "transparent" ? "rgba(255,255,255,0.1)" : c,
                                border: selectedShape.fillColor === c ? "2px solid #38bdf8" : "1px solid rgba(255,255,255,0.2)",
                                cursor: "pointer",
                              }}
                              title={c}
                            />
                          ))}
                          <input
                            type="color"
                            value={selectedShape.fillColor === "transparent" ? "#ffffff" : selectedShape.fillColor}
                            onChange={(e) =>
                              setCustomShapes((prev) =>
                                prev.map((s) => (s.id === selectedShape.id ? { ...s, fillColor: e.target.value } : s))
                              )
                            }
                            style={{ width: "24px", height: "22px", border: "none", background: "none", cursor: "pointer", padding: 0 }}
                          />
                        </div>
                      </div>

                      {/* DIMENSIONS */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                        <div>
                          <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>Pos X:</span>
                          <input
                            type="number"
                            value={selectedShape.x}
                            onChange={(e) =>
                              setCustomShapes((prev) =>
                                prev.map((s) => (s.id === selectedShape.id ? { ...s, x: parseInt(e.target.value, 10) || 0 } : s))
                              )
                            }
                            style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", color: "#fff", padding: "2px 4px", fontSize: "0.68rem" }}
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>Pos Y:</span>
                          <input
                            type="number"
                            value={selectedShape.y}
                            onChange={(e) =>
                              setCustomShapes((prev) =>
                                prev.map((s) => (s.id === selectedShape.id ? { ...s, y: parseInt(e.target.value, 10) || 0 } : s))
                              )
                            }
                            style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", color: "#fff", padding: "2px 4px", fontSize: "0.68rem" }}
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>Ancho:</span>
                          <input
                            type="number"
                            value={selectedShape.width}
                            onChange={(e) =>
                              setCustomShapes((prev) =>
                                prev.map((s) => (s.id === selectedShape.id ? { ...s, width: parseInt(e.target.value, 10) || 10 } : s))
                              )
                            }
                            style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", color: "#fff", padding: "2px 4px", fontSize: "0.68rem" }}
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>Alto:</span>
                          <input
                            type="number"
                            value={selectedShape.height}
                            onChange={(e) =>
                              setCustomShapes((prev) =>
                                prev.map((s) => (s.id === selectedShape.id ? { ...s, height: parseInt(e.target.value, 10) || 10 } : s))
                              )
                            }
                            style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", color: "#fff", padding: "2px 4px", fontSize: "0.68rem" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TEXTOS INSTITUCIONALES */}
              {sidebarTab === "texts" && (
                <div>
                  <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#a855f7", display: "block", marginBottom: "8px" }}>
                    Textos del Encabezado
                  </span>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>
                        Encabezado Institucional (2 líneas):
                      </span>
                      <textarea
                        rows={2}
                        value={headerTitle}
                        onChange={(e) => setHeaderTitle(e.target.value)}
                        style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "0.68rem", resize: "vertical", fontFamily: "inherit" }}
                      />
                    </div>

                    <div>
                      <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>
                        Subtítulo del Reporte:
                      </span>
                      <textarea
                        rows={2}
                        value={subTitle}
                        onChange={(e) => setSubTitle(e.target.value)}
                        style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "0.68rem", resize: "vertical", fontFamily: "inherit" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ESCENARIO PRINCIPAL ESTILO POWERPOINT STAGE */}
        <div
          style={{
            flex: 1,
            height: "100%",
            background: "radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 24px",
            boxSizing: "border-box",
            overflow: "hidden",
            position: "relative",
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* HOJA DE DIAPOSITIVA POWERPOINT REAL (16:9) */}
          <div
            style={{
              flex: 1,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              ref={slideContainerRef}
              onClick={() => setSelectedElement(null)}
              style={{
                position: "relative",
                aspectRatio: renderMode === "slide" ? "16 / 9" : undefined,
                maxWidth: "100%",
                maxHeight: "100%",
                width: renderMode === "slide" ? `${Math.min(100, zoomLevel * 100)}%` : "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.15), 0 2px 8px rgba(0, 0, 0, 0.4)",
                borderRadius: "2px",
                overflow: "hidden",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
                transform: zoomLevel !== 1.0 ? `scale(${zoomLevel})` : undefined,
                transformOrigin: "center center",
                transition: "transform 0.15s ease",
              }}
            >
              {/* CANVAS BASE (TABLA + ENCABEZADO + FOOTER) */}
              <canvas
                ref={canvasRef}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  objectFit: "contain",
                }}
              />

              {/* RECUADRO INTERACTIVO EXCLUSIVO PARA AJUSTAR EL CUADRO / TABLA A SU GUSTO */}
              {renderMode === "slide" && (() => {
                const curWidth = renderedTableBounds?.width ?? Math.round(1460 * tableConfig.scaleX);
                const curHeight = renderedTableBounds?.height ?? Math.round(480 * tableConfig.scaleY);
                const curX = renderedTableBounds?.x ?? Math.round((1920 - curWidth) / 2 + tableConfig.offsetX);
                const curY = renderedTableBounds?.y ?? Math.round(285 + tableConfig.offsetY);

                const handles: Array<"nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"> = [
                  "nw", "n", "ne", "e", "se", "s", "sw", "w"
                ];

                return (
                  <div
                    style={{
                      position: "absolute",
                      left: `${(curX / 1920) * 100}%`,
                      top: `${(curY / 1080) * 100}%`,
                      width: `${(curWidth / 1920) * 100}%`,
                      height: `${(curHeight / 1080) * 100}%`,
                      border: "2px dashed #2563eb",
                      background: "rgba(37, 99, 235, 0.04)",
                      cursor: "move",
                      zIndex: 20,
                      boxSizing: "border-box",
                      borderRadius: "6px",
                      touchAction: "none",
                      boxShadow: "0 0 0 1px rgba(255,255,255,0.4), inset 0 0 0 1px rgba(255,255,255,0.2)",
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      try {
                        (e.target as HTMLElement).setPointerCapture(e.pointerId);
                      } catch {}
                      setDraggingItem({
                        type: "table",
                        id: "table",
                        startX: e.clientX,
                        startY: e.clientY,
                        initialX: tableConfig.offsetX,
                        initialY: tableConfig.offsetY,
                      });
                    }}
                  >
                    {/* BARRA FLOTANTE DE CONTROLES DEL CUADRO */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-36px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid #2563eb",
                        color: "#fff",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        whiteSpace: "nowrap",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
                        pointerEvents: "auto",
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <span style={{ color: "#93c5fd" }}>
                        📊 Cuadro: ↔ {Math.round(tableConfig.scaleX * 100)}% | ↕ {Math.round(tableConfig.scaleY * 100)}%
                      </span>

                      {/* Controles de Ancho */}
                      <span style={{ color: "#cbd5e1", marginLeft: "2px" }}>Ancho:</span>
                      <button
                        type="button"
                        onClick={() => setTableConfig((p) => ({ ...p, scaleX: Math.max(0.3, Number((p.scaleX - 0.05).toFixed(2))) }))}
                        title="Reducir ancho"
                        style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", borderRadius: "3px", padding: "2px 6px", fontSize: "0.62rem", cursor: "pointer" }}
                      >➖</button>
                      <button
                        type="button"
                        onClick={() => setTableConfig((p) => ({ ...p, scaleX: Math.min(2.5, Number((p.scaleX + 0.05).toFixed(2))) }))}
                        title="Aumentar ancho"
                        style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", borderRadius: "3px", padding: "2px 6px", fontSize: "0.62rem", cursor: "pointer" }}
                      >➕</button>

                      {/* Controles de Largo / Alto */}
                      <span style={{ color: "#cbd5e1", marginLeft: "2px" }}>Largo:</span>
                      <button
                        type="button"
                        onClick={() => setTableConfig((p) => ({ ...p, scaleY: Math.max(0.3, Number((p.scaleY - 0.05).toFixed(2))) }))}
                        title="Reducir largo"
                        style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", borderRadius: "3px", padding: "2px 6px", fontSize: "0.62rem", cursor: "pointer" }}
                      >➖</button>
                      <button
                        type="button"
                        onClick={() => setTableConfig((p) => ({ ...p, scaleY: Math.min(2.5, Number((p.scaleY + 0.05).toFixed(2))) }))}
                        title="Aumentar largo"
                        style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", borderRadius: "3px", padding: "2px 6px", fontSize: "0.62rem", cursor: "pointer" }}
                      >➕</button>

                      {/* Botón Restablecer */}
                      <button
                        type="button"
                        onClick={() => setTableConfig({ offsetX: 0, offsetY: 0, scaleX: 1.0, scaleY: 1.0 })}
                        title="Restablecer tamaño y centrado original"
                        style={{ background: "#2563eb", border: "none", color: "#fff", borderRadius: "3px", padding: "2px 7px", fontSize: "0.62rem", fontWeight: 800, cursor: "pointer", marginLeft: "4px" }}
                      >🔄 Restablecer</button>
                    </div>

                    {/* 8 MANIJAS CARDINALES PARA REDIMENSIONAR LIBREMENTE CON EL RATÓN */}
                    {handles.map((handle) => {
                      let cursor = "nwse-resize";
                      if (handle === "n" || handle === "s") cursor = "ns-resize";
                      else if (handle === "e" || handle === "w") cursor = "ew-resize";
                      else if (handle === "ne" || handle === "sw") cursor = "nesw-resize";

                      const topPos = handle.includes("n") ? "-7px" : handle.includes("s") ? undefined : "calc(50% - 7px)";
                      const bottomPos = handle.includes("s") ? "-7px" : undefined;
                      const leftPos = handle.includes("w") ? "-7px" : handle.includes("e") ? undefined : "calc(50% - 7px)";
                      const rightPos = handle.includes("e") ? "-7px" : undefined;

                      return (
                        <div
                          key={handle}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            try {
                              (e.target as HTMLElement).setPointerCapture(e.pointerId);
                            } catch {}
                            setResizingItem({
                              type: "table",
                              id: "table",
                              handle,
                              startX: e.clientX,
                              startY: e.clientY,
                              initialWidth: curWidth,
                              initialHeight: curHeight,
                              initialX: tableConfig.offsetX,
                              initialY: tableConfig.offsetY,
                              initialScaleX: tableConfig.scaleX,
                              initialScaleY: tableConfig.scaleY,
                            });
                          }}
                          style={{
                            position: "absolute",
                            width: "14px",
                            height: "14px",
                            background: "#2563eb",
                            border: "2px solid #ffffff",
                            borderRadius: "50%",
                            cursor,
                            top: topPos,
                            bottom: bottomPos,
                            left: leftPos,
                            right: rightPos,
                            zIndex: 30,
                            boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
                            boxSizing: "border-box",
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })()}

              {renderMode === "slide" &&
                customShapes
                  .filter((shp) => shp.visible !== false)
                  .map((shp) => {
                    const isSelected = selectedElement?.type === "shape" && selectedElement.id === shp.id;
                    const leftP = (shp.x / 1920) * 100;
                    const topP = (shp.y / 1080) * 100;
                    const widthP = (shp.width / 1920) * 100;
                    const heightP = (shp.height / 1080) * 100;

                    return (
                      <div
                        key={shp.id}
                        onPointerDown={(e) => handlePointerDownElement(e, "shape", shp.id, shp.x, shp.y, shp.locked)}
                        style={{
                          position: "absolute",
                          left: `${leftP}%`,
                          top: `${topP}%`,
                          width: `${widthP}%`,
                          height: `${heightP}%`,
                          cursor: shp.locked ? "default" : "move",
                          background: shp.fillColor === "transparent" ? "transparent" : shp.fillColor,
                          borderRadius: shp.type === "circle" ? "50%" : shp.borderRadius ? `${shp.borderRadius}px` : undefined,
                          border: shp.borderColor && (shp.borderWidth || 0) > 0 ? `${shp.borderWidth}px solid ${shp.borderColor}` : undefined,
                          opacity: shp.opacity ?? 1,
                          outline: isSelected ? "1.5px solid #ea580c" : "none",
                          boxSizing: "border-box",
                          zIndex: isSelected ? 18 : 6,
                          touchAction: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {shp.type === "text" && (
                          <span style={{ color: shp.textColor || "#1e3a8a", fontSize: `${(shp.fontSize || 20) * 0.75}px`, fontWeight: shp.fontWeight || "bold", textAlign: "center", userSelect: "none" }}>
                            {shp.text || shp.name}
                          </span>
                        )}

                        {/* HANDLES DE SELECCIÓN POWERPOINT (SI NO ESTÁ BLOQUEADO) */}
                        {isSelected && !shp.locked && (
                          <>
                            <div onPointerDown={(e) => handlePointerDownHandle(e, "shape", shp.id, "nw", shp.x, shp.y, shp.width, shp.height, shp.locked)} style={{ position: "absolute", left: "-4px", top: "-4px", width: "8px", height: "8px", background: "#ffffff", border: "1.5px solid #ea580c", borderRadius: "1px", cursor: "nwse-resize", zIndex: 25, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            <div onPointerDown={(e) => handlePointerDownHandle(e, "shape", shp.id, "n", shp.x, shp.y, shp.width, shp.height, shp.locked)} style={{ position: "absolute", left: "calc(50% - 4px)", top: "-4px", width: "8px", height: "8px", background: "#ffffff", border: "1.5px solid #ea580c", borderRadius: "1px", cursor: "ns-resize", zIndex: 25, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            <div onPointerDown={(e) => handlePointerDownHandle(e, "shape", shp.id, "ne", shp.x, shp.y, shp.width, shp.height, shp.locked)} style={{ position: "absolute", right: "-4px", top: "-4px", width: "8px", height: "8px", background: "#ffffff", border: "1.5px solid #ea580c", borderRadius: "1px", cursor: "nesw-resize", zIndex: 25, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            <div onPointerDown={(e) => handlePointerDownHandle(e, "shape", shp.id, "e", shp.x, shp.y, shp.width, shp.height, shp.locked)} style={{ position: "absolute", right: "-4px", top: "calc(50% - 4px)", width: "8px", height: "8px", background: "#ffffff", border: "1.5px solid #ea580c", borderRadius: "1px", cursor: "ew-resize", zIndex: 25, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            <div onPointerDown={(e) => handlePointerDownHandle(e, "shape", shp.id, "se", shp.x, shp.y, shp.width, shp.height, shp.locked)} style={{ position: "absolute", right: "-4px", bottom: "-4px", width: "8px", height: "8px", background: "#ffffff", border: "1.5px solid #ea580c", borderRadius: "1px", cursor: "nwse-resize", zIndex: 25, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            <div onPointerDown={(e) => handlePointerDownHandle(e, "shape", shp.id, "s", shp.x, shp.y, shp.width, shp.height, shp.locked)} style={{ position: "absolute", left: "calc(50% - 4px)", bottom: "-4px", width: "8px", height: "8px", background: "#ffffff", border: "1.5px solid #ea580c", borderRadius: "1px", cursor: "ns-resize", zIndex: 25, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            <div onPointerDown={(e) => handlePointerDownHandle(e, "shape", shp.id, "sw", shp.x, shp.y, shp.width, shp.height, shp.locked)} style={{ position: "absolute", left: "-4px", bottom: "-4px", width: "8px", height: "8px", background: "#ffffff", border: "1.5px solid #ea580c", borderRadius: "1px", cursor: "nesw-resize", zIndex: 25, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            <div onPointerDown={(e) => handlePointerDownHandle(e, "shape", shp.id, "w", shp.x, shp.y, shp.width, shp.height, shp.locked)} style={{ position: "absolute", left: "-4px", top: "calc(50% - 4px)", width: "8px", height: "8px", background: "#ffffff", border: "1.5px solid #ea580c", borderRadius: "1px", cursor: "ew-resize", zIndex: 25, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                          </>
                        )}
                      </div>
                    );
                  })}

              {/* CAPAS DE IMÁGENES Y FOTOS ADICIONALES */}
              {renderMode === "slide" &&
                customImages
                  .filter((img) => img.visible !== false)
                  .map((img) => {
                    const isSelected = selectedElement?.type === "image" && selectedElement.id === img.id;
                    const leftP = (img.x / 1920) * 100;
                    const topP = (img.y / 1080) * 100;
                    const widthP = (img.width / 1920) * 100;
                    const heightP = (img.height / 1080) * 100;

                    return (
                      <div
                        key={img.id}
                        onPointerDown={(e) => handlePointerDownElement(e, "image", img.id, img.x, img.y, img.locked)}
                        style={{
                          position: "absolute",
                          left: `${leftP}%`,
                          top: `${topP}%`,
                          width: `${widthP}%`,
                          height: `${heightP}%`,
                          cursor: img.locked ? "default" : "move",
                          outline: isSelected ? "1.5px solid #2563eb" : "none",
                          boxSizing: "border-box",
                          zIndex: isSelected ? 20 : 10,
                          touchAction: "none",
                        }}
                        title={img.locked ? `[${img.name}] (Posición bloqueada)` : `Arrastra para mover [${img.name}]`}
                      >
                        <img
                          src={img.dataUrl}
                          alt={img.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            pointerEvents: "none",
                          }}
                        />

                        {/* HANDLES DE SELECCIÓN POWERPOINT (SI NO ESTÁ BLOQUEADO) */}
                        {isSelected && !img.locked && (
                          <>
                            <div onPointerDown={(e) => handlePointerDownHandle(e, "image", img.id, "nw", img.x, img.y, img.width, img.height, img.locked)} style={{ position: "absolute", left: "-4px", top: "-4px", width: "8px", height: "8px", background: "#ffffff", border: "1.5px solid #2563eb", borderRadius: "1px", cursor: "nwse-resize", zIndex: 25, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            <div onPointerDown={(e) => handlePointerDownHandle(e, "image", img.id, "n", img.x, img.y, img.width, img.height, img.locked)} style={{ position: "absolute", left: "calc(50% - 4px)", top: "-4px", width: "8px", height: "8px", background: "#ffffff", border: "1.5px solid #2563eb", borderRadius: "1px", cursor: "ns-resize", zIndex: 25, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            <div onPointerDown={(e) => handlePointerDownHandle(e, "image", img.id, "ne", img.x, img.y, img.width, img.height, img.locked)} style={{ position: "absolute", right: "-4px", top: "-4px", width: "8px", height: "8px", background: "#ffffff", border: "1.5px solid #2563eb", borderRadius: "1px", cursor: "nesw-resize", zIndex: 25, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            <div onPointerDown={(e) => handlePointerDownHandle(e, "image", img.id, "e", img.x, img.y, img.width, img.height, img.locked)} style={{ position: "absolute", right: "-4px", top: "calc(50% - 4px)", width: "8px", height: "8px", background: "#ffffff", border: "1.5px solid #2563eb", borderRadius: "1px", cursor: "ew-resize", zIndex: 25, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            <div onPointerDown={(e) => handlePointerDownHandle(e, "image", img.id, "se", img.x, img.y, img.width, img.height, img.locked)} style={{ position: "absolute", right: "-4px", bottom: "-4px", width: "8px", height: "8px", background: "#ffffff", border: "1.5px solid #2563eb", borderRadius: "1px", cursor: "nwse-resize", zIndex: 25, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            <div onPointerDown={(e) => handlePointerDownHandle(e, "image", img.id, "s", img.x, img.y, img.width, img.height, img.locked)} style={{ position: "absolute", left: "calc(50% - 4px)", bottom: "-4px", width: "8px", height: "8px", background: "#ffffff", border: "1.5px solid #2563eb", borderRadius: "1px", cursor: "ns-resize", zIndex: 25, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            <div onPointerDown={(e) => handlePointerDownHandle(e, "image", img.id, "sw", img.x, img.y, img.width, img.height, img.locked)} style={{ position: "absolute", left: "-4px", bottom: "-4px", width: "8px", height: "8px", background: "#ffffff", border: "1.5px solid #2563eb", borderRadius: "1px", cursor: "nesw-resize", zIndex: 25, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            <div onPointerDown={(e) => handlePointerDownHandle(e, "image", img.id, "w", img.x, img.y, img.width, img.height, img.locked)} style={{ position: "absolute", left: "-4px", top: "calc(50% - 4px)", width: "8px", height: "8px", background: "#ffffff", border: "1.5px solid #2563eb", borderRadius: "1px", cursor: "ew-resize", zIndex: 25, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                          </>
                        )}
                      </div>
                    );
                  })}
            </div>
          </div>

          {/* BARRA INFERIOR DE ESTADO ESTILO POWERPOINT */}
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 8px 0 8px",
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "0.68rem",
              fontWeight: 600,
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Diapositiva 1 de 1</span>
              <span>•</span>
              <span>Panorámica (16:9 • 1920 × 1080 px)</span>
              {selectedElement && (
                <>
                  <span>•</span>
                  <span style={{ color: "#38bdf8" }}>
                    Elemento: {selectedElement.type === "image" ? selectedImage?.name : selectedShape?.name}
                    {((selectedElement.type === "image" && selectedImage?.locked) ||
                      (selectedElement.type === "shape" && selectedShape?.locked)) &&
                      " 🔒 (Fijo)"}
                  </span>
                </>
              )}
            </div>

            {/* CONTROLES DE ZOOM DE PRESENTACIÓN */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                title="Reducir zoom"
              >
                <ZoomOut size={13} />
              </button>

              <span style={{ minWidth: "36px", textAlign: "center" }}>{Math.round(zoomLevel * 100)}%</span>

              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))}
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                title="Aumentar zoom"
              >
                <ZoomIn size={13} />
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(1.0)}
                style={{ background: "rgba(255, 255, 255, 0.1)", border: "none", color: "#f8fafc", borderRadius: "4px", padding: "2px 6px", fontSize: "0.62rem", cursor: "pointer" }}
                title="Restablecer a tamaño de ventana"
              >
                Ajustar
              </button>
            </div>
          </div>

          {/* INDICADOR FLOTANTE DE ACTUALIZACIÓN */}
          {isRendering && (
            <div
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                background: "rgba(15, 23, 42, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "20px",
                padding: "4px 10px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                color: "var(--accent-orange)",
                fontSize: "0.66rem",
                fontWeight: 700,
                backdropFilter: "blur(8px)",
                zIndex: 30,
              }}
            >
              <RefreshCw size={11} className="spin" />
              <span>Renderizando lámina...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

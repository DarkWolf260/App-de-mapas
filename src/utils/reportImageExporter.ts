import type { DrawnFeature, DepartmentView } from "../types";
import { getNormalizedGroupList } from "./groupParser";
import { mergeLogs } from "./logMerge";
import { isPointInPolygon } from "./spatialUtils";

export interface ExportReportImageOptions {
  features: DrawnFeature[];
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  activeDepartment?: DepartmentView;
  singleFeatureTitle?: string;
  customDepartmentTitle?: string;
}

function formatDateSpanish(dateStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const months = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
  ];
  return `${day} DE ${months[monthIdx] || ""} DE ${year}`;
}

export function renderReportToCanvas(
  canvas: HTMLCanvasElement,
  {
    features,
    startDate,
    endDate,
    startTime = "00:00",
    endTime = "23:59",
    activeDepartment = "pc",
    singleFeatureTitle,
    customDepartmentTitle,
  }: ExportReportImageOptions
): { totalRescued: number; totalRecovered: number; totalPets: number; sectorsCount: number } {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("No canvas 2D context available");
    return { totalRescued: 0, totalRecovered: 0, totalPets: 0, sectorsCount: 0 };
  }

  // Department Label: Default strictly to "PROTECCIÓN CIVIL" unless custom or bomberos specified
  let deptLabel = customDepartmentTitle || "PROTECCIÓN CIVIL";
  if (!customDepartmentTitle && activeDepartment === "bomberos") {
    deptLabel = "CUERPO DE BOMBEROS";
  }

  // Date & Time banner text & target dates
  const sDate = startDate || endDate || new Date().toLocaleDateString("en-CA");
  const eDate = endDate || startDate || new Date().toLocaleDateString("en-CA");
  const sTime = startTime || "00:00";
  const eTime = endTime || "23:59";

  let dateBannerText = "";
  if (sDate === eDate) {
    dateBannerText = `REPORTE DEL DIA ${formatDateSpanish(sDate)} (${sTime} - ${eTime} HLV)`;
  } else {
    dateBannerText = `DESDE EL ${formatDateSpanish(sDate)} A LAS ${sTime} HLV HASTA LAS ${eTime} HLV DEL DIA ${formatDateSpanish(eDate)}`;
  }

  const isDateInRange = (logDate?: string) => {
    if (!logDate) return false;
    return logDate >= sDate && logDate <= eDate;
  };

  // 1. Extract all point features
  const allPoints = features.filter((f) => f.type === "point");

  // 2. Extract sector polygons (Sectores)
  const allSectors = features.filter(
    (f) => f.type === "polygon" || f.geojsonGeometry?.type === "Polygon"
  );

  // 3. Filter target candidate sectors (Sectores de la A a la F)
  let candidateSectors = singleFeatureTitle
    ? features.filter((f) => f.title === singleFeatureTitle)
    : (allSectors.length > 0 ? allSectors : features);

  if (!singleFeatureTitle && allSectors.length > 0) {
    const sectoresAToF = allSectors.filter((f) => {
      const t = f.title.toUpperCase();
      return (
        t.includes("SECTOR") ||
        /^\([A-F]\)/.test(t) ||
        /\b[A-F]\b/.test(t)
      );
    });
    if (sectoresAToF.length > 0) {
      candidateSectors = sectoresAToF;
    }
  }

  candidateSectors.sort((a, b) => a.title.localeCompare(b.title, "es", { numeric: true }));

  type MetricKey = "rescued" | "recovered" | "pets";
  const fieldMap: Record<MetricKey, "rescuedCount" | "recoveredCount" | "rescuedPetsCount"> = {
    rescued: "rescuedCount",
    recovered: "recoveredCount",
    pets: "rescuedPetsCount",
  };

  interface SubSiteData {
    locationName: string;
    count: number;
  }

  interface MetricSectorData {
    totalCount: number;
    subSites: SubSiteData[];
    fallbackLocationText: string;
  }

  // Calculate sector column data
  const processedSectors = candidateSectors.map((sector) => {
    const polyCoords = sector.geojsonGeometry?.coordinates as number[][][];
    const vs = polyCoords && polyCoords[0] ? polyCoords[0] : [];

    const containedPoints =
      vs.length > 0
        ? allPoints.filter((pt) => {
          const ptCoords = pt.geojsonGeometry?.coordinates as number[];
          if (!ptCoords) return false;
          return isPointInPolygon(ptCoords[0], ptCoords[1], vs);
        })
        : [];

    const metrics: Record<MetricKey, MetricSectorData> = {
      rescued: { totalCount: 0, subSites: [], fallbackLocationText: "" },
      recovered: { totalCount: 0, subSites: [], fallbackLocationText: "" },
      pets: { totalCount: 0, subSites: [], fallbackLocationText: "" },
    };

    const metricKeys: MetricKey[] = ["rescued", "recovered", "pets"];

    metricKeys.forEach((mKey) => {
      const field = fieldMap[mKey];
      let totalForMetric = 0;
      const subSites: SubSiteData[] = [];

      // Sector's own logs
      const sectorLogs =
        sector.dailyLogs?.filter(
          (l) =>
            isDateInRange(l.date) &&
            (activeDepartment === "mixto" ||
              !activeDepartment ||
              l.department === activeDepartment ||
              !l.department)
        ) || [];
      const mergedSectorLog = mergeLogs(sectorLogs);

      if (mergedSectorLog) {
        const groups = getNormalizedGroupList(mergedSectorLog);
        let groupSum = 0;

        groups.forEach((g) => {
          const val = parseInt((g as any)[field] || "0", 10) || 0;
          if (val > 0) {
            totalForMetric += val;
            groupSum += val;
            subSites.push({ locationName: sector.title, count: val });
          }
        });

        const flatVal = parseInt((mergedSectorLog as any)[field] || "0", 10) || 0;
        if (flatVal > 0) {
          totalForMetric += flatVal;
          if (groupSum === 0) {
            subSites.push({ locationName: sector.title, count: flatVal });
          }
        }
      }

      // Contained points' logs
      containedPoints.forEach((pt) => {
        const ptLogs =
          pt.dailyLogs?.filter(
            (l) =>
              isDateInRange(l.date) &&
              (activeDepartment === "mixto" ||
                !activeDepartment ||
                l.department === activeDepartment ||
                !l.department)
          ) || [];
        const mergedPtLog = mergeLogs(ptLogs);

        if (mergedPtLog) {
          let ptSum = 0;
          const groups = getNormalizedGroupList(mergedPtLog);

          groups.forEach((g) => {
            const val = parseInt((g as any)[field] || "0", 10) || 0;
            if (val > 0) {
              totalForMetric += val;
              ptSum += val;
              subSites.push({ locationName: pt.title, count: val });
            }
          });

          const flatVal = parseInt((mergedPtLog as any)[field] || "0", 10) || 0;
          if (flatVal > 0) {
            totalForMetric += flatVal;
            ptSum += flatVal;
            if (groups.length === 0) {
              subSites.push({ locationName: pt.title, count: flatVal });
            }
          }
        }
      });

      // Deduplicate sub-sites by locationName
      const uniqueSitesMap = new Map<string, number>();
      subSites.forEach((ss) => {
        uniqueSitesMap.set(ss.locationName, (uniqueSitesMap.get(ss.locationName) || 0) + ss.count);
      });

      const uniqueSubSites: SubSiteData[] = Array.from(uniqueSitesMap.entries()).map(
        ([locationName, count]) => ({ locationName, count })
      );

      const fallbackText =
        uniqueSubSites.length > 0
          ? uniqueSubSites.map((s) => s.locationName).join(", ")
          : "";

      metrics[mKey] = {
        totalCount: totalForMetric,
        subSites: uniqueSubSites,
        fallbackLocationText: fallbackText,
      };
    });

    const totalStatsSum =
      metrics.rescued.totalCount +
      metrics.recovered.totalCount +
      metrics.pets.totalCount;

    const hasStats = totalStatsSum > 0;

    return {
      title: sector.title,
      metrics,
      hasStats,
    };
  });

  // Filter sectors: Keep sectors that have stats > 0
  let siteColumns = processedSectors.filter((s) => s.hasStats);

  // Fallback if no sectors have data
  if (siteColumns.length === 0) {
    siteColumns = processedSectors.length > 0 ? processedSectors : [
      {
        title: "SIN SECTORES CON DATOS",
        metrics: {
          rescued: { totalCount: 0, subSites: [], fallbackLocationText: "" },
          recovered: { totalCount: 0, subSites: [], fallbackLocationText: "" },
          pets: { totalCount: 0, subSites: [], fallbackLocationText: "" },
        },
        hasStats: false,
      },
    ];
  }

  // Calculate Totals per metric category
  const totalRescued = siteColumns.reduce((acc, s) => acc + s.metrics.rescued.totalCount, 0);
  const totalRecovered = siteColumns.reduce((acc, s) => acc + s.metrics.recovered.totalCount, 0);
  const totalPets = siteColumns.reduce((acc, s) => acc + s.metrics.pets.totalCount, 0);

  // Layout Dimensions
  const scale = 2; // HD Crisp Quality
  const colCategoryWidth = 320;
  const colSiteWidth = 140;
  const colLocationWidth = 160;
  const colTotalWidth = 120;

  const numSites = Math.max(siteColumns.length, 1);
  const totalWidth = colCategoryWidth + numSites * (colSiteWidth + colLocationWidth) + colTotalWidth;

  const topBannerHeight = 60;
  const subHeaderHeight = 55;
  const singleSubRowHeight = 45;

  const metricRowsConfig = [
    { label: "PERSONAS RESCATADAS", key: "rescued" as const, total: totalRescued },
    { label: "CUERPOS RECUPERADOS", key: "recovered" as const, total: totalRecovered },
    { label: "MASCOTAS RESCATADAS", key: "pets" as const, total: totalPets },
  ];

  // Calculate heights per category row
  let totalDataHeight = 0;
  const categoryHeights = metricRowsConfig.map((m) => {
    const maxSubRows = Math.max(
      1,
      ...siteColumns.map((s) => s.metrics[m.key].subSites.length)
    );
    const h = maxSubRows * singleSubRowHeight;
    totalDataHeight += h;
    return { ...m, numSubRows: maxSubRows, height: h };
  });

  const totalHeight = topBannerHeight + subHeaderHeight + totalDataHeight;

  canvas.width = totalWidth * scale;
  canvas.height = totalHeight * scale;
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // 1. TOP ORANGE BANNER
  ctx.fillStyle = "#ea580c"; // Institutional Orange
  ctx.fillRect(0, 0, totalWidth, topBannerHeight);

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, totalWidth, totalHeight);

  const dateBannerWidth = colCategoryWidth;
  const totalBannerStart = totalWidth - colTotalWidth;
  const deptBannerWidth = totalWidth - dateBannerWidth - colTotalWidth;

  ctx.beginPath();
  ctx.moveTo(dateBannerWidth, 0);
  ctx.lineTo(dateBannerWidth, topBannerHeight);
  ctx.moveTo(totalBannerStart, 0);
  ctx.lineTo(totalBannerStart, topBannerHeight);
  ctx.stroke();

  // Text inside Date Banner (Left)
  ctx.fillStyle = "#000000";
  ctx.font = "bold 11px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  wrapText(ctx, dateBannerText, dateBannerWidth / 2, topBannerHeight / 2, dateBannerWidth - 20, 14);

  // Text inside Department Banner (Center - Default: PROTECCIÓN CIVIL)
  ctx.fillStyle = "#000000";
  ctx.font = "bold 20px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(deptLabel, dateBannerWidth + deptBannerWidth / 2, topBannerHeight / 2);

  // Text inside Total Banner Header (Right)
  ctx.fillStyle = "#000000";
  ctx.font = "bold 14px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TOTAL", totalBannerStart + colTotalWidth / 2, topBannerHeight / 2);

  // 2. NAVY BLUE SUBHEADER ROW
  const subHeaderY = topBannerHeight;
  ctx.fillStyle = "#0b1f52"; // Navy Blue
  ctx.fillRect(0, subHeaderY, totalWidth, subHeaderHeight);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 12px Arial, sans-serif";

  // Col 1 Title: OPERACIONES DE BUSQUEDA Y RESCATE (USAR)
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  wrapText(ctx, "OPERACIONES DE BUSQUEDA Y RESCATE (USAR)", colCategoryWidth / 2, subHeaderY + subHeaderHeight / 2, colCategoryWidth - 20, 15);

  // Site Header Columns
  let currentX = colCategoryWidth;
  siteColumns.forEach((site) => {
    // Site Title Header Box
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    wrapText(ctx, site.title.toUpperCase(), currentX + colSiteWidth / 2, subHeaderY + subHeaderHeight / 2, colSiteWidth - 10, 14);

    // Location Header Box
    ctx.fillText("UBICACIÓN", currentX + colSiteWidth + colLocationWidth / 2, subHeaderY + subHeaderHeight / 2);

    currentX += colSiteWidth + colLocationWidth;
  });

  // Vertical lines in Navy Subheader
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.beginPath();
  let xAcc = colCategoryWidth;
  for (let i = 0; i < siteColumns.length; i++) {
    ctx.moveTo(xAcc, subHeaderY);
    ctx.lineTo(xAcc, subHeaderY + subHeaderHeight);
    ctx.moveTo(xAcc + colSiteWidth, subHeaderY);
    ctx.lineTo(xAcc + colSiteWidth, subHeaderY + subHeaderHeight);
    xAcc += colSiteWidth + colLocationWidth;
  }
  ctx.moveTo(totalBannerStart, subHeaderY);
  ctx.lineTo(totalBannerStart, subHeaderY + subHeaderHeight);
  ctx.stroke();

  // Horizontal line separating Subheader and Data
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, subHeaderY + subHeaderHeight);
  ctx.lineTo(totalWidth, subHeaderY + subHeaderHeight);
  ctx.stroke();

  // 3. CATEGORY DATA ROWS (MERGED SECTOR COUNT + LOCATION WITH PARENTHESES AT START)
  let currentY = subHeaderY + subHeaderHeight;

  categoryHeights.forEach((rowConfig, rIdx) => {
    const catHeight = rowConfig.height;

    // Row Background (Light grey)
    ctx.fillStyle = rIdx % 2 === 0 ? "#e2e8f0" : "#cbd5e1";
    ctx.fillRect(0, currentY, totalWidth - colTotalWidth, catHeight);

    // Merged Total Cell Background (Orange)
    ctx.fillStyle = "#ea580c";
    ctx.fillRect(totalBannerStart, currentY, colTotalWidth, catHeight);

    // MERGED LEFT CATEGORY TITLE (Spans full catHeight)
    ctx.fillStyle = "#000000";
    ctx.font = "bold 12px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    wrapText(ctx, rowConfig.label, colCategoryWidth / 2, currentY + catHeight / 2, colCategoryWidth - 20, 15);

    // MERGED RIGHT TOTAL VALUE (Spans full catHeight)
    ctx.fillStyle = "#000000";
    ctx.font = "bold 16px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(rowConfig.total > 0 ? String(rowConfig.total) : "", totalBannerStart + colTotalWidth / 2, currentY + catHeight / 2);

    // MERGED SECTOR COUNT CELLS & SUB-ROW UBICACIÓN CELLS WITH PARENTHESES AT START
    let sX = colCategoryWidth;
    siteColumns.forEach((site) => {
      const mData = site.metrics[rowConfig.key];

      // Combined Merged Sector Quantity Cell (Spans catHeight for this sector)
      if (mData.totalCount > 0) {
        ctx.fillStyle = "#000000";
        ctx.font = "bold 15px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(mData.totalCount), sX + colSiteWidth / 2, currentY + catHeight / 2);
      }

      // Ubicación Sub-Rows: Adaptable a la cantidad real de ubicaciones de ESTE sector (sin filas vacías)
      const locList = mData.subSites.length > 0
        ? mData.subSites
        : (mData.totalCount > 0 && mData.fallbackLocationText
            ? [{ locationName: mData.fallbackLocationText, count: mData.totalCount }]
            : []);

      const numLocs = locList.length;

      if (numLocs > 0) {
        const itemHeight = catHeight / numLocs;

        locList.forEach((subSite, subIdx) => {
          const itemY = currentY + subIdx * itemHeight;

          ctx.fillStyle = "#000000";
          ctx.font = "11px Arial, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const locText = `(${subSite.count}) ${subSite.locationName}`;
          wrapText(
            ctx,
            locText,
            sX + colSiteWidth + colLocationWidth / 2,
            itemY + itemHeight / 2,
            colLocationWidth - 10,
            13
          );

          // Línea horizontal separadora ÚNICAMENTE entre puntos reales de este sector
          if (subIdx < numLocs - 1) {
            ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sX + colSiteWidth, itemY + itemHeight);
            ctx.lineTo(sX + colSiteWidth + colLocationWidth, itemY + itemHeight);
            ctx.stroke();
          }
        });
      }

      sX += colSiteWidth + colLocationWidth;
    });

    // Category Bottom Solid Border Line
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, currentY + catHeight);
    ctx.lineTo(totalWidth, currentY + catHeight);
    ctx.stroke();

    currentY += catHeight;
  });

  // Vertical Column Dividers for whole data area
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  let vX = colCategoryWidth;
  ctx.moveTo(vX, topBannerHeight);
  ctx.lineTo(vX, totalHeight);

  for (let i = 0; i < siteColumns.length; i++) {
    ctx.moveTo(vX + colSiteWidth, subHeaderY);
    ctx.lineTo(vX + colSiteWidth, totalHeight);
    vX += colSiteWidth + colLocationWidth;
    ctx.moveTo(vX, topBannerHeight);
    ctx.lineTo(vX, totalHeight);
  }
  ctx.moveTo(totalBannerStart, 0);
  ctx.lineTo(totalBannerStart, totalHeight);
  ctx.stroke();

  return {
    totalRescued,
    totalRecovered,
    totalPets,
    sectorsCount: siteColumns.filter((s) => s.hasStats).length,
  };
}

export function generateAndDownloadReportImage(options: ExportReportImageOptions): void {
  const canvas = document.createElement("canvas");
  renderReportToCanvas(canvas, options);

  const deptLabel = options.customDepartmentTitle || "PROTECCIÓN CIVIL";
  const sDate = options.startDate || options.endDate || new Date().toLocaleDateString("en-CA");
  const sanitizedDate = sDate.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Reporte_Informacion_${deptLabel.replace(/\s+/g, "_")}_${sanitizedDate}.png`;

  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export interface SlideCustomImage {
  id: string;
  name: string;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible?: boolean;
  locked?: boolean;
}

export interface SlideShape {
  id: string;
  type: "rect" | "circle" | "bar" | "text";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  text?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: string;
  visible?: boolean;
  locked?: boolean;
}

export interface ExportFullSlideOptions extends ExportReportImageOptions {
  customImages?: SlideCustomImage[];
  customShapes?: SlideShape[];
  headerTitle?: string;
  subTitle?: string;
  tableScale?: number;
  tableScaleX?: number;
  tableScaleY?: number;
  tableOffsetX?: number;
  tableOffsetY?: number;
  flagLogoConfig?: { x: number; y: number; width: number; height: number };
  pazLogoConfig?: { x: number; y: number; width: number; height: number };
  headerConfig?: { x: number; y: number; fontSize: number; fontWeight?: string };
  subtitleConfig?: { x: number; y: number; fontSize: number; fontWeight?: string };
  laguairaConfig?: { x: number; y: number; fontSize: number; fontWeight?: string };
}

/**
 * Renders the entire 16:9 Slide Presentation (1920x1080) replicating the exact official master template:
 * - Top Left: Venezuelan Justice & Cuadrantes de Paz logos
 * - Top Right: Circular Protección Civil Venezuela seal
 * - Header: Two-line blue title + blue accent bar spanning from left
 * - Subtitle: Official banner text
 * - Central Table: Operational rescue and recovered matrix
 * - Bottom Left: 3D Orange silhouette of La Guaira state + italic text
 * - Bottom Right: Navy blue footer band + blue chevrons + dot matrix
 */
export function renderFullSlideToCanvas(
  canvas: HTMLCanvasElement,
  options: ExportFullSlideOptions
): {
  totalRescued: number;
  totalRecovered: number;
  totalPets: number;
  sectorsCount: number;
  tableBounds: { x: number; y: number; width: number; height: number };
} {
  const SLIDE_WIDTH = 1920;
  const SLIDE_HEIGHT = 1080;

  canvas.width = SLIDE_WIDTH;
  canvas.height = SLIDE_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("No 2D context for full slide canvas");
    return {
      totalRescued: 0,
      totalRecovered: 0,
      totalPets: 0,
      sectorsCount: 0,
      tableBounds: { x: 0, y: 0, width: 0, height: 0 },
    };
  }

  // 1. Background (Pure White + Subtle Outer Border)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, SLIDE_WIDTH - 2, SLIDE_HEIGHT - 2);

  // 2. Navy Blue Bottom Footer Band (PPTX Group 20: Y=935, H=145)
  const footerHeight = 145;
  const footerY = SLIDE_HEIGHT - footerHeight;
  ctx.fillStyle = "#0e1789"; // PPTX srgbClr 0E1789
  ctx.fillRect(0, footerY, SLIDE_WIDTH, footerHeight);

  // 3. Blue Accent Bar under title spanning from left (PPTX Group 34: X: 2, Y: 170, W: 1325, H: 35)
  ctx.fillStyle = "#3f4bdf"; // PPTX srgbClr 3F4BDF
  ctx.fillRect(2, 170, 1325, 35);

  // 4. Institutional Header Titles (PPTX TextBox 37 & TextBox 25)
  const headerMain = options.headerTitle || "DIRECCIÓN NACIONAL DE PROTECCIÓN CIVIL\nY ADMINISTRACIÓN DE DESASTRES";
  const subTitle = options.subTitle || "REPORTE DIARIO DE RESCATES DE PERSONAS, CUERPOS RECUPERADOS Y MASCOTAS RESCATADAS";

  const headX = options.headerConfig?.x ?? 960;
  const headY = options.headerConfig?.y ?? 58;
  const headSize = options.headerConfig?.fontSize ?? 42;
  const headWeight = options.headerConfig?.fontWeight ?? "bold";

  ctx.save();
  ctx.fillStyle = "#292c7b"; // PPTX Title Color
  ctx.font = `${headWeight} ${headSize}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lines = headerMain.split("\n");
  if (lines.length === 1) {
    ctx.fillText(lines[0], headX, headY + 15);
  } else {
    ctx.fillText(lines[0], headX, headY);
    ctx.fillText(lines[1], headX, headY + headSize * 1.25);
  }

  // Subtitle Banner Text (PPTX TextBox 25)
  const subX = options.subtitleConfig?.x ?? 959;
  const subY = options.subtitleConfig?.y ?? 249;
  const subSize = options.subtitleConfig?.fontSize ?? 32;
  const subWeight = options.subtitleConfig?.fontWeight ?? "bold";

  ctx.fillStyle = "#0e1789";
  ctx.font = `${subWeight} ${subSize}px Arial, Helvetica, sans-serif`;
  ctx.fillText(subTitle, subX, subY);
  ctx.restore();

  // 5. Draw Official Master Graphics & Logos (Exact PPTX Media & Coordinates)
  try {
    const drawCached = (src: string, x: number, y: number, w: number, h: number, rotDeg = 0) => {
      const cached = imageCache.get(src);
      const draw = (img: HTMLImageElement) => {
        if (rotDeg === 0) {
          ctx.drawImage(img, x, y, w, h);
        } else {
          ctx.save();
          ctx.translate(x + w / 2, y + h / 2);
          ctx.rotate((rotDeg * Math.PI) / 180);
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();
        }
      };

      if (cached && cached.complete && cached.naturalWidth > 0) {
        draw(cached);
      } else {
        const img = new Image();
        img.onload = () => {
          imageCache.set(src, img);
          draw(img);
        };
        img.src = src;
      }
    };

    // Top Left: Venezuelan Justice Flag Logo (Exact user calibrated dimensions)
    const flagX = options.flagLogoConfig?.x ?? -63;
    const flagY = options.flagLogoConfig?.y ?? -67;
    const flagW = options.flagLogoConfig?.width ?? 356;
    const flagH = options.flagLogoConfig?.height ?? 318;
    drawCached("/assets/slide/image11.png", flagX, flagY, flagW, flagH);

    // Top Left: Gran Mision Cuadrantes de Paz Logo (Exact user calibrated dimensions)
    const pazX = options.pazLogoConfig?.x ?? 219;
    const pazY = options.pazLogoConfig?.y ?? -24;
    const pazW = options.pazLogoConfig?.width ?? 269;
    const pazH = options.pazLogoConfig?.height ?? 221;
    drawCached("/assets/slide/image10.png", pazX, pazY, pazW, pazH);

    // Top Right: Circular PC Venezuela Seal (PPTX Imagen 40: X: 1654, Y: 11, W: 213, H: 213)
    drawCached("/assets/slide/image7.png", 1654, 11, 213, 213);

    // Bottom Left: 3D Silhouette of La Guaira State (PPTX Freeform 74: X: 40, Y: 814, W: 772, H: 208)
    drawCached("/assets/slide/la_guaira_silhouette.svg", 40, 814, 772, 208);

    // Text "LA GUAIRA" under silhouette (PPTX Rectangle 75)
    const lgX = options.laguairaConfig?.x ?? 537;
    const lgY = options.laguairaConfig?.y ?? 923;
    const lgSize = options.laguairaConfig?.fontSize ?? 23;
    const lgWeight = options.laguairaConfig?.fontWeight ?? "bold";

    ctx.save();
    ctx.fillStyle = "#000000";
    ctx.font = `italic ${lgWeight} ${lgSize}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LA GUAIRA", lgX, lgY);
    ctx.restore();

    // Bottom Right: Blue Chevrons (PPTX Freeform 32: X: 1620, Y: 688, W: 119, H: 336, Rot: 90°)
    drawCached("/assets/slide/image8.svg", 1620, 688, 119, 336, 90);

    // Bottom Right: Dot Matrix Grid (PPTX Freeform 33: X: 1594, Y: 788, W: 318, H: 175)
    drawCached("/assets/slide/image9.svg", 1594, 788, 318, 175);
  } catch (e) {
    console.warn("Could not draw master slide assets:", e);
  }

  // 6. Render Custom Vector Shapes (If created by user)
  if (options.customShapes && options.customShapes.length > 0) {
    options.customShapes.forEach((s) => {
      if (s.visible === false) return;
      ctx.save();
      ctx.globalAlpha = s.opacity ?? 1.0;

      if (s.type === "circle") {
        ctx.beginPath();
        ctx.ellipse(s.x + s.width / 2, s.y + s.height / 2, s.width / 2, s.height / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = s.fillColor;
        ctx.fill();
        if (s.borderColor && (s.borderWidth || 0) > 0) {
          ctx.strokeStyle = s.borderColor;
          ctx.lineWidth = s.borderWidth || 1;
          ctx.stroke();
        }
      } else if (s.type === "text") {
        if (s.fillColor && s.fillColor !== "transparent") {
          ctx.fillStyle = s.fillColor;
          ctx.fillRect(s.x, s.y, s.width, s.height);
        }
        ctx.fillStyle = s.textColor || "#000000";
        ctx.font = `${s.fontWeight || "bold"} ${s.fontSize || 20}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        wrapText(ctx, s.text || s.name, s.x + s.width / 2, s.y + s.height / 2, s.width - 10, (s.fontSize || 20) * 1.3);
      } else {
        // "rect" or "bar"
        const rad = s.borderRadius || 0;
        ctx.beginPath();
        if (rad > 0 && ctx.roundRect) {
          ctx.roundRect(s.x, s.y, s.width, s.height, rad);
        } else {
          ctx.rect(s.x, s.y, s.width, s.height);
        }
        ctx.fillStyle = s.fillColor;
        ctx.fill();
        if (s.borderColor && (s.borderWidth || 0) > 0) {
          ctx.strokeStyle = s.borderColor;
          ctx.lineWidth = s.borderWidth || 1;
          ctx.stroke();
        }
      }
      ctx.restore();
    });
  }

  // 7. Render Central Operational Table to offscreen canvas and draw it centered
  const offscreenCanvas = document.createElement("canvas");
  const stats = renderReportToCanvas(offscreenCanvas, options);

  const tableRawWidth = offscreenCanvas.width / 2; // account for scale 2 in renderReportToCanvas
  const tableRawHeight = offscreenCanvas.height / 2;

  const maxTableWidth = 1500;
  const maxTableHeight = 460;
  const scaleFit = Math.min(1.0, maxTableWidth / tableRawWidth, maxTableHeight / tableRawHeight);
  const userScaleX = options.tableScaleX ?? options.tableScale ?? scaleFit;
  const userScaleY = options.tableScaleY ?? options.tableScale ?? scaleFit;

  const destWidth = tableRawWidth * userScaleX;
  const destHeight = tableRawHeight * userScaleY;
  const destX = (SLIDE_WIDTH - destWidth) / 2 + (options.tableOffsetX ?? 0);
  const destY = 285 + (options.tableOffsetY ?? 0);

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 5;
  ctx.drawImage(offscreenCanvas, 0, 0, offscreenCanvas.width, offscreenCanvas.height, destX, destY, destWidth, destHeight);
  ctx.restore();

  // 8. Draw Additional Custom Images / Photos uploaded by user
  if (options.customImages && options.customImages.length > 0) {
    options.customImages.forEach((imgObj) => {
      if (imgObj.visible === false) return;
      try {
        const cached = imageCache.get(imgObj.dataUrl);
        if (cached && cached.complete && cached.naturalWidth > 0) {
          ctx.drawImage(cached, imgObj.x, imgObj.y, imgObj.width, imgObj.height);
        } else {
          const img = new Image();
          img.onload = () => {
            imageCache.set(imgObj.dataUrl, img);
            ctx.drawImage(img, imgObj.x, imgObj.y, imgObj.width, imgObj.height);
          };
          img.src = imgObj.dataUrl;
        }
      } catch (err) {
        console.warn("[renderFullSlideToCanvas] Could not render custom image:", imgObj.name, err);
      }
    });
  }

  return {
    ...stats,
    tableBounds: {
      x: destX,
      y: destY,
      width: destWidth,
      height: destHeight,
    },
  };
}

const imageCache = new Map<string, HTMLImageElement>();

export function preloadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    const cached = imageCache.get(src)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (e) => {
      console.warn("Could not load image:", src, e);
      resolve(img); // Resolve anyway so rendering does not block
    };
    img.src = src;
  });
}

/**
 * Preloads all master template graphics and custom images, then renders to canvas.
 */
export async function renderFullSlideToCanvasAsync(
  canvas: HTMLCanvasElement,
  options: ExportFullSlideOptions
): Promise<{
  totalRescued: number;
  totalRecovered: number;
  totalPets: number;
  sectorsCount: number;
  tableBounds: { x: number; y: number; width: number; height: number };
}> {
  // Preload all assets (Exact PPTX Media)
  const masterUrls = [
    "/assets/slide/image11.png",
    "/assets/slide/image10.png",
    "/assets/slide/image7.png",
    "/assets/slide/la_guaira_silhouette.svg",
    "/assets/slide/image8.svg",
    "/assets/slide/image9.svg",
  ];

  const customUrls = (options.customImages || []).map((img) => img.dataUrl);
  await Promise.all([...masterUrls, ...customUrls].map(preloadImage));

  return renderFullSlideToCanvas(canvas, options);
}

export async function generateAndDownloadFullSlideImage(options: ExportFullSlideOptions): Promise<void> {
  const canvas = document.createElement("canvas");
  await renderFullSlideToCanvasAsync(canvas, options);

  const deptLabel = options.customDepartmentTitle || "PROTECCIÓN_CIVIL";
  const sDate = options.startDate || options.endDate || new Date().toLocaleDateString("en-CA");
  const sanitizedDate = sDate.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Diapositiva_Presentacion_${deptLabel.replace(/\s+/g, "_")}_${sanitizedDate}.png`;

  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper text wrapper for canvas
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  if (!text) return;
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = words[0] || "";

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, idx) => {
    ctx.fillText(line, x, startY + idx * lineHeight);
  });
}


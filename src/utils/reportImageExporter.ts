import type { DrawnFeature, DepartmentView } from "../types";
import { getNormalizedGroupList } from "./groupParser";
import { mergeLogs } from "./logMerge";
import { isPointInPolygon } from "./spatialUtils";

export interface ExportReportImageOptions {
  features: DrawnFeature[];
  startDate?: string;
  endDate?: string;
  activeDepartment?: DepartmentView;
  singleFeatureTitle?: string;
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

export function generateAndDownloadReportImage({
  features,
  startDate,
  endDate,
  activeDepartment = "pc",
  singleFeatureTitle,
}: ExportReportImageOptions): void {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("No canvas 2D context available");
    return;
  }

  // Determine Department Label
  let deptLabel = "PROTECCIÓN CIVIL";
  if (activeDepartment === "bomberos") {
    deptLabel = "CUERPO DE BOMBEROS";
  } else if (activeDepartment === "mixto") {
    deptLabel = "MANDO MIXTO";
  }

  // Date banner text & target dates
  const sDate = startDate || endDate || new Date().toLocaleDateString("en-CA");
  const eDate = endDate || startDate || new Date().toLocaleDateString("en-CA");
  let dateBannerText = "";

  if (sDate === eDate) {
    dateBannerText = `REPORTE DEL DIA ${formatDateSpanish(sDate)} (00:00 - 23:59 HLV)`;
  } else {
    dateBannerText = `DESDE EL ${formatDateSpanish(sDate)} A LAS 00:00 HLV HASTA LAS 23:59 HLV DEL DIA ${formatDateSpanish(eDate)}`;
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

  // Text inside Department Banner (Center)
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

  // 3. CATEGORY DATA ROWS (WITH MERGED TITLE AND MERGED TOTAL)
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

    // Render Sub-Rows for each sub-site
    for (let subIdx = 0; subIdx < rowConfig.numSubRows; subIdx++) {
      const subY = currentY + subIdx * singleSubRowHeight;
      let sX = colCategoryWidth;

      siteColumns.forEach((site) => {
        const mData = site.metrics[rowConfig.key];
        const subSite = mData.subSites[subIdx];

        ctx.fillStyle = "#000000";
        ctx.font = "13px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (subSite) {
          // Sub-site numeric count
          ctx.fillText(String(subSite.count), sX + colSiteWidth / 2, subY + singleSubRowHeight / 2);
          // Sub-site location name
          ctx.font = "11px Arial, sans-serif";
          wrapText(ctx, subSite.locationName, sX + colSiteWidth + colLocationWidth / 2, subY + singleSubRowHeight / 2, colLocationWidth - 10, 13);
        } else if (subIdx === 0 && mData.totalCount > 0) {
          // Single site or direct count fallback
          ctx.fillText(String(mData.totalCount), sX + colSiteWidth / 2, subY + singleSubRowHeight / 2);
          ctx.font = "11px Arial, sans-serif";
          wrapText(ctx, mData.fallbackLocationText, sX + colSiteWidth + colLocationWidth / 2, subY + singleSubRowHeight / 2, colLocationWidth - 10, 13);
        }

        sX += colSiteWidth + colLocationWidth;
      });

      // Internal sub-row divider line (if not last sub-row)
      if (subIdx < rowConfig.numSubRows - 1) {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(colCategoryWidth, subY + singleSubRowHeight);
        ctx.lineTo(totalBannerStart, subY + singleSubRowHeight);
        ctx.stroke();
      }
    }

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

  // TRIGGER PNG DOWNLOAD
  const sanitizedDate = (sDate || "reporte").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Reporte_Informacion_${deptLabel.replace(/\s+/g, "_")}_${sanitizedDate}.png`;

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

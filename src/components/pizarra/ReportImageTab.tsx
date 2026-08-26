import React, { useEffect, useRef, useState } from "react";
import { Download, Calendar, Clock, Shield, Flame, Activity, CheckCircle2, Layers, RefreshCw } from "lucide-react";
import type { DrawnFeature, DepartmentView } from "../../types";
import { renderReportToCanvas, generateAndDownloadReportImage } from "../../utils/reportImageExporter";

interface ReportImageTabProps {
  features: DrawnFeature[];
  selectedDate: string;
}

export const ReportImageTab: React.FC<ReportImageTabProps> = ({
  features,
  selectedDate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [startDate, setStartDate] = useState<string>(selectedDate || new Date().toLocaleDateString("en-CA"));
  const [endDate, setEndDate] = useState<string>(selectedDate || new Date().toLocaleDateString("en-CA"));
  const [startTime, setStartTime] = useState<string>("00:00");
  const [endTime, setEndTime] = useState<string>("23:59");
  const [customTitle, setCustomTitle] = useState<string>("PROTECCIÓN CIVIL");

  const [activeDept, setActiveDept] = useState<DepartmentView>("pc");
  const [isRendering, setIsRendering] = useState(false);

  const [stats, setStats] = useState({
    totalRescued: 0,
    totalRecovered: 0,
    totalPets: 0,
    sectorsCount: 0,
  });

  // Synchronize when selectedDate changes externally
  useEffect(() => {
    if (selectedDate) {
      setStartDate(selectedDate);
      setEndDate(selectedDate);
    }
  }, [selectedDate]);

  // Render report canvas live preview on state/date/time changes
  useEffect(() => {
    if (!canvasRef.current) return;
    setIsRendering(true);

    const timer = setTimeout(() => {
      if (canvasRef.current) {
        const res = renderReportToCanvas(canvasRef.current, {
          features,
          startDate,
          endDate,
          startTime,
          endTime,
          activeDepartment: activeDept,
          customDepartmentTitle: customTitle,
        });
        setStats(res);
      }
      setIsRendering(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [features, startDate, endDate, startTime, endTime, activeDept, customTitle]);

  const handleDownload = () => {
    generateAndDownloadReportImage({
      features,
      startDate,
      endDate,
      startTime,
      endTime,
      activeDepartment: activeDept,
      customDepartmentTitle: customTitle,
    });
  };

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        boxSizing: "border-box",
        padding: "16px 24px 70px 24px",
        maxWidth: "1600px",
        margin: "0 auto",
      }}
    >
      {/* ── BARRA SUPERIOR DE CONTROLES DE RANGO DE FECHAS Y HORAS ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "16px",
          flexWrap: "wrap",
          background: "rgba(15, 23, 42, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "14px",
          padding: "14px 20px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 25px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          {/* DESDE: FECHA E HORA */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--accent-orange)", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "4px" }}>
              <Calendar size={13} /> Desde:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.74rem",
                fontWeight: 700,
                padding: "5px 10px",
                outline: "none",
                fontFamily: "var(--sans-font)",
              }}
            />
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
              <Clock size={12} />
            </span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.74rem",
                fontWeight: 700,
                padding: "5px 8px",
                outline: "none",
                fontFamily: "var(--sans-font)",
              }}
            />
          </div>

          <div style={{ width: "1px", height: "24px", background: "rgba(255, 255, 255, 0.12)" }} />

          {/* HASTA: FECHA E HORA */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "4px" }}>
              <Calendar size={13} /> Hasta:
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.74rem",
                fontWeight: 700,
                padding: "5px 10px",
                outline: "none",
                fontFamily: "var(--sans-font)",
              }}
            />
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
              <Clock size={12} />
            </span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.74rem",
                fontWeight: 700,
                padding: "5px 8px",
                outline: "none",
                fontFamily: "var(--sans-font)",
              }}
            />
          </div>

          <div style={{ width: "1px", height: "24px", background: "rgba(255, 255, 255, 0.12)" }} />

          {/* PRESETS RÁPIDOS */}
          <button
            type="button"
            onClick={() => {
              const today = selectedDate || new Date().toLocaleDateString("en-CA");
              setStartDate(today);
              setEndDate(today);
              setStartTime("00:00");
              setEndTime("23:59");
            }}
            style={{
              background: "rgba(234, 88, 12, 0.15)",
              border: "1px solid rgba(234, 88, 12, 0.4)",
              borderRadius: "8px",
              color: "#ea580c",
              padding: "5px 10px",
              fontSize: "0.7rem",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--sans-font)",
              transition: "all 0.15s ease",
            }}
            title="Restablecer período a las 24 horas del día seleccionado"
          >
            Hoy Completo
          </button>
        </div>

        {/* BOTÓN DESCARGAR IMAGEN PNG */}
        <button
          onClick={handleDownload}
          style={{
            height: "38px",
            background: "linear-gradient(135deg, #ea580c, #c2410c)",
            border: "1px solid rgba(249, 115, 22, 0.5)",
            borderRadius: "10px",
            color: "#fff",
            fontSize: "0.78rem",
            fontWeight: 800,
            padding: "0 18px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "var(--sans-font)",
            boxShadow: "0 4px 15px rgba(234, 88, 12, 0.4)",
            transition: "all 0.15s ease",
          }}
        >
          <Download size={16} />
          <span>Descargar Imagen (PNG)</span>
        </button>
      </div>

      {/* ── METRICAS RESUMEN ARRIBA DEL CANVAS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
            borderRadius: "10px",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8" }}>
            <Activity size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.64rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Personas Rescatadas</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#f8fafc" }}>{stats.totalRescued}</div>
          </div>
        </div>

        <div
          style={{
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "10px",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
            <Activity size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.64rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Cuerpos Recuperados</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#f8fafc" }}>{stats.totalRecovered}</div>
          </div>
        </div>

        <div
          style={{
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(34, 197, 94, 0.2)",
            borderRadius: "10px",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(34, 197, 94, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#22c55e" }}>
            <Activity size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.64rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Mascotas Rescatadas</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#f8fafc" }}>{stats.totalPets}</div>
          </div>
        </div>

        <div
          style={{
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(249, 115, 22, 0.2)",
            borderRadius: "10px",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(249, 115, 22, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ea580c" }}>
            <Layers size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.64rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Sectores Activos</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#f8fafc" }}>{stats.sectorsCount}</div>
          </div>
        </div>
      </div>

      {/* ── CONTENEDOR VISTA PREVIA INTERACTIVA DE CANVAS ── */}
      <div
        style={{
          flex: 1,
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 12px 35px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          overflow: "auto",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={16} style={{ color: "var(--color-green)" }} />
            <span style={{ color: "#f8fafc", fontWeight: 800, fontSize: "0.88rem" }}>
              Vista Previa en Vivo del Reporte Institucional - PROTECCIÓN CIVIL (PNG)
            </span>
          </div>

          {isRendering && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-orange)", fontSize: "0.72rem", fontWeight: 700 }}>
              <RefreshCw size={13} className="spin" />
              <span>Generando vista previa...</span>
            </div>
          )}
        </div>

        {/* CONTENEDOR DEL CANVAS CON SCROLL / ESCALA CRISP */}
        <div
          style={{
            maxWidth: "100%",
            overflowX: "auto",
            overflowY: "auto",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            background: "#ffffff",
            padding: "8px",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              display: "block",
              maxWidth: "100%",
              height: "auto",
              borderRadius: "8px",
            }}
          />
        </div>
      </div>
    </div>
  );
};

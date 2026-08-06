import React from "react";
import { Activity, Map, FileSpreadsheet, Shield } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { C } from "./loginConstants";

interface SectionButtonProps {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  border: string;
  title: string;
  subtitle: string;
}

const SectionButton: React.FC<SectionButtonProps> = ({ href, icon, iconBg, border, title, subtitle }) => (
  <button
    onClick={() => { window.location.href = href; }}
    style={{
      width: "100%",
      background: C.panel,
      border,
      borderRadius: "10px",
      padding: "16px 20px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "14px",
      fontFamily: "var(--font-sans)",
      textAlign: "left",
    }}
  >
    <div style={{
      width: "42px",
      height: "42px",
      borderRadius: "10px",
      background: iconBg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ color: "#f8fafc", fontSize: "0.9rem", fontWeight: 700 }}>
        {title}
      </div>
      <div style={{ color: C.text, fontSize: "0.7rem", marginTop: "2px" }}>
        {subtitle}
      </div>
    </div>
  </button>
);

export const LoginSuccessScreen: React.FC = () => {
  const { isAdmin } = useAuth();

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      width: "100%",
      background: `radial-gradient(ellipse at 50% 0%, ${C.orange}10, transparent 60%), ${C.bg}`,
      fontFamily: "var(--font-sans)",
      padding: "20px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "440px",
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: "16px",
        padding: "40px 32px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: `linear-gradient(135deg, ${C.orange}, #ea580c)`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 24px ${C.orange}40`,
            marginBottom: "20px",
          }}>
            <Activity size={28} style={{ color: "#fff" }} />
          </div>
          <h1 style={{ color: "#f8fafc", fontSize: "1.2rem", fontWeight: 800, margin: "0 0 8px" }}>
            Sesión Iniciada Exitosamente
          </h1>
          <p style={{ color: C.text, fontSize: "0.82rem", margin: 0 }}>
            Seleccione la sección a la que desea ingresar
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <SectionButton
            href="/"
            icon={<Map size={22} style={{ color: C.orange }} />}
            iconBg={`${C.orange}20`}
            border={`1px solid ${C.orange}40`}
            title="Mapa Interactivo y Monitoreo"
            subtitle="Visualizar y gestionar capas operativas"
          />
          <SectionButton
            href="/consolidado"
            icon={<FileSpreadsheet size={22} style={{ color: C.blue }} />}
            iconBg={`${C.blue}20`}
            border={`1px solid ${C.blue}40`}
            title="Módulo de Información"
            subtitle="Consolidado operacional, REDAN y equipos"
          />
          {isAdmin && (
            <SectionButton
              href="/admin"
              icon={<Shield size={22} style={{ color: "#c084fc" }} />}
              iconBg="rgba(168, 85, 247, 0.2)"
              border="1px solid rgba(168, 85, 247, 0.4)"
              title="Panel de Administración"
              subtitle="Gestión central de usuarios y aprobaciones"
            />
          )}
        </div>
      </div>
    </div>
  );
};

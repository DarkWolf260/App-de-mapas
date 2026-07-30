import React, { useState } from "react";
import { Activity, Lock, Mail, Map, FileSpreadsheet } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const C = {
  bg: "#0a0e17",
  panel: "#111827",
  border: "rgba(255,255,255,0.08)",
  text: "#94a3b8",
  orange: "#f97316",
  blue: "#3b82f6",
  green: "#10b981",
};

const LoginPage: React.FC = () => {
  const { login, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      setLoggedIn(true);
    } catch (err: any) {
      setError(err.message || "Credenciales invalidas. Verifique e intente de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "var(--font-sans)",
      }}>
        <div style={{
          width: "36px",
          height: "36px",
          border: "3px solid rgba(255,255,255,0.08)",
          borderTopColor: C.orange,
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (loggedIn) {
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
              Sesion iniciada
            </h1>
            <p style={{ color: C.text, fontSize: "0.82rem", margin: 0 }}>
              Seleccione la seccion a la que desea ir
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button
              onClick={() => { window.location.href = "/"; }}
              style={{
                width: "100%",
                background: C.panel,
                border: `1px solid ${C.orange}40`,
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
                background: `${C.orange}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Map size={22} style={{ color: C.orange }} />
              </div>
              <div>
                <div style={{ color: "#f8fafc", fontSize: "0.9rem", fontWeight: 700 }}>
                  Mapeo y monitoreo
                </div>
                <div style={{ color: C.text, fontSize: "0.7rem", marginTop: "2px" }}>
                  Visualizar y gestionar el mapa operativo
                </div>
              </div>
            </button>

            <button
              onClick={() => { window.location.href = "/consolidado"; }}
              style={{
                width: "100%",
                background: C.panel,
                border: `1px solid ${C.blue}40`,
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
                background: `${C.blue}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <FileSpreadsheet size={22} style={{ color: C.blue }} />
              </div>
              <div>
                <div style={{ color: "#f8fafc", fontSize: "0.9rem", fontWeight: 700 }}>
                  Panel de Informacion
                </div>
                <div style={{ color: C.text, fontSize: "0.7rem", marginTop: "2px" }}>
                  Consolidado operativo, REDAN y equipos
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        maxWidth: "400px",
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
          <h1 style={{ color: "#f8fafc", fontSize: "1.4rem", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.01em" }}>
            COE La Guaira
          </h1>
          <p style={{ color: C.text, fontSize: "0.82rem", margin: 0 }}>
            Inicie sesion para acceder al sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "#ef4444",
              fontSize: "0.78rem",
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: C.text, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Correo Electronico
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.text }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@coelaguaira.gob.ve"
                autoComplete="email"
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.3)",
                  border: `1px solid ${C.border}`,
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.85rem",
                  fontFamily: "var(--font-sans)",
                  padding: "12px 12px 12px 40px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: C.text, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Contrasena
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.text }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contrasena"
                autoComplete="current-password"
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.3)",
                  border: `1px solid ${C.border}`,
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.85rem",
                  fontFamily: "var(--font-sans)",
                  padding: "12px 12px 12px 40px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              background: `linear-gradient(135deg, ${C.orange}, #ea580c)`,
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "0.88rem",
              fontWeight: 700,
              padding: "12px",
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "var(--font-sans)",
              opacity: submitting ? 0.7 : 1,
              marginTop: "4px",
            }}
          >
            {submitting ? "Iniciando sesion..." : "Iniciar Sesion"}
          </button>
        </form>
      </div>
    </div>
  );
};

export { LoginPage };

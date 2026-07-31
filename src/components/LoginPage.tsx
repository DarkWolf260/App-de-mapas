import React, { useState } from "react";
import { Activity, Lock, Mail, Map, FileSpreadsheet, User, Shield, CheckCircle, ArrowRight, KeyRound, MapPin } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { createRegistrationRequest } from "../services/userService";

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

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      setLoggedIn(true);
    } catch (err: any) {
      setError(err.message || "Credenciales inválidas. Verifique e intente de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setError("Por favor complete todos los campos requeridos.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden. Por favor verifique e intente de nuevo.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await createRegistrationRequest({
        fullName,
        email,
      });
      setSuccessMsg("¡Solicitud enviada con éxito! Un administrador evaluará tu registro para asignarte el acceso y rol.");
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setMode("login");
      }, 4000);
    } catch (err: any) {
      setError(err.message || "Error al enviar la solicitud. Intente nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
              Sesión Iniciada Exitosamente
            </h1>
            <p style={{ color: C.text, fontSize: "0.82rem", margin: 0 }}>
              Seleccione la sección a la que desea ingresar
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
                  Mapa Interactivo y Monitoreo
                </div>
                <div style={{ color: C.text, fontSize: "0.7rem", marginTop: "2px" }}>
                  Visualizar y gestionar capas operativas
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
                  Módulo de Información
                </div>
                <div style={{ color: C.text, fontSize: "0.7rem", marginTop: "2px" }}>
                  Consolidado operacional, REDAN y equipos
                </div>
              </div>
            </button>

            <button
              onClick={() => { window.location.href = "/admin"; }}
              style={{
                width: "100%",
                background: C.panel,
                border: `1px solid rgba(168, 85, 247, 0.4)`,
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
                background: `rgba(168, 85, 247, 0.2)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Shield size={22} style={{ color: "#c084fc" }} />
              </div>
              <div>
                <div style={{ color: "#f8fafc", fontSize: "0.9rem", fontWeight: 700 }}>
                  Panel de Administración
                </div>
                <div style={{ color: C.text, fontSize: "0.7rem", marginTop: "2px" }}>
                  Gestión central de usuarios y aprobaciones
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
      boxSizing: "border-box",
      position: "relative",
    }}>
      {/* BOTÓN SUPERIOR FLOTANTE PARA VOLVER AL MAPA */}
      <button
        type="button"
        onClick={() => { window.location.href = "/"; }}
        title="Salir del inicio de sesión y volver al mapa"
        style={{
          position: "absolute",
          top: "24px",
          left: "24px",
          background: "rgba(10, 15, 28, 0.9)",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          borderRadius: "10px",
          color: "#38bdf8",
          fontSize: "0.76rem",
          fontWeight: 700,
          padding: "8px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
          fontFamily: "var(--font-sans)",
          zIndex: 10,
        }}
      >
        <MapPin size={15} />
        <span>Volver al Mapa</span>
      </button>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: "16px",
        padding: "36px 30px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        {/* LOGO Y TÍTULO */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            background: `linear-gradient(135deg, ${C.orange}, #ea580c)`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 24px ${C.orange}40`,
            marginBottom: "14px",
          }}>
            <Activity size={26} style={{ color: "#fff" }} />
          </div>
          <h1 style={{ color: "#f8fafc", fontSize: "1.35rem", fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.01em" }}>
            COE La Guaira
          </h1>
          <p style={{ color: C.text, fontSize: "0.78rem", margin: 0 }}>
            {mode === "login" ? "Ingresa al sistema institucional" : "Solicitud de Registro de Usuario"}
          </p>
        </div>

        {/* PESTAÑAS DE MODALIDAD (INICIAR SESIÓN / REGISTRARSE) */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", padding: "3px", borderRadius: "8px", border: `1px solid ${C.border}`, marginBottom: "20px" }}>
          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); setSuccessMsg(null); }}
            style={{
              flex: 1,
              background: mode === "login" ? C.orange : "transparent",
              color: mode === "login" ? "#fff" : C.text,
              border: "none",
              borderRadius: "6px",
              padding: "7px 12px",
              fontSize: "0.76rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "var(--font-sans)",
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(null); setSuccessMsg(null); }}
            style={{
              flex: 1,
              background: mode === "register" ? C.orange : "transparent",
              color: mode === "register" ? "#fff" : C.text,
              border: "none",
              borderRadius: "6px",
              padding: "7px 12px",
              fontSize: "0.76rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "var(--font-sans)",
            }}
          >
            Registrarse
          </button>
        </div>

        {/* MENSAJES DE ERROR Y ÉXITO */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#ef4444", fontSize: "0.76rem", fontWeight: 500, marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", padding: "12px 14px", color: "#34d399", fontSize: "0.78rem", fontWeight: 600, marginBottom: "16px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <CheckCircle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORMULARIO SEGÚN LA PESTAÑA */}
        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: C.text, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Correo Electrónico
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
                    fontSize: "0.82rem",
                    fontFamily: "var(--font-sans)",
                    padding: "10px 12px 10px 38px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: C.text, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.text }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${C.border}`,
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "0.82rem",
                    fontFamily: "var(--font-sans)",
                    padding: "10px 12px 10px 38px",
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
                fontSize: "0.85rem",
                fontWeight: 700,
                padding: "11px",
                cursor: submitting ? "not-allowed" : "pointer",
                fontFamily: "var(--font-sans)",
                opacity: submitting ? 0.7 : 1,
                marginTop: "6px",
              }}
            >
              {submitting ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.66rem", fontWeight: 700, color: C.text, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Nombre y Apellido
              </label>
              <div style={{ position: "relative" }}>
                <User size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.text }} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Lic. Carlos Mendoza"
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${C.border}`,
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "0.8rem",
                    fontFamily: "var(--font-sans)",
                    padding: "9px 12px 9px 36px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.66rem", fontWeight: 700, color: C.text, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Correo Electrónico
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.text }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@coelaguaira.gob.ve"
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${C.border}`,
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "0.8rem",
                    fontFamily: "var(--font-sans)",
                    padding: "9px 12px 9px 36px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.66rem", fontWeight: 700, color: C.text, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.text }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña segura"
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${C.border}`,
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "0.8rem",
                    fontFamily: "var(--font-sans)",
                    padding: "9px 12px 9px 36px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.66rem", fontWeight: 700, color: C.text, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Confirmar Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <KeyRound size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.text }} />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita la contraseña"
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${confirmPassword && password !== confirmPassword ? "rgba(239, 68, 68, 0.5)" : C.border}`,
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "0.8rem",
                    fontFamily: "var(--font-sans)",
                    padding: "9px 12px 9px 36px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <div style={{ fontSize: "0.62rem", color: "#ef4444", marginTop: "3px" }}>
                  Las contraseñas no coinciden
                </div>
              )}
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
                fontSize: "0.85rem",
                fontWeight: 700,
                padding: "11px",
                cursor: submitting ? "not-allowed" : "pointer",
                fontFamily: "var(--font-sans)",
                opacity: submitting ? 0.7 : 1,
                marginTop: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span>{submitting ? "Enviando solicitud..." : "Enviar Solicitud de Registro"}</span>
              <ArrowRight size={15} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export { LoginPage };

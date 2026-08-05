import React, { useState } from "react";
import { LogOut, KeyRound, X, Check, Lock } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export const AuthModal: React.FC = () => {
  const { user, isAdmin, isOperador, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await login(email, password);
      setOpen(false);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorMsg(err.message || "Error al iniciar sesión. Verifique sus credenciales.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setOpen(false);
  };

  const isAuth = isAdmin || isOperador;

  if (isAuth) {
    return (
      <button
        onClick={handleLogout}
        title={`Cerrar Sesión (${user?.email})`}
        style={{
          background: "rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(239, 68, 68, 0.4)",
          borderRadius: "6px",
          color: "#ef4444",
          fontSize: "0.72rem",
          fontWeight: 700,
          padding: "5px 12px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontFamily: "var(--sans-font)",
          transition: "all 0.15s ease",
        }}
      >
        <LogOut size={14} />
        <span>Cerrar Sesión</span>
      </button>
    );
  }

  return (
    <>
      {/* Botón de Iniciar Sesión cuando no está autenticado */}
      <button
        onClick={() => setOpen(true)}
        className="admin-login-btn"
        style={{
          background: "rgba(56, 189, 248, 0.12)",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          borderRadius: "6px",
          color: "#38bdf8",
          fontSize: "0.72rem",
          fontWeight: 700,
          padding: "5px 12px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontFamily: "var(--sans-font)",
          transition: "all 0.15s ease",
        }}
        title="Iniciar Sesión"
      >
        <Lock size={14} />
        <span>Iniciar Sesión</span>
      </button>

      {/* Modal Emergente Glassmorphism */}
      {open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(10, 15, 29, 0.96)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "14px",
              padding: "20px 24px",
              width: "340px",
              maxWidth: "90vw",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
              color: "var(--text-main)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              animation: "fadeIn 0.2s ease",
            }}
          >
            {/* Header Modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <KeyRound size={15} style={{ color: "var(--color-info)" }} />
                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "0.04em" }}>
                  {isAdmin ? "Administrador Activo" : isOperador ? "Operador Activo" : "Iniciar Sesión"}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            </div>

            {isAuth ? (
              /* Vista cuando ya inició sesión */
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ background: isAdmin ? "rgba(34, 197, 94, 0.1)" : "rgba(56, 189, 248, 0.1)", border: `1px solid ${isAdmin ? "rgba(34, 197, 94, 0.3)" : "rgba(56, 189, 248, 0.3)"}`, padding: "10px", borderRadius: "8px", fontSize: "0.72rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: isAdmin ? "#4ade80" : "#38bdf8", fontWeight: 700, marginBottom: "4px" }}>
                    <Check size={14} /> Rol: {isAdmin ? "Administrador Global" : "Operador"}
                  </div>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Usuario: <strong>{user?.email}</strong></span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.68rem", display: "block", marginTop: "4px" }}>
                    {isAdmin
                      ? "Permisos totales: Puedes modificar cualquier registro, fecha o elemento en el mapa."
                      : "Permisos de Operador: Puedes modificar registros y llegada de grupos únicamente para el día de hoy."}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: "rgba(239, 68, 68, 0.18)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    color: "#ef4444",
                    padding: "8px",
                    borderRadius: "8px",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <LogOut size={14} /> Cerrar Sesión
                </button>
              </div>
            ) : (
              /* Formulario de Login */
              <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                  Ingresa tus credenciales de Supabase para habilitar la edición de mapas y reportes.
                </div>

                {errorMsg && (
                  <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "6px 8px", borderRadius: "6px", fontSize: "0.68rem" }}>
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "3px" }}>
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@coelaguaira.gob.ve"
                    style={{
                      width: "100%",
                      background: "rgba(17, 24, 39, 0.7)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      padding: "6px 8px",
                      color: "var(--text-primary)",
                      fontSize: "0.75rem",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "3px" }}>
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      background: "rgba(17, 24, 39, 0.7)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      padding: "6px 8px",
                      color: "var(--text-primary)",
                      fontSize: "0.75rem",
                      outline: "none",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: "var(--color-info)",
                    border: "none",
                    color: "#fff",
                    padding: "8px",
                    borderRadius: "8px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    marginTop: "6px",
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  <Lock size={12} /> {isSubmitting ? "Autenticando..." : "Ingresar como Admin"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

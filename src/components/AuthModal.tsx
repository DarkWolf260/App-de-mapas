import React, { useState } from "react";
import { Shield, LogOut, KeyRound, X, Check, Lock } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export const AuthModal: React.FC = () => {
  const { user, isAdmin, login, logout } = useAuth();
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

  return (
    <>
      {/* Botón Discreto en la interfaz */}
      <button
        onClick={() => setOpen(true)}
        className="admin-login-btn"
        style={{
          background: isAdmin ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.05)",
          border: isAdmin ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(255, 255, 255, 0.12)",
          color: isAdmin ? "#4ade80" : "var(--text-muted)",
          borderRadius: "20px",
          padding: "4px 10px",
          fontSize: "0.68rem",
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          transition: "all 0.2s ease",
        }}
        title={isAdmin ? `Sesión iniciada como ${user?.email}` : "Iniciar sesión como Administrador"}
      >
        <Shield size={12} style={{ color: isAdmin ? "#4ade80" : "var(--color-info)" }} />
        <span>{isAdmin ? "Modo Admin" : "Acceso Admin"}</span>
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
                  {isAdmin ? "Administrador Activo" : "Acceso de Administrador"}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            </div>

            {isAdmin ? (
              /* Vista cuando el admin ya inició sesión */
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", padding: "10px", borderRadius: "8px", fontSize: "0.72rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#4ade80", fontWeight: 700, marginBottom: "4px" }}>
                    <Check size={14} /> Permisos de Edición Activos
                  </div>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Usuario: <strong>{user?.email}</strong></span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>Puedes crear, mover, editar y guardar cualquier punto o polígono en el mapa.</span>
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
                  <LogOut size={14} /> Cerrar Sesión de Administrador
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

import React, { useState } from "react";
import { Activity, MapPin } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { registerUserAccount } from "../services/userService";
import { C } from "./login/loginConstants";
import { LoginForm } from "./login/LoginForm";
import { RegisterForm } from "./login/RegisterForm";
import { LoginSuccessScreen } from "./login/LoginSuccessScreen";

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

  const handleLoginSubmit = async () => {
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

  const handleRegisterSubmit = async () => {
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
      await registerUserAccount({ fullName, email, password });
      setSuccessMsg("¡Registro completado con éxito! Tu usuario ha sido registrado y requiere la activación de un Administrador en la tabla de usuarios.");
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
    return <LoginSuccessScreen />;
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

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#ef4444", fontSize: "0.76rem", fontWeight: 500, marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", padding: "12px 14px", color: "#34d399", fontSize: "0.78rem", fontWeight: 600, marginBottom: "16px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <span>{successMsg}</span>
          </div>
        )}

        {mode === "login" ? (
          <LoginForm
            email={email}
            password={password}
            submitting={submitting}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleLoginSubmit}
          />
        ) : (
          <RegisterForm
            fullName={fullName}
            email={email}
            password={password}
            confirmPassword={confirmPassword}
            submitting={submitting}
            onFullNameChange={setFullName}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onSubmit={handleRegisterSubmit}
          />
        )}
      </div>
    </div>
  );
};

export { LoginPage };

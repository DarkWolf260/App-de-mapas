import React from "react";
import { Mail, Lock } from "lucide-react";
import { C } from "./loginConstants";
import { LoginField } from "./LoginField";

interface LoginFormProps {
  email: string;
  password: string;
  submitting: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ email, password, submitting, onEmailChange, onPasswordChange, onSubmit }) => (
  <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
    <LoginField
      label="Correo Electrónico"
      icon={<Mail size={16} />}
      type="email"
      value={email}
      onChange={onEmailChange}
      placeholder="admin@coelaguaira.gob.ve"
      autoComplete="email"
    />
    <LoginField
      label="Contraseña"
      icon={<Lock size={16} />}
      type="password"
      value={password}
      onChange={onPasswordChange}
      placeholder="••••••••••••"
      autoComplete="current-password"
    />
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
);

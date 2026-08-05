import React from "react";
import { User, Mail, Lock, KeyRound, ArrowRight } from "lucide-react";
import { C } from "./loginConstants";
import { LoginField } from "./LoginField";

interface RegisterFormProps {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  submitting: boolean;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  fullName, email, password, confirmPassword, submitting,
  onFullNameChange, onEmailChange, onPasswordChange, onConfirmPasswordChange, onSubmit,
}) => {
  const mismatch = confirmPassword !== "" && password !== confirmPassword;
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <LoginField
        label="Nombre y Apellido"
        icon={<User size={15} />}
        type="text"
        required
        compact
        value={fullName}
        onChange={onFullNameChange}
        placeholder="Ej: Lic. Carlos Mendoza"
      />
      <LoginField
        label="Correo Electrónico"
        icon={<Mail size={15} />}
        type="email"
        required
        compact
        value={email}
        onChange={onEmailChange}
        placeholder="usuario@coelaguaira.gob.ve"
      />
      <LoginField
        label="Contraseña"
        icon={<Lock size={15} />}
        type="password"
        required
        compact
        value={password}
        onChange={onPasswordChange}
        placeholder="Contraseña segura"
      />
      <LoginField
        label="Confirmar Contraseña"
        icon={<KeyRound size={15} />}
        type="password"
        required
        compact
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        placeholder="Repita la contraseña"
        error={mismatch}
        errorText="Las contraseñas no coinciden"
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
  );
};

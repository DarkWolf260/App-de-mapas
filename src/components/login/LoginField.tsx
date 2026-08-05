import React from "react";
import { C } from "./loginConstants";

interface LoginFieldProps {
  label: string;
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  maxLength?: number;
  compact?: boolean;
  error?: boolean;
  errorText?: string;
}

export const LoginField: React.FC<LoginFieldProps> = ({
  label, icon, type, value, onChange, placeholder, autoComplete, required, maxLength, compact, error, errorText,
}) => {
  const font = compact ? "0.8rem" : "0.82rem";
  const pad = compact ? "9px 12px 9px 36px" : "10px 12px 10px 38px";
  return (
    <div>
      <label style={{ display: "block", fontSize: compact ? "0.66rem" : "0.68rem", fontWeight: 700, color: C.text, marginBottom: compact ? "4px" : "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.text, display: "inline-flex" }}>
          {icon}
        </span>
        <input
          type={type}
          required={required}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            width: "100%",
            background: "rgba(0,0,0,0.3)",
            border: `1px solid ${error ? "rgba(239, 68, 68, 0.5)" : C.border}`,
            borderRadius: "8px",
            color: "#f8fafc",
            fontSize: font,
            fontFamily: "var(--font-sans)",
            padding: pad,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>
      {error && errorText && (
        <div style={{ fontSize: "0.62rem", color: "#ef4444", marginTop: "3px" }}>
          {errorText}
        </div>
      )}
    </div>
  );
};

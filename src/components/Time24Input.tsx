import React, { useState, useEffect } from "react";
import { Clock, X } from "lucide-react";

interface Time24InputProps {
  value: string; // Expected HH:mm format (e.g. "08:30" or "14:15")
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Time24Input: React.FC<Time24InputProps> = ({
  value,
  onChange,
  placeholder = "HH:mm",
  className = "rr-editor-input",
  style,
}) => {
  const [inputValue, setInputValue] = useState(value || "");

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const normalize24h = (raw: string): string => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    if (digits.length === 0) return "";
    if (digits.length === 1) return digits;
    if (digits.length === 2) {
      const h = Math.min(23, parseInt(digits, 10));
      return h < 10 ? `0${h}` : `${h}`;
    }
    if (digits.length === 3) {
      const h = Math.min(23, parseInt(digits.slice(0, 2), 10));
      const hStr = h < 10 ? `0${h}` : `${h}`;
      return `${hStr}:${digits[2]}`;
    }
    const h = Math.min(23, parseInt(digits.slice(0, 2), 10));
    const m = Math.min(59, parseInt(digits.slice(2, 4), 10));
    const hStr = h < 10 ? `0${h}` : `${h}`;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${hStr}:${mStr}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = normalize24h(raw);
    setInputValue(formatted);
    if (formatted.length === 5 || formatted === "") {
      onChange(formatted);
    }
  };

  const handleBlur = () => {
    if (!inputValue) {
      onChange("");
      return;
    }
    if (inputValue.length === 1 || inputValue.length === 2) {
      const h = Math.min(23, parseInt(inputValue, 10));
      const formatted = `${h < 10 ? "0" + h : h}:00`;
      setInputValue(formatted);
      onChange(formatted);
    } else if (inputValue.length === 4 && inputValue.includes(":")) {
      const [hStr, mStr] = inputValue.split(":");
      const formatted = `${hStr}:${mStr}0`;
      setInputValue(formatted);
      onChange(formatted);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue("");
    onChange("");
  };

  return (
    <div style={{ display: "flex", alignItems: "center", position: "relative", width: "100%" }}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        maxLength={5}
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontWeight: 700,
          letterSpacing: "0.05em",
          ...style,
          paddingRight: inputValue ? "42px" : "26px",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: "6px",
          display: "flex",
          alignItems: "center",
          gap: "3px",
          pointerEvents: "none",
        }}
      >
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              pointerEvents: "auto",
            }}
            title="Borrar hora"
          >
            <X size={11} />
          </button>
        )}

        <Clock size={13} style={{ color: "var(--text-muted)", opacity: 0.6 }} />
      </div>
    </div>
  );
};

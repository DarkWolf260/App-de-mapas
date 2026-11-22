import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || "Error inesperado en la interfaz.",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[ErrorBoundary] Error capturado:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            padding: "24px",
            background: "#0a0f1d",
            color: "#f8fafc",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            textAlign: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
            Ocurrió un error inesperado
          </h2>
          <p style={{ margin: 0, maxWidth: "420px", fontSize: "0.9rem", color: "#94a3b8" }}>
            {this.state.errorMessage}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "none",
              background: "#f97316",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Recargar aplicación
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeploymentSummaryCard } from "../components/DeploymentSummaryCard";
import type { DrawnFeature } from "../types";

const todayStr = new Date().toLocaleDateString("en-CA");

const featureWithLog: DrawnFeature = {
  id: 1,
  title: "Base Central",
  type: "point",
  color: "#22c55e",
  geojsonGeometry: { type: "Point", coordinates: [-66.9, 10.6] },
  dailyLogs: [{
    date: todayStr,
    groups: [
      { id: "g1", groupName: "Alpha", unitOut: "U-01", managerName: "Juan", managerPhone: "555-0001", officersCount: "5", rescuedCount: "0", recoveredCount: "0", rescuedPetsCount: "0", hasArrived: false },
    ],
    observations: "",
  }] as any,
};

const featureWithoutTodayLog: DrawnFeature = {
  id: 2,
  title: "Puesto Norte",
  type: "point",
  color: "#3b82f6",
  geojsonGeometry: { type: "Point", coordinates: [-67.0, 10.7] },
  dailyLogs: [],
};

const defaultProps = {
  drawnFeatures: [] as DrawnFeature[],
  widgetCollapsed: false,
  onToggleCollapse: vi.fn(),
  onZoomToFeature: vi.fn(),
};

describe("DeploymentSummaryCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Sin personal desplegado hoy" when no features have today\'s log', () => {
    render(
      <DeploymentSummaryCard
        {...defaultProps}
        drawnFeatures={[featureWithoutTodayLog]}
      />
    );
    expect(screen.getByText("Sin personal desplegado hoy")).toBeInTheDocument();
  });

  it("renders feature title when a point has today's daily log with personnel", () => {
    render(
      <DeploymentSummaryCard
        {...defaultProps}
        drawnFeatures={[featureWithLog]}
      />
    );
    expect(screen.getByText("Base Central")).toBeInTheDocument();
  });

  it("shows officer count totals", () => {
    render(
      <DeploymentSummaryCard
        {...defaultProps}
        drawnFeatures={[featureWithLog]}
      />
    );
    expect(screen.getByText(/TOTALES/)).toBeInTheDocument();
  });

  it("toggle button calls onToggleCollapse", async () => {
    const user = userEvent.setup();
    render(
      <DeploymentSummaryCard
        {...defaultProps}
        drawnFeatures={[featureWithLog]}
      />
    );
    const btn = screen.getByTitle("Ocultar a icono discreto");
    await user.click(btn);
    expect(defaultProps.onToggleCollapse).toHaveBeenCalled();
  });

  it("shows Minimize icon when expanded and collapsed icon when collapsed", () => {
    const { rerender } = render(
      <DeploymentSummaryCard
        {...defaultProps}
        drawnFeatures={[featureWithLog]}
      />
    );
    expect(screen.getByTitle("Ocultar a icono discreto")).toBeInTheDocument();

    rerender(
      <DeploymentSummaryCard
        {...defaultProps}
        drawnFeatures={[]}
        widgetCollapsed={true}
      />
    );
  });

  it("clicking a feature row calls onZoomToFeature", async () => {
    const user = userEvent.setup();
    render(
      <DeploymentSummaryCard
        {...defaultProps}
        drawnFeatures={[featureWithLog]}
      />
    );
    const row = screen.getByText("Base Central").closest("div")!;
    await user.click(row);
  });

  it("filters correctly when selectedDate is provided", () => {
    render(
      <DeploymentSummaryCard
        {...defaultProps}
        drawnFeatures={[featureWithLog]}
        selectedDate="2026-06-25"
      />
    );
    expect(screen.getByText("Sin personal desplegado hoy")).toBeInTheDocument();
  });

  it("includes teams placed in sectors (polygon or polyline features)", () => {
    const sectorFeature: DrawnFeature = {
      id: 100,
      title: "Sector Norte - Zona A",
      type: "polygon",
      color: "#3b82f6",
      geojsonGeometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
      dailyLogs: [{
        date: todayStr,
        groups: [
          { id: "g1", groupName: "Equipo Sectorial 1", officersCount: "4", hasArrived: false },
        ],
        observations: "",
      }] as any,
    };

    render(
      <DeploymentSummaryCard
        {...defaultProps}
        drawnFeatures={[sectorFeature]}
      />
    );
    expect(screen.getByText("Sector Norte - Zona A")).toBeInTheDocument();
  });
});

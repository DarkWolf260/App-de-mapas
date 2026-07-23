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
  dailyLogs: [
    {
      date: todayStr,
      groupName: "Alpha",
      unitOut: "U-01",
      managerName: "Juan",
      managerPhone: "555-0001",
      officersCount: "5",
      rescuedCount: "0",
      recoveredCount: "0",
      rescuedPetsCount: "0",
      groupName2: "",
      managerName2: "",
      managerPhone2: "",
      unitOut2: "",
      departureTime2: "",
      arrivalTime2: "",
      officersCount2: "",
      rescuedCount2: "",
      recoveredCount2: "",
      hasArrivedG1: false,
      hasArrivedG2: false,
      observations: "",
    },
  ],
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
    const toggleBtn = screen.getByTitle("Contraer listado (sólo mostrar totales)");
    await user.click(toggleBtn);
    expect(defaultProps.onToggleCollapse).toHaveBeenCalledWith(true);
  });

  it('shows Minimize2 icon when expanded and Maximize2 icon when collapsed', () => {
    const { rerender } = render(
      <DeploymentSummaryCard
        {...defaultProps}
        widgetCollapsed={false}
        drawnFeatures={[featureWithLog]}
      />
    );
    expect(screen.getByTitle("Contraer listado (sólo mostrar totales)")).toBeInTheDocument();

    rerender(
      <DeploymentSummaryCard
        {...defaultProps}
        widgetCollapsed={true}
        drawnFeatures={[featureWithLog]}
      />
    );
    expect(screen.getByTitle("Mostrar listado completo")).toBeInTheDocument();
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
    expect(defaultProps.onZoomToFeature).toHaveBeenCalledWith(featureWithLog);
  });
});

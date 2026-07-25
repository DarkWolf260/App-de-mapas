import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GroupFields } from "../components/GroupFields";
import type { DailyLog } from "../types";

const emptyLog: Partial<DailyLog> = {
  groupName: "",
  unitOut: "",
  managerName: "",
  officersCount: "",
  managerPhone: "",
  hasArrivedG1: false,
  hasArrivedG2: false,
};

const defaultProps = {
  log: emptyLog,
  onFieldChange: vi.fn(),
  colorVar: "#22c55e",
};

describe("GroupFields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Grupo Primario" header when groupIndex=1', () => {
    render(<GroupFields {...defaultProps} groupIndex={1} />);
    expect(screen.getByText("Grupo Primario")).toBeInTheDocument();
  });

  it('renders "Grupo Secundario" header when groupIndex=2', () => {
    render(<GroupFields {...defaultProps} groupIndex={2} />);
    expect(screen.getByText("Grupo Secundario")).toBeInTheDocument();
  });

  it("renders correct placeholder texts for group 1", () => {
    render(<GroupFields {...defaultProps} groupIndex={1} />);
    expect(screen.getByPlaceholderText("Nombre Grupo")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Unidad (Vehículo)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Encargado")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Cant. Funcs.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Teléfono Encargado")).toBeInTheDocument();
  });

  it("renders correct placeholder texts for group 2", () => {
    render(<GroupFields {...defaultProps} groupIndex={2} />);
    expect(screen.getByPlaceholderText("Nombre Grupo 2")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Unidad 2 (Vehículo)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Encargado 2")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Teléfono Encargado 2")).toBeInTheDocument();
  });

  it('renders "¿Ya llegó del sitio el Grupo Primario?" for group 1', () => {
    render(<GroupFields {...defaultProps} groupIndex={1} />);
    expect(screen.getByText(/¿Ya llegó del sitio el Grupo Primario\?/i)).toBeInTheDocument();
  });

  it('renders "¿Ya llegó del sitio el Grupo Secundario?" for group 2', () => {
    render(<GroupFields {...defaultProps} groupIndex={2} />);
    expect(screen.getByText(/¿Ya llegó del sitio el Grupo Secundario\?/i)).toBeInTheDocument();
  });

  it("calls onFieldChange when input changes", async () => {
    const user = userEvent.setup();
    render(<GroupFields {...defaultProps} groupIndex={1} />);
    const nameInput = screen.getByPlaceholderText("Nombre Grupo");
    await user.type(nameInput, "A");
    expect(defaultProps.onFieldChange).toHaveBeenCalledWith("groupName", "A");
  });

  it("renders checkbox for hasArrived", () => {
    render(<GroupFields {...defaultProps} groupIndex={1} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });
});

describe("OperationTab Department Selector in Mixto Mode", () => {
  it("renders department selector when activeDepartment is mixto and handles selection", async () => {
    const { OperationTab } = await import("../components/popup/OperationTab");
    const user = userEvent.setup();
    const onDepartmentSelect = vi.fn();

    render(
      <OperationTab
        localLog={{}}
        popupEditDate="2026-07-23"
        setPopupEditDate={vi.fn()}
        showSecondGroup={false}
        setShowSecondGroup={vi.fn()}
        onFieldChange={vi.fn()}
        onSave={vi.fn()}
        saveSuccess={false}
        activeDepartment="mixto"
        selectedDept="pc"
        onDepartmentSelect={onDepartmentSelect}
      />
    );

    expect(screen.getByText(/Departamento para Estadísticas y Grupos:/i)).toBeInTheDocument();
    expect(screen.getByText(/Protección Civil/i)).toBeInTheDocument();
    expect(screen.getByText(/Bomberos/i)).toBeInTheDocument();

    const bomberosBtn = screen.getByRole("button", { name: /Bomberos/i });
    await user.click(bomberosBtn);
    expect(onDepartmentSelect).toHaveBeenCalledWith("bomberos");
  });
});

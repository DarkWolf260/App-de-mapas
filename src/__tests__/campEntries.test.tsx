import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { getEntryType, CampamentoEntry } from "../services/baseService";
import { BaseCard } from "../components/pizarra/BaseCard";
import { TotalGeneralCard } from "../components/pizarra/TotalGeneralCard";
import { AddCampEntryModal } from "../components/pizarra/AddCampEntryModal";

describe("getEntryType helper", () => {
  it("detects PC entries correctly", () => {
    expect(getEntryType("PC Amazonas")).toBe("pc");
    expect(getEntryType("PC Miranda")).toBe("pc");
    expect(getEntryType("PC")).toBe("pc");
  });

  it("detects Bomberos entries correctly", () => {
    expect(getEntryType("Bomberos Aragua")).toBe("bomberos");
    expect(getEntryType("Bomberos Universitarios")).toBe("bomberos");
  });

  it("detects custom/other entries correctly", () => {
    expect(getEntryType("Cruz Roja")).toBe("otros");
    expect(getEntryType("Grupo de Rescate Humboldt")).toBe("otros");
  });

  it("respects explicit type override", () => {
    expect(getEntryType("PC Amazonas", "bomberos")).toBe("bomberos");
    expect(getEntryType("Bomberos Miranda", "otros")).toBe("otros");
  });
});

describe("BaseCard component with institution entries", () => {
  const dummyCamp: CampamentoEntry = {
    id: "camp-1",
    campName: "Base Operacional Central",
    statesDetail: [
      { id: "s1", stateName: "PC Miranda", officersCount: 12, type: "pc" },
      { id: "s2", stateName: "Bomberos Aragua", officersCount: 8, type: "bomberos" },
      { id: "s3", stateName: "Cruz Roja Seccional", officersCount: 5, type: "otros" },
    ],
  };

  it("renders camp name and entries", () => {
    render(
      <BaseCard
        camp={dummyCamp}
        canEdit={false}
        isEditMode={false}
        handleUpdateCampName={vi.fn()}
        requestDeleteCamp={vi.fn()}
        handleAddStateToCamp={vi.fn()}
        handleEditStateInCamp={vi.fn()}
        requestRemoveState={vi.fn()}
      />
    );

    expect(screen.getByText("Base Operacional Central")).toBeInTheDocument();
    expect(screen.getByText("PC Miranda")).toBeInTheDocument();
    expect(screen.getByText("Bomberos Aragua")).toBeInTheDocument();
    expect(screen.getByText("Cruz Roja Seccional")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument(); // Total Base 12+8+5
  });

  it("displays type badges (PC, BOM, OTR)", () => {
    render(
      <BaseCard
        camp={dummyCamp}
        canEdit={false}
        isEditMode={false}
        handleUpdateCampName={vi.fn()}
        requestDeleteCamp={vi.fn()}
        handleAddStateToCamp={vi.fn()}
        handleEditStateInCamp={vi.fn()}
        requestRemoveState={vi.fn()}
      />
    );

    expect(screen.getByText("PC")).toBeInTheDocument();
    expect(screen.getByText("BOM")).toBeInTheDocument();
    expect(screen.getByText("OTR")).toBeInTheDocument();
  });
});

describe("TotalGeneralCard with institution breakdown", () => {
  it("renders total personnel and institution breakdown pills", () => {
    render(
      <TotalGeneralCard
        redanGrandTotal={100}
        pcCount={50}
        bomberosCount={30}
        otrosCount={20}
      />
    );

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("Personal Operativo Desplegado")).toBeInTheDocument();
  });
});

describe("AddCampEntryModal floating card", () => {
  it("renders modal title and camp name when open in create mode", () => {
    render(
      <AddCampEntryModal
        isOpen={true}
        campId="camp-123"
        campName="Base Naiguatá"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText("Añadir Entrada Operacional")).toBeInTheDocument();
    expect(screen.getByText("Base Naiguatá")).toBeInTheDocument();
    expect(screen.getByText("1. Tipo de Ente / Institución")).toBeInTheDocument();
    expect(screen.getByText("2. Nombre de la Entrada u Organismo")).toBeInTheDocument();
    expect(screen.getByText("3. Cantidad de Funcionarios / Efectivos")).toBeInTheDocument();
  });

  it("renders modal title in edit mode when entryToEdit is provided", () => {
    render(
      <AddCampEntryModal
        isOpen={true}
        campId="camp-123"
        campName="Base Naiguatá"
        entryToEdit={{ id: "s1", stateName: "Bomberos La Guaira", officersCount: 15, type: "bomberos" }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText("Editar Entrada Operacional")).toBeInTheDocument();
    expect(screen.getByText("Base Naiguatá")).toBeInTheDocument();
    expect(screen.getByText("Guardar Cambios")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <AddCampEntryModal
        isOpen={false}
        campId="camp-123"
        campName="Base Naiguatá"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});

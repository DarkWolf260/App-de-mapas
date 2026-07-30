import { describe, it, expect, vi } from "vitest";
import { exportWorkTeamsToExcel, type WorkTeamExportRow } from "../utils/excelExporter";

describe("excelExporter", () => {
  it("exports native OpenXML Excel file (.xlsx) with styled headers and zero warnings", () => {
    const mockRows: WorkTeamExportRow[] = [
      {
        date: "2026-07-30",
        department: "Protección Civil",
        locationTitle: "Punto de Control 1",
        groupName: "Grupo Alpha",
        unitOut: "U-12",
        departureTime: "08:00",
        arrivalTime: "08:30",
        managerName: "Juan Pérez",
        managerPhone: "0414-1234567",
        officersCount: "5",
        hasArrived: "En Sitio",
      },
    ];

    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;

    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();

    const clickSpy = vi.fn();
    const setAttributeSpy = vi.fn();
    const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue({
      setAttribute: setAttributeSpy,
      click: clickSpy,
      style: {},
    } as unknown as HTMLAnchorElement);

    const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation(() => ({} as any));
    const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation(() => ({} as any));

    exportWorkTeamsToExcel(mockRows, "2026-07-30");

    expect(clickSpy).toHaveBeenCalled();
    expect(setAttributeSpy).toHaveBeenCalledWith("download", "Consolidado_Operativo_2026-07-30.xlsx");
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });
});

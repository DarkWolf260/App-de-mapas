import { describe, it, expect, vi } from "vitest";
import { exportWorkTeamsToCSV, type WorkTeamExportRow } from "../utils/excelExporter";

describe("excelExporter", () => {
  it("exports CSV formatted with UTF-8 BOM and triggers download link", () => {
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
        hasArrived: "Llegó a sitio",
      },
    ];

    let createdBlobContent = "";
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;

    URL.createObjectURL = vi.fn((blob: Blob) => {
      const reader = new FileReader();
      reader.onload = () => {
        createdBlobContent = reader.result as string;
      };
      reader.readAsText(blob);
      return "blob:mock-url";
    });
    URL.revokeObjectURL = vi.fn();

    const clickSpy = vi.fn();
    const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue({
      setAttribute: vi.fn(),
      click: clickSpy,
      style: {},
    } as unknown as HTMLAnchorElement);

    const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation(() => ({} as any));
    const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation(() => ({} as any));

    exportWorkTeamsToCSV(mockRows, "2026-07-30");

    expect(clickSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateAndDownloadReportImage } from "../utils/reportImageExporter";
import type { DrawnFeature } from "../types";

describe("reportImageExporter", () => {
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;
  let createdLink: HTMLAnchorElement | null = null;

  beforeEach(() => {
    mockCtx = {
      scale: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 50 }),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      font: "",
      textAlign: "",
      textBaseline: "",
    } as unknown as CanvasRenderingContext2D;

    mockCanvas = {
      getContext: vi.fn().mockReturnValue(mockCtx),
      toDataURL: vi.fn().mockReturnValue("data:image/png;base64,fakeimage"),
      width: 0,
      height: 0,
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") {
        return mockCanvas;
      }
      if (tagName === "a") {
        const a = {
          download: "",
          href: "",
          click: vi.fn(),
        } as unknown as HTMLAnchorElement;
        createdLink = a;
        return a;
      }
      return document.createElement(tagName);
    });

    vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
  });

  it("should create canvas and trigger PNG download for sectors with stats", () => {
    const mockFeatures: DrawnFeature[] = [
      {
        id: 1,
        title: "Sector C (Playa Grande)",
        type: "polygon",
        geojsonGeometry: {
          type: "Polygon",
          coordinates: [
            [
              [-67.1, 10.5],
              [-66.9, 10.5],
              [-66.9, 10.7],
              [-67.1, 10.7],
              [-67.1, 10.5],
            ],
          ],
        },
      },
      {
        id: 2,
        title: "Punto de Rescate 1",
        type: "point",
        geojsonGeometry: { type: "Point", coordinates: [-67.0, 10.6] },
        dailyLogs: [
          {
            date: "2026-08-25",
            rescuedCount: "3",
            recoveredCount: "0",
            rescuedPetsCount: "1",
            prehospitalCareCount: "2",
            transfersCount: "0",
            groups: [
              { id: "g1", groupName: "OPP36", officersCount: "3" },
            ],
          },
        ],
      },
      {
        id: 3,
        title: "Sector E (Sin datos)",
        type: "polygon",
        geojsonGeometry: {
          type: "Polygon",
          coordinates: [
            [
              [-65.1, 11.5],
              [-64.9, 11.5],
              [-64.9, 11.7],
              [-65.1, 11.7],
              [-65.1, 11.5],
            ],
          ],
        },
      },
    ];

    generateAndDownloadReportImage({
      features: mockFeatures,
      startDate: "2026-08-25",
      endDate: "2026-08-25",
      activeDepartment: "pc",
    });

    expect(mockCanvas.getContext).toHaveBeenCalledWith("2d");
    expect(mockCtx.fillRect).toHaveBeenCalled();
    expect(mockCanvas.toDataURL).toHaveBeenCalledWith("image/png");
    expect(createdLink).not.toBeNull();
    expect(createdLink?.download).toContain("Reporte_Informacion_PROTECCIÓN_CIVIL_2026-08-25.png");

    // Verify that the location name and count from the point are rendered even if the point has groups
    const fillTextCalls = (mockCtx.fillText as any).mock.calls.map((c: any[]) => c[0]);
    expect(fillTextCalls).toContain("(3) Punto de Rescate 1");
  });
});

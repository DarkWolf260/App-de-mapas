import { renderHook } from "@testing-library/react";
import { useGeoJSONIO } from "../hooks/useGeoJSONIO";

function makeHook(drawnFeatures: any[] = []) {
  const setImported = vi.fn();
  const db = { features: { bulkInsert: vi.fn().mockResolvedValue(undefined) } } as any;
  const { result } = renderHook(() => useGeoJSONIO(db, drawnFeatures, setImported));
  return { result, db, setImported };
}

describe("parseAndCheckDuplicates", () => {
  it("returns null for invalid JSON", () => {
    const { result } = makeHook();
    expect(result.current.parseAndCheckDuplicates("not json")).toBeNull();
  });

  it("returns null for non-FeatureCollection", () => {
    const { result } = makeHook();
    const geojson = JSON.stringify({ type: "Point", coordinates: [0, 0] });
    expect(result.current.parseAndCheckDuplicates(geojson)).toBeNull();
  });

  it("parses a valid FeatureCollection", () => {
    const { result } = makeHook();
    const geojson = JSON.stringify({
      type: "FeatureCollection",
      features: [
        { type: "Feature", geometry: { type: "Point", coordinates: [-66.9, 10.6] }, properties: { title: "Test" } },
      ],
    });
    const parsed = result.current.parseAndCheckDuplicates(geojson);
    expect(parsed).not.toBeNull();
    expect(parsed!.length).toBe(1);
    expect(parsed![0].title).toBe("Test");
    expect(parsed![0].type).toBe("point");
    expect(parsed![0].isDuplicate).toBe(false);
    expect(parsed![0].selected).toBe(true);
  });

  it("detects duplicates based on title+type+firstCoord", () => {
    const { result } = makeHook([{ id: 1, title: "Existing", type: "point", geojsonGeometry: { type: "Point", coordinates: [-66.9, 10.6] } }]);
    const geojson = JSON.stringify({
      type: "FeatureCollection",
      features: [
        { type: "Feature", geometry: { type: "Point", coordinates: [-66.9, 10.6] }, properties: { title: "Existing" } },
      ],
    });
    const parsed = result.current.parseAndCheckDuplicates(geojson);
    expect(parsed![0].isDuplicate).toBe(true);
    expect(parsed![0].selected).toBe(false);
  });

  it("ignores unsupported geometry types", () => {
    const { result } = makeHook();
    const geojson = JSON.stringify({
      type: "FeatureCollection",
      features: [
        { type: "Feature", geometry: { type: "MultiPoint", coordinates: [[0, 0]] }, properties: { title: "Multi" } },
        { type: "Feature", geometry: { type: "Point", coordinates: [1, 1] }, properties: { title: "Valid" } },
      ],
    });
    const parsed = result.current.parseAndCheckDuplicates(geojson);
    expect(parsed!.length).toBe(1);
    expect(parsed![0].title).toBe("Valid");
  });

  it("uses default title when not provided", () => {
    const { result } = makeHook();
    const geojson = JSON.stringify({
      type: "FeatureCollection",
      features: [
        { type: "Feature", geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] }, properties: {} },
      ],
    });
    const parsed = result.current.parseAndCheckDuplicates(geojson);
    expect(parsed![0].title).toBe("Elemento 1");
  });

  it("parses LineString as polyline", () => {
    const { result } = makeHook();
    const geojson = JSON.stringify({
      type: "FeatureCollection",
      features: [
        { type: "Feature", geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] }, properties: { title: "Line" } },
      ],
    });
    const parsed = result.current.parseAndCheckDuplicates(geojson);
    expect(parsed![0].type).toBe("polyline");
  });
});

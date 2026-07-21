import { hexToRgb, PALETTE } from "../utils/colorUtils";

describe("hexToRgb", () => {
  it("returns [0,0,0] for black", () => {
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
  });

  it("returns [255,255,255] for white", () => {
    expect(hexToRgb("#ffffff")).toEqual([255, 255, 255]);
  });

  it("returns [59,130,246] for #3b82f6", () => {
    expect(hexToRgb("#3b82f6")).toEqual([59, 130, 246]);
  });
});

describe("PALETTE", () => {
  it("has 35 entries", () => {
    expect(PALETTE).toHaveLength(35);
  });

  it("all entries have valid hex and rgb", () => {
    for (const entry of PALETTE) {
      expect(entry.hex).toMatch(/^#[0-9a-f]{6}$/i);
      expect(entry.rgb).toHaveLength(3);
      for (const channel of entry.rgb) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      }
    }
  });

  it("hexToRgb matches PALETTE[i].rgb for every entry", () => {
    for (const entry of PALETTE) {
      expect(hexToRgb(entry.hex)).toEqual(entry.rgb);
    }
  });
});

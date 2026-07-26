import { hexToRgbArray } from "../utils/graphicConverters";

describe("hexToRgbArray", () => {
  it("converts hex color with alpha", () => {
    expect(hexToRgbArray("#ff0000", 1)).toEqual([255, 0, 0, 1]);
  });

  it("converts hex color with 0 alpha", () => {
    expect(hexToRgbArray("#00ff00", 0)).toEqual([0, 255, 0, 0]);
  });

  it("converts #3b82f6", () => {
    expect(hexToRgbArray("#3b82f6", 0.5)).toEqual([59, 130, 246, 0.5]);
  });

  it("converts black", () => {
    expect(hexToRgbArray("#000000", 0.9)).toEqual([0, 0, 0, 0.9]);
  });

  it("converts white", () => {
    expect(hexToRgbArray("#ffffff", 0.25)).toEqual([255, 255, 255, 0.25]);
  });
});

import { describe, it, expect } from "vitest";
import { formatPhone } from "../utils/phoneFormatter";

describe("formatPhone", () => {
  it("returns empty string for empty input", () => {
    expect(formatPhone("")).toBe("");
  });

  it("leaves up to 4 digits unformatted", () => {
    expect(formatPhone("0414")).toBe("0414");
    expect(formatPhone("0212")).toBe("0212");
  });

  it("automatically inserts hyphen after 4 digits for 0000-0000000 format", () => {
    expect(formatPhone("04141")).toBe("0414-1");
    expect(formatPhone("04141234567")).toBe("0414-1234567");
  });

  it("strictly caps phone length at 11 digits (0000-0000000)", () => {
    expect(formatPhone("0414123456789012")).toBe("0414-1234567");
  });

  it("handles existing hyphenated strings smoothly", () => {
    expect(formatPhone("0414-1234567")).toBe("0414-1234567");
  });
});

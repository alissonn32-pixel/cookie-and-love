import { describe, it, expect } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Big Apple Choc Chunk")).toBe("big-apple-choc-chunk");
  });

  it("removes accents", () => {
    expect(slugify("Pão de Mel")).toBe("pao-de-mel");
  });

  it("removes special characters", () => {
    expect(slugify("Cookie & Love!")).toBe("cookie-love");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  Cookie  ")).toBe("cookie");
  });
});

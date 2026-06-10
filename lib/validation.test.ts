import { describe, it, expect } from "vitest";
import { isStoreOpen, meetsMinimumOrder, minimumOrderShortfall } from "./validation";
import { StoreSettings } from "./types";

const baseSettings: StoreSettings = {
  isOpen: true,
  prepTimeMinutes: 40,
  minOrderValue: 20,
  heroText: "Crocante por fora, derretendo por dentro.",
  whatsappTarget: "5500000000000",
  paymentMethods: ["pix", "dinheiro", "cartao"],
  deliveryOptions: ["retirada", "entrega"],
  tabs: [],
};

describe("isStoreOpen", () => {
  it("returns true when settings.isOpen is true", () => {
    expect(isStoreOpen(baseSettings)).toBe(true);
  });

  it("returns false when settings.isOpen is false", () => {
    expect(isStoreOpen({ ...baseSettings, isOpen: false })).toBe(false);
  });
});

describe("meetsMinimumOrder", () => {
  it("returns true when total equals the minimum order value", () => {
    expect(meetsMinimumOrder(20, baseSettings)).toBe(true);
  });

  it("returns true when total exceeds the minimum order value", () => {
    expect(meetsMinimumOrder(25, baseSettings)).toBe(true);
  });

  it("returns false when total is below the minimum order value", () => {
    expect(meetsMinimumOrder(15, baseSettings)).toBe(false);
  });
});

describe("minimumOrderShortfall", () => {
  it("returns 0 when total meets or exceeds the minimum", () => {
    expect(minimumOrderShortfall(20, baseSettings)).toBe(0);
    expect(minimumOrderShortfall(25, baseSettings)).toBe(0);
  });

  it("returns the difference when total is below the minimum", () => {
    expect(minimumOrderShortfall(15, baseSettings)).toBeCloseTo(5, 5);
  });
});

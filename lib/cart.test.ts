import { describe, it, expect } from "vitest";
import { addItem, removeItem, updateQty, cartTotal } from "./cart";
import { CartItem, Product } from "./types";

const cookie: Product = {
  id: "big-apple-choc-chunk",
  name: "Big Apple Choc Chunk",
  description: "Massa amanteigada com gotas de chocolate belga",
  price: 12.9,
  imageUrl: "/products/big-apple-choc-chunk.jpg",
  category: "destaque",
  badge: "mais_vendido",
  stockToday: null,
  active: true,
};

const otherCookie: Product = {
  ...cookie,
  id: "brooklyn-red-velvet",
  name: "Brooklyn Red Velvet",
  price: 13.9,
};

describe("addItem", () => {
  it("adds a new product to an empty cart with qty 1", () => {
    const result = addItem([], cookie);
    expect(result).toEqual<CartItem[]>([
      { productId: "big-apple-choc-chunk", name: "Big Apple Choc Chunk", price: 12.9, qty: 1 },
    ]);
  });

  it("increments qty if the product is already in the cart", () => {
    const cart = addItem([], cookie);
    const result = addItem(cart, cookie);
    expect(result).toEqual<CartItem[]>([
      { productId: "big-apple-choc-chunk", name: "Big Apple Choc Chunk", price: 12.9, qty: 2 },
    ]);
  });

  it("adds a second distinct product as a separate line", () => {
    const cart = addItem([], cookie);
    const result = addItem(cart, otherCookie);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual<CartItem>({
      productId: "brooklyn-red-velvet",
      name: "Brooklyn Red Velvet",
      price: 13.9,
      qty: 1,
    });
  });
});

describe("removeItem", () => {
  it("removes the line for the given productId", () => {
    const cart = addItem(addItem([], cookie), otherCookie);
    const result = removeItem(cart, "big-apple-choc-chunk");
    expect(result).toEqual<CartItem[]>([
      { productId: "brooklyn-red-velvet", name: "Brooklyn Red Velvet", price: 13.9, qty: 1 },
    ]);
  });

  it("is a no-op if the productId is not in the cart", () => {
    const cart = addItem([], cookie);
    const result = removeItem(cart, "does-not-exist");
    expect(result).toEqual(cart);
  });
});

describe("updateQty", () => {
  it("updates the quantity for the given productId", () => {
    const cart = addItem([], cookie);
    const result = updateQty(cart, "big-apple-choc-chunk", 5);
    expect(result[0].qty).toBe(5);
  });

  it("removes the line entirely when qty is set to 0", () => {
    const cart = addItem([], cookie);
    const result = updateQty(cart, "big-apple-choc-chunk", 0);
    expect(result).toEqual([]);
  });
});

describe("cartTotal", () => {
  it("returns 0 for an empty cart", () => {
    expect(cartTotal([])).toBe(0);
  });

  it("sums price * qty across all items", () => {
    const cart: CartItem[] = [
      { productId: "a", name: "A", price: 12.9, qty: 2 },
      { productId: "b", name: "B", price: 13.9, qty: 1 },
    ];
    expect(cartTotal(cart)).toBeCloseTo(39.7, 5);
  });
});

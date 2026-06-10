import { describe, it, expect, vi } from "vitest";
import { getProducts } from "./products";
import { SupabaseClient } from "@supabase/supabase-js";

function mockClient(rows: unknown[] | null, error: unknown = null) {
  const order = vi.fn().mockResolvedValue({ data: rows, error });
  const eq = vi.fn().mockReturnValue({ order });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as SupabaseClient;
}

describe("getProducts", () => {
  it("maps database rows to Product objects", async () => {
    const rows = [
      {
        id: "big-apple-choc-chunk",
        name: "Big Apple Choc Chunk",
        description: "Massa amanteigada com gotas de chocolate belga",
        price: 12.9,
        image_url: "/products/big-apple-choc-chunk.jpg",
        category: "destaque",
        badge: "mais_vendido",
        stock_today: null,
        active: true,
      },
    ];
    const client = mockClient(rows);

    const products = await getProducts(client);

    expect(products).toEqual([
      {
        id: "big-apple-choc-chunk",
        name: "Big Apple Choc Chunk",
        description: "Massa amanteigada com gotas de chocolate belga",
        price: 12.9,
        imageUrl: "/products/big-apple-choc-chunk.jpg",
        category: "destaque",
        badge: "mais_vendido",
        stockToday: null,
        active: true,
      },
    ]);
  });

  it("queries the products table for active products ordered by category", async () => {
    const client = mockClient([]);

    await getProducts(client);

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    expect(fromMock).toHaveBeenCalledWith("products");

    const selectMock = fromMock.mock.results[0].value.select as ReturnType<typeof vi.fn>;
    expect(selectMock).toHaveBeenCalledWith("*");

    const eqMock = selectMock.mock.results[0].value.eq as ReturnType<typeof vi.fn>;
    expect(eqMock).toHaveBeenCalledWith("active", true);

    const orderMock = eqMock.mock.results[0].value.order as ReturnType<typeof vi.fn>;
    expect(orderMock).toHaveBeenCalledWith("category");
  });

  it("throws an error when the query returns an error", async () => {
    const client = mockClient(null, new Error("db error"));

    await expect(getProducts(client)).rejects.toThrow("db error");
  });
});

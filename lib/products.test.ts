import { describe, it, expect, vi } from "vitest";
import { getProducts, getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getFeaturedProducts } from "./products";
import { SupabaseClient } from "@supabase/supabase-js";
import { Product } from "./types";

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

describe("getAllProducts", () => {
  it("maps database rows to Product objects without filtering by active", async () => {
    const rows = [
      {
        id: "harlem-peanut-butter",
        name: "Harlem Peanut Butter",
        description: "Pasta de amendoim com gotas de chocolate ao leite",
        price: 13.5,
        image_url: "/products/harlem-peanut-butter.jpg",
        category: "cookie",
        badge: null,
        stock_today: 0,
        active: false,
      },
    ];

    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const select = vi.fn().mockReturnValue({ order });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from } as unknown as SupabaseClient;

    const products = await getAllProducts(client);

    expect(from).toHaveBeenCalledWith("products");
    expect(select).toHaveBeenCalledWith("*");
    expect(order).toHaveBeenCalledWith("category");
    expect(products).toEqual([
      {
        id: "harlem-peanut-butter",
        name: "Harlem Peanut Butter",
        description: "Pasta de amendoim com gotas de chocolate ao leite",
        price: 13.5,
        imageUrl: "/products/harlem-peanut-butter.jpg",
        category: "cookie",
        badge: null,
        stockToday: 0,
        active: false,
      },
    ]);
  });

  it("throws an error when the query returns an error", async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: new Error("db error") });
    const select = vi.fn().mockReturnValue({ order });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from } as unknown as SupabaseClient;

    await expect(getAllProducts(client)).rejects.toThrow("db error");
  });
});

describe("getProductById", () => {
  it("returns the mapped product when found", async () => {
    const row = {
      id: "tribeca-salted-caramel",
      name: "Tribeca Salted Caramel",
      description: "Recheio de doce de leite com flor de sal",
      price: 15.9,
      image_url: "/products/tribeca-salted-caramel.jpg",
      category: "especial",
      badge: "novo",
      stock_today: null,
      active: true,
    };

    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from } as unknown as SupabaseClient;

    const product = await getProductById(client, "tribeca-salted-caramel");

    expect(from).toHaveBeenCalledWith("products");
    expect(select).toHaveBeenCalledWith("*");
    expect(eq).toHaveBeenCalledWith("id", "tribeca-salted-caramel");
    expect(product).toEqual({
      id: "tribeca-salted-caramel",
      name: "Tribeca Salted Caramel",
      description: "Recheio de doce de leite com flor de sal",
      price: 15.9,
      imageUrl: "/products/tribeca-salted-caramel.jpg",
      category: "especial",
      badge: "novo",
      stockToday: null,
      active: true,
    });
  });

  it("returns null when not found", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from } as unknown as SupabaseClient;

    const product = await getProductById(client, "does-not-exist");

    expect(product).toBeNull();
  });

  it("throws an error when the query returns an error", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: new Error("db error") });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from } as unknown as SupabaseClient;

    await expect(getProductById(client, "x")).rejects.toThrow("db error");
  });
});

const sampleProduct: Product = {
  id: "test-cookie",
  name: "Test Cookie",
  description: "A test cookie",
  price: 10,
  imageUrl: "/products/test-cookie.jpg",
  category: "cookie",
  badge: null,
  stockToday: null,
  active: true,
};

const sampleRow = {
  id: "test-cookie",
  name: "Test Cookie",
  description: "A test cookie",
  price: 10,
  image_url: "/products/test-cookie.jpg",
  category: "cookie",
  badge: null,
  stock_today: null,
  active: true,
};

describe("createProduct", () => {
  it("inserts a row mapped from the product", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ insert });
    const client = { from } as unknown as SupabaseClient;

    await createProduct(client, sampleProduct);

    expect(from).toHaveBeenCalledWith("products");
    expect(insert).toHaveBeenCalledWith(sampleRow);
  });

  it("throws an error when the insert returns an error", async () => {
    const insert = vi.fn().mockResolvedValue({ error: new Error("db error") });
    const from = vi.fn().mockReturnValue({ insert });
    const client = { from } as unknown as SupabaseClient;

    await expect(createProduct(client, sampleProduct)).rejects.toThrow("db error");
  });
});

describe("updateProduct", () => {
  it("updates the row matching the product's id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    const client = { from } as unknown as SupabaseClient;

    await updateProduct(client, sampleProduct);

    expect(from).toHaveBeenCalledWith("products");
    expect(update).toHaveBeenCalledWith(sampleRow);
    expect(eq).toHaveBeenCalledWith("id", "test-cookie");
  });

  it("throws an error when the update returns an error", async () => {
    const eq = vi.fn().mockResolvedValue({ error: new Error("db error") });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    const client = { from } as unknown as SupabaseClient;

    await expect(updateProduct(client, sampleProduct)).rejects.toThrow("db error");
  });
});

describe("deleteProduct", () => {
  it("deletes the row matching the given id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ delete: del });
    const client = { from } as unknown as SupabaseClient;

    await deleteProduct(client, "test-cookie");

    expect(from).toHaveBeenCalledWith("products");
    expect(del).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", "test-cookie");
  });

  it("throws an error when the delete returns an error", async () => {
    const eq = vi.fn().mockResolvedValue({ error: new Error("db error") });
    const del = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ delete: del });
    const client = { from } as unknown as SupabaseClient;

    await expect(deleteProduct(client, "test-cookie")).rejects.toThrow("db error");
  });
});

describe("getFeaturedProducts", () => {
  it("returns only active products with badge 'mais_vendido'", () => {
    const products: Product[] = [
      {
        id: "a",
        name: "A",
        description: "A desc",
        price: 10,
        imageUrl: "/products/a.jpg",
        category: "destaque",
        badge: "mais_vendido",
        stockToday: null,
        active: true,
      },
      {
        id: "b",
        name: "B",
        description: "B desc",
        price: 11,
        imageUrl: "/products/b.jpg",
        category: "cookie",
        badge: "novo",
        stockToday: null,
        active: true,
      },
      {
        id: "c",
        name: "C",
        description: "C desc",
        price: 12,
        imageUrl: "/products/c.jpg",
        category: "destaque",
        badge: "mais_vendido",
        stockToday: null,
        active: false,
      },
    ];

    expect(getFeaturedProducts(products)).toEqual([products[0]]);
  });

  it("returns an empty array when no product matches", () => {
    const products: Product[] = [
      {
        id: "a",
        name: "A",
        description: "A desc",
        price: 10,
        imageUrl: "/products/a.jpg",
        category: "destaque",
        badge: "novo",
        stockToday: null,
        active: true,
      },
    ];

    expect(getFeaturedProducts(products)).toEqual([]);
  });
});

import { describe, it, expect, vi } from "vitest";
import { saveOrder, getRecentOrders } from "./orders";
import { SupabaseClient } from "@supabase/supabase-js";
import { CartItem, OrderDetails, Order } from "./types";

function mockClient(error: unknown = null) {
  const insert = vi.fn().mockResolvedValue({ error });
  const from = vi.fn().mockReturnValue({ insert });
  return { from } as unknown as SupabaseClient;
}

const cart: CartItem[] = [
  { productId: "big-apple-choc-chunk", name: "Big Apple Choc Chunk", price: 12.9, qty: 2 },
  { productId: "brooklyn-red-velvet", name: "Brooklyn Red Velvet", price: 13.9, qty: 1 },
];

const order: OrderDetails = {
  customerName: "Maria Silva",
  whatsapp: "5511999998888",
  pickupTime: "18:30",
  deliveryType: "retirada",
  paymentMethod: "pix",
  notes: "Sem nozes, por favor",
};

describe("saveOrder", () => {
  it("inserts a row into the orders table with mapped fields", async () => {
    const client = mockClient();

    await saveOrder(client, cart, order, 39.7);

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    expect(fromMock).toHaveBeenCalledWith("orders");

    const insertMock = fromMock.mock.results[0].value.insert as ReturnType<typeof vi.fn>;
    expect(insertMock).toHaveBeenCalledWith({
      customer_name: "Maria Silva",
      whatsapp: "5511999998888",
      pickup_time: "18:30",
      delivery_type: "retirada",
      payment_method: "pix",
      notes: "Sem nozes, por favor",
      items: [
        { product_id: "big-apple-choc-chunk", name: "Big Apple Choc Chunk", qty: 2, price: 12.9 },
        { product_id: "brooklyn-red-velvet", name: "Brooklyn Red Velvet", qty: 1, price: 13.9 },
      ],
      total: 39.7,
    });
  });

  it("maps a missing notes field to null", async () => {
    const client = mockClient();

    await saveOrder(client, cart, { ...order, notes: undefined }, 39.7);

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    const insertMock = fromMock.mock.results[0].value.insert as ReturnType<typeof vi.fn>;
    const insertedRow = insertMock.mock.calls[0][0] as { notes: unknown };
    expect(insertedRow.notes).toBeNull();
  });

  it("throws an error when the insert returns an error", async () => {
    const client = mockClient(new Error("db error"));

    await expect(saveOrder(client, cart, order, 39.7)).rejects.toThrow("db error");
  });
});

function mockSelectClient(rows: unknown[] | null, error: unknown = null) {
  const limit = vi.fn().mockResolvedValue({ data: rows, error });
  const order = vi.fn().mockReturnValue({ limit });
  const select = vi.fn().mockReturnValue({ order });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as SupabaseClient;
}

const orderRow = {
  id: "11111111-1111-1111-1111-111111111111",
  customer_name: "Maria Silva",
  whatsapp: "5511999998888",
  pickup_time: "18:30",
  delivery_type: "retirada",
  payment_method: "pix",
  notes: "Sem nozes, por favor",
  items: [
    { product_id: "big-apple-choc-chunk", name: "Big Apple Choc Chunk", qty: 2, price: 12.9 },
    { product_id: "brooklyn-red-velvet", name: "Brooklyn Red Velvet", qty: 1, price: 13.9 },
  ],
  total: 39.7,
  created_at: "2026-06-10T18:00:00.000Z",
};

const mappedOrder: Order = {
  id: "11111111-1111-1111-1111-111111111111",
  customerName: "Maria Silva",
  whatsapp: "5511999998888",
  pickupTime: "18:30",
  deliveryType: "retirada",
  paymentMethod: "pix",
  notes: "Sem nozes, por favor",
  items: [
    { productId: "big-apple-choc-chunk", name: "Big Apple Choc Chunk", qty: 2, price: 12.9 },
    { productId: "brooklyn-red-velvet", name: "Brooklyn Red Velvet", qty: 1, price: 13.9 },
  ],
  total: 39.7,
  createdAt: "2026-06-10T18:00:00.000Z",
};

describe("getRecentOrders", () => {
  it("maps database rows to Order objects, ordered by most recent", async () => {
    const client = mockSelectClient([orderRow]);

    const orders = await getRecentOrders(client);

    expect(orders).toEqual([mappedOrder]);

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    expect(fromMock).toHaveBeenCalledWith("orders");

    const selectMock = fromMock.mock.results[0].value.select as ReturnType<typeof vi.fn>;
    expect(selectMock).toHaveBeenCalledWith("*");

    const orderMock = selectMock.mock.results[0].value.order as ReturnType<typeof vi.fn>;
    expect(orderMock).toHaveBeenCalledWith("created_at", { ascending: false });

    const limitMock = orderMock.mock.results[0].value.limit as ReturnType<typeof vi.fn>;
    expect(limitMock).toHaveBeenCalledWith(50);
  });

  it("maps a null notes field through unchanged", async () => {
    const client = mockSelectClient([{ ...orderRow, notes: null }]);

    const orders = await getRecentOrders(client);

    expect(orders[0].notes).toBeNull();
  });

  it("respects a custom limit", async () => {
    const client = mockSelectClient([]);

    await getRecentOrders(client, 10);

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    const selectMock = fromMock.mock.results[0].value.select as ReturnType<typeof vi.fn>;
    const orderMock = selectMock.mock.results[0].value.order as ReturnType<typeof vi.fn>;
    const limitMock = orderMock.mock.results[0].value.limit as ReturnType<typeof vi.fn>;
    expect(limitMock).toHaveBeenCalledWith(10);
  });

  it("throws an error when the query returns an error", async () => {
    const client = mockSelectClient(null, new Error("db error"));

    await expect(getRecentOrders(client)).rejects.toThrow("db error");
  });
});

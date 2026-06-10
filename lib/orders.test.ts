import { describe, it, expect, vi } from "vitest";
import { saveOrder } from "./orders";
import { SupabaseClient } from "@supabase/supabase-js";
import { CartItem, OrderDetails } from "./types";

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

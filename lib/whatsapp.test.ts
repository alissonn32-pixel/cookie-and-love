import { describe, it, expect } from "vitest";
import { buildOrderMessage, buildWhatsAppLink } from "./whatsapp";
import { CartItem, OrderDetails } from "./types";

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

describe("buildOrderMessage", () => {
  it("includes each item with quantity and subtotal", () => {
    const message = buildOrderMessage(cart, order, 39.7);
    expect(message).toContain("2x Big Apple Choc Chunk - R$ 25.80");
    expect(message).toContain("1x Brooklyn Red Velvet - R$ 13.90");
  });

  it("includes the total, customer name, pickup time, delivery type and payment method", () => {
    const message = buildOrderMessage(cart, order, 39.7);
    expect(message).toContain("Total: R$ 39.70");
    expect(message).toContain("Maria Silva");
    expect(message).toContain("18:30");
    expect(message).toContain("Retirada");
    expect(message).toContain("Pix");
  });

  it("includes notes when present and omits the notes line when absent", () => {
    const withNotes = buildOrderMessage(cart, order, 39.7);
    expect(withNotes).toContain("Sem nozes, por favor");

    const withoutNotes = buildOrderMessage(cart, { ...order, notes: undefined }, 39.7);
    expect(withoutNotes).not.toContain("Observações:");
  });
});

describe("buildWhatsAppLink", () => {
  it("builds a wa.me link with the URL-encoded message", () => {
    const link = buildWhatsAppLink("5500000000000", "Olá! Pedido: 1x Cookie");
    expect(link).toBe(
      "https://wa.me/5500000000000?text=Ol%C3%A1!%20Pedido%3A%201x%20Cookie"
    );
  });
});

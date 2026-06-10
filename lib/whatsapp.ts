import { CartItem, OrderDetails, DeliveryType, PaymentMethod } from "./types";

const DELIVERY_LABELS: Record<DeliveryType, string> = {
  retirada: "Retirada",
  entrega: "Entrega",
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
};

export function buildOrderMessage(
  cart: CartItem[],
  order: OrderDetails,
  total: number
): string {
  const lines: string[] = [];

  lines.push("Olá! Gostaria de fazer o seguinte pedido:");
  lines.push("");

  for (const item of cart) {
    const subtotal = (item.price * item.qty).toFixed(2);
    lines.push(`${item.qty}x ${item.name} - R$ ${subtotal}`);
  }

  lines.push("");
  lines.push(`Total: R$ ${total.toFixed(2)}`);
  lines.push("");
  lines.push(`Nome: ${order.customerName}`);
  lines.push(`Horário desejado: ${order.pickupTime}`);
  lines.push(`Entrega: ${DELIVERY_LABELS[order.deliveryType]}`);
  lines.push(`Pagamento: ${PAYMENT_LABELS[order.paymentMethod]}`);

  if (order.notes) {
    lines.push(`Observações: ${order.notes}`);
  }

  return lines.join("\n");
}

export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

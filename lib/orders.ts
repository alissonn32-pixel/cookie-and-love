import { SupabaseClient } from "@supabase/supabase-js";
import { CartItem, OrderDetails } from "./types";

export async function saveOrder(
  client: SupabaseClient,
  cart: CartItem[],
  order: OrderDetails,
  total: number
): Promise<void> {
  const { error } = await client.from("orders").insert({
    customer_name: order.customerName,
    whatsapp: order.whatsapp,
    pickup_time: order.pickupTime,
    delivery_type: order.deliveryType,
    payment_method: order.paymentMethod,
    notes: order.notes ?? null,
    items: cart.map((item) => ({
      product_id: item.productId,
      name: item.name,
      qty: item.qty,
      price: item.price,
    })),
    total,
  });

  if (error) {
    throw new Error(error.message);
  }
}

import { SupabaseClient } from "@supabase/supabase-js";
import { CartItem, OrderDetails, Order, OrderItem, DeliveryType, PaymentMethod } from "./types";

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

interface OrderRow {
  id: string;
  customer_name: string;
  whatsapp: string;
  pickup_time: string;
  delivery_type: DeliveryType;
  payment_method: PaymentMethod;
  notes: string | null;
  items: { product_id: string; name: string; qty: number; price: number }[];
  total: number;
  created_at: string;
}

function mapOrderRow(row: OrderRow): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    whatsapp: row.whatsapp,
    pickupTime: row.pickup_time,
    deliveryType: row.delivery_type,
    paymentMethod: row.payment_method,
    notes: row.notes,
    items: row.items.map(
      (item): OrderItem => ({
        productId: item.product_id,
        name: item.name,
        qty: item.qty,
        price: item.price,
      })
    ),
    total: row.total,
    createdAt: row.created_at,
  };
}

export async function getRecentOrders(client: SupabaseClient, limit = 50): Promise<Order[]> {
  const { data, error } = await client
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data as OrderRow[]).map(mapOrderRow);
}

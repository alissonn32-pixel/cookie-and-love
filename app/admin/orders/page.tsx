import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRecentOrders } from "@/lib/orders";

const deliveryLabels: Record<string, string> = {
  retirada: "Retirada",
  entrega: "Entrega",
};

const paymentLabels: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function AdminOrdersPage() {
  const client = await createClient();
  const orders = await getRecentOrders(client);

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-bold text-xl">Pedidos</h1>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-taupe">Nenhum pedido recebido ainda.</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => (
            <li key={order.id} className="border border-beige rounded">
              <details className="text-sm">
                <summary className="flex justify-between items-center px-3 py-2 cursor-pointer">
                  <span className="font-bold">{order.customerName}</span>
                  <span className="text-xs text-taupe">
                    {formatDate(order.createdAt)} - R$ {order.total.toFixed(2)}
                  </span>
                </summary>
                <div className="px-3 pb-3 space-y-2 border-t border-beige pt-2">
                  <ul className="space-y-1">
                    {order.items.map((item) => (
                      <li key={item.productId} className="flex justify-between text-xs">
                        <span>
                          {item.qty}x {item.name}
                        </span>
                        <span>R$ {(item.price * item.qty).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-taupe">
                    {deliveryLabels[order.deliveryType] ?? order.deliveryType} - {paymentLabels[order.paymentMethod] ?? order.paymentMethod} - Retirada/entrega: {order.pickupTime}
                  </p>
                  <p className="text-xs text-taupe">WhatsApp: {order.whatsapp}</p>
                  {order.notes && <p className="text-xs text-taupe">Obs: {order.notes}</p>}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      <Link href="/admin" className="block mt-6 text-xs underline text-taupe">
        Voltar ao painel
      </Link>
    </main>
  );
}

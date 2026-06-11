import { StoreSettings } from "@/lib/types";

export function InfoBar({ settings }: { settings: StoreSettings }) {
  return (
    <div className="flex gap-2 flex-nowrap overflow-x-auto px-6 mt-4 lg:px-12">
      <span className="border border-beige text-brown text-[10px] px-3 py-1.5 rounded-full tracking-wide whitespace-nowrap">
        ⏱ ~{settings.prepTimeMinutes} MIN
      </span>
      {settings.deliveryOptions.includes("retirada") && (
        <span className="border border-beige text-brown text-[10px] px-3 py-1.5 rounded-full tracking-wide whitespace-nowrap">
          📍 RETIRADA
        </span>
      )}
      {settings.deliveryOptions.includes("entrega") && (
        <span className="border border-beige text-brown text-[10px] px-3 py-1.5 rounded-full tracking-wide whitespace-nowrap">
          🛵 ENTREGA
        </span>
      )}
      <span className="border border-beige text-brown text-[10px] px-3 py-1.5 rounded-full tracking-wide whitespace-nowrap">
        {settings.minOrderValue > 0
          ? `PEDIDO MÍNIMO R$ ${settings.minOrderValue.toFixed(2)}`
          : "SEM PEDIDO MÍNIMO"}
      </span>
    </div>
  );
}

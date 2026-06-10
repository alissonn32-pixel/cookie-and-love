import { StoreSettings } from "@/lib/types";

export function InfoBar({ settings }: { settings: StoreSettings }) {
  return (
    <div className="flex gap-2 flex-wrap px-6 mt-4">
      <span className="border border-beige text-brown text-[10px] px-3 py-1.5 rounded-full tracking-wide">
        ⏱ ~{settings.prepTimeMinutes} MIN
      </span>
      {settings.deliveryOptions.includes("retirada") && (
        <span className="border border-beige text-brown text-[10px] px-3 py-1.5 rounded-full tracking-wide">
          📍 RETIRADA
        </span>
      )}
      {settings.deliveryOptions.includes("entrega") && (
        <span className="border border-beige text-brown text-[10px] px-3 py-1.5 rounded-full tracking-wide">
          🛵 ENTREGA
        </span>
      )}
      <span className="border border-beige text-brown text-[10px] px-3 py-1.5 rounded-full tracking-wide">
        {settings.minOrderValue > 0
          ? `PEDIDO MÍNIMO R$ ${settings.minOrderValue.toFixed(2)}`
          : "SEM PEDIDO MÍNIMO"}
      </span>
    </div>
  );
}

"use client";

import { useState } from "react";
import { CartItem, DeliveryType, OrderDetails, PaymentMethod, StoreSettings } from "@/lib/types";
import { buildOrderMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { isStoreOpen, meetsMinimumOrder, minimumOrderShortfall } from "@/lib/validation";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
};

const DELIVERY_LABELS: Record<DeliveryType, string> = {
  retirada: "Retirada",
  entrega: "Entrega",
};

export function CheckoutModal({
  cart,
  total,
  settings,
  onClose,
}: {
  cart: CartItem[];
  total: number;
  settings: StoreSettings;
  onClose: () => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(settings.deliveryOptions[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(settings.paymentMethods[0]);
  const [notes, setNotes] = useState("");

  const storeOpen = isStoreOpen(settings);
  const minimumMet = meetsMinimumOrder(total, settings);
  const shortfall = minimumOrderShortfall(total, settings);

  const canSubmit =
    storeOpen && minimumMet && customerName.trim() !== "" && whatsapp.trim() !== "" && pickupTime.trim() !== "";

  function handleSubmit() {
    const order: OrderDetails = {
      customerName,
      whatsapp,
      pickupTime,
      deliveryType,
      paymentMethod,
      notes: notes.trim() === "" ? undefined : notes.trim(),
    };
    const message = buildOrderMessage(cart, order, total);
    const link = buildWhatsAppLink(settings.whatsappTarget, message);
    window.open(link, "_blank");
  }

  return (
    <div className="fixed inset-0 bg-brown/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-cream w-full sm:max-w-md sm:rounded-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display font-bold text-xl">Revisar pedido</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-taupe text-xl">
            ×
          </button>
        </div>

        {!storeOpen && (
          <p className="bg-beige text-brown text-xs px-3 py-2 rounded mb-3">
            Loja fechada no momento. Não é possível finalizar o pedido agora.
          </p>
        )}

        {storeOpen && !minimumMet && (
          <p className="bg-beige text-brown text-xs px-3 py-2 rounded mb-3">
            Faltam R$ {shortfall.toFixed(2)} para atingir o pedido mínimo de R$ {settings.minOrderValue.toFixed(2)}.
          </p>
        )}

        <div className="space-y-3">
          <label className="block text-xs">
            Nome
            <input
              className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </label>

          <label className="block text-xs">
            WhatsApp
            <input
              className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 99999-8888"
            />
          </label>

          <label className="block text-xs">
            Horário desejado
            <input
              className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              placeholder="18:30"
            />
          </label>

          <fieldset className="text-xs">
            <legend className="mb-1">Entrega</legend>
            <div className="flex gap-3">
              {settings.deliveryOptions.map((option) => (
                <label key={option} className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="deliveryType"
                    checked={deliveryType === option}
                    onChange={() => setDeliveryType(option)}
                  />
                  {DELIVERY_LABELS[option]}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="text-xs">
            <legend className="mb-1">Pagamento</legend>
            <div className="flex gap-3 flex-wrap">
              {settings.paymentMethods.map((option) => (
                <label key={option} className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === option}
                    onChange={() => setPaymentMethod(option)}
                  />
                  {PAYMENT_LABELS[option]}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block text-xs">
            Observações (opcional)
            <textarea
              className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </label>
        </div>

        <div className="mt-4 flex justify-between items-center font-mono font-bold text-sm">
          <span>Total</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-4 w-full bg-brown text-cream rounded py-3 text-sm font-bold disabled:opacity-40"
        >
          Revisar e enviar no WhatsApp
        </button>
      </div>
    </div>
  );
}

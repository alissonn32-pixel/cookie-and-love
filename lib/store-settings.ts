import { StoreSettings } from "./types";

export const storeSettings: StoreSettings = {
  isOpen: true,
  prepTimeMinutes: 40,
  minOrderValue: 0,
  heroText: "Crocante por fora, derretendo por dentro.",
  whatsappTarget: "5500000000000",
  paymentMethods: ["pix", "dinheiro", "cartao"],
  deliveryOptions: ["retirada", "entrega"],
  tabs: [
    { id: "destaques", label: "Destaques" },
    { id: "cookies", label: "Cookies" },
    { id: "especiais", label: "Especiais da casa" },
    { id: "avaliacoes", label: "Avaliações" },
    { id: "informacoes", label: "Informações" },
  ],
};

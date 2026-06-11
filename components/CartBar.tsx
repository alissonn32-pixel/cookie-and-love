import { CartItem } from "@/lib/types";

export function CartBar({
  cart,
  total,
  onReview,
}: {
  cart: CartItem[];
  total: number;
  onReview: () => void;
}) {
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  if (itemCount === 0) {
    return (
      <div className="sticky bottom-0 mx-6 mb-5 bg-white border border-beige rounded-md px-4 py-3 text-center text-xs text-taupe lg:hidden">
        Seu carrinho está vazio. Adicione cookies para começar! 🍪
      </div>
    );
  }

  return (
    <button
      onClick={onReview}
      className="sticky bottom-0 mx-6 mb-5 bg-brown text-cream rounded-md px-4 py-3.5 flex justify-between items-center font-mono font-bold text-xs shadow-lg w-[calc(100%-3rem)] lg:hidden"
    >
      <span>
        🛍 {itemCount} {itemCount === 1 ? "ITEM" : "ITENS"} NA SACOLA
      </span>
      <span className="text-caramel">R$ {total.toFixed(2)} →</span>
    </button>
  );
}

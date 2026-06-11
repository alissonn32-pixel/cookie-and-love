import { CartItem } from "@/lib/types";

export function OrderSidebar({
  cart,
  total,
  onSetQty,
  onReview,
}: {
  cart: CartItem[];
  total: number;
  onSetQty: (productId: string, qty: number) => void;
  onReview: () => void;
}) {
  return (
    <div className="hidden lg:block lg:w-80 lg:sticky lg:top-6 lg:self-start bg-white border border-beige rounded-md p-4">
      <h2 className="font-display font-bold text-lg">Meu pedido</h2>

      {cart.length === 0 ? (
        <div className="text-center mt-6">
          <span className="text-5xl">🍪</span>
          <p className="text-xs text-taupe mt-3">
            Seu carrinho está vazio. Escolha seus cookies favoritos e monte
            seu pedido.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mt-3">
            {cart.map((item) => (
              <div
                key={item.productId}
                className="flex justify-between items-center gap-2"
              >
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-taupe font-mono">
                    R$ {item.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSetQty(item.productId, item.qty - 1)}
                    className="bg-brown text-cream text-xs w-6 h-6 rounded"
                    aria-label={`Remover ${item.name}`}
                  >
                    −
                  </button>
                  <span className="font-mono text-xs">{item.qty}</span>
                  <button
                    onClick={() => onSetQty(item.productId, item.qty + 1)}
                    className="bg-brown text-cream text-xs w-6 h-6 rounded"
                    aria-label={`Adicionar ${item.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-beige flex justify-between font-mono font-bold text-sm">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>

          <button
            onClick={onReview}
            className="mt-3 w-full bg-brown text-cream rounded py-2.5 text-xs font-bold"
          >
            Revisar pedido
          </button>
        </>
      )}
    </div>
  );
}

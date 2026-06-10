import { Product } from "@/lib/types";

const BADGE_LABELS: Record<NonNullable<Product["badge"]>, string> = {
  novo: "NOVO",
  mais_vendido: "MAIS VENDIDO",
};

export function ProductCard({
  product,
  qty,
  onAdd,
  onRemove,
}: {
  product: Product;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const soldOut = product.stockToday === 0;

  return (
    <div className="bg-white rounded-md overflow-hidden border border-[#f0e0cd] shadow-sm">
      <div className="h-28 relative bg-gradient-to-br from-[#d9a05b] via-[#a85f2c] to-[#6b3a17] flex items-center justify-center text-5xl">
        🍪
        {product.badge && !soldOut && (
          <span className="absolute top-2 right-2 bg-brown text-cream text-[9px] px-2 py-1 rounded-full tracking-widest">
            {BADGE_LABELS[product.badge]}
          </span>
        )}
        {soldOut && (
          <span className="absolute top-2 right-2 bg-taupe text-cream text-[9px] px-2 py-1 rounded-full tracking-widest">
            ESGOTADO
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-display font-semibold text-base">{product.name}</h3>
        <p className="text-[10px] text-taupe uppercase tracking-wide my-1.5">
          {product.description}
        </p>
        <div className="flex justify-between items-center">
          <span className="font-mono font-bold text-sm">
            R$ {product.price.toFixed(2)}
          </span>
          {soldOut ? (
            <span className="text-[11px] text-taupe">Indisponível</span>
          ) : qty > 0 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onRemove}
                className="bg-brown text-cream text-xs w-6 h-6 rounded"
                aria-label={`Remover ${product.name}`}
              >
                −
              </button>
              <span className="font-mono text-xs">{qty}</span>
              <button
                onClick={onAdd}
                className="bg-brown text-cream text-xs w-6 h-6 rounded"
                aria-label={`Adicionar ${product.name}`}
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={onAdd}
              className="bg-brown text-cream text-[11px] px-3 py-1.5 rounded"
            >
              Adicionar +
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

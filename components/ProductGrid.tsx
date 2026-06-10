import { CartItem, Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  cart,
  onAdd,
  onRemove,
}: {
  products: Product[];
  cart: CartItem[];
  onAdd: (product: Product) => void;
  onRemove: (productId: string) => void;
}) {
  if (products.length === 0) {
    return (
      <p className="px-6 py-8 text-sm text-taupe">
        Nenhum produto disponível nesta categoria no momento.
      </p>
    );
  }

  return (
    <div className="px-6 py-5 grid grid-cols-2 gap-3.5">
      {products.map((product) => {
        const cartItem = cart.find((item) => item.productId === product.id);
        return (
          <ProductCard
            key={product.id}
            product={product}
            qty={cartItem?.qty ?? 0}
            onAdd={() => onAdd(product)}
            onRemove={() => onRemove(product.id)}
          />
        );
      })}
    </div>
  );
}

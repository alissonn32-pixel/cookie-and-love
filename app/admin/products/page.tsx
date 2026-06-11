import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllProducts } from "@/lib/products";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

export default async function AdminProductsPage() {
  const client = await createClient();
  const products = await getAllProducts(client);

  return (
    <main className="max-w-2xl mx-auto p-6 lg:max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-bold text-xl">Produtos</h1>
        <Link href="/admin/products/new" className="text-xs underline text-taupe">
          Novo produto
        </Link>
      </div>

      <ul className="space-y-2">
        {products.map((product) => (
          <li
            key={product.id}
            className="flex justify-between items-center border border-beige rounded px-3 py-2 text-sm"
          >
            <div>
              <p className="font-bold">{product.name}</p>
              <p className="text-xs text-taupe">
                {product.category} - R$ {product.price.toFixed(2)}
                {!product.active && " - inativo"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/admin/products/${product.id}/edit`} className="text-xs underline text-taupe">
                Editar
              </Link>
              <DeleteProductButton productId={product.id} />
            </div>
          </li>
        ))}
      </ul>

      <Link href="/admin" className="block mt-6 text-xs underline text-taupe">
        Voltar ao painel
      </Link>
    </main>
  );
}

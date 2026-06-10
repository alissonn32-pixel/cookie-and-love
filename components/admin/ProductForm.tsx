"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createProduct, updateProduct } from "@/lib/products";
import { slugify } from "@/lib/slugify";
import { Product, ProductBadge, ProductCategory } from "@/lib/types";

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const isEditing = product !== undefined;
  const router = useRouter();

  const [id, setId] = useState(product?.id ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? "cookie");
  const [badge, setBadge] = useState<ProductBadge>(product?.badge ?? null);
  const [stockToday, setStockToday] = useState(
    product?.stockToday === null || product?.stockToday === undefined ? "" : String(product.stockToday)
  );
  const [active, setActive] = useState(product?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!isEditing) {
      setId(slugify(value));
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payload: Product = {
      id,
      name,
      description,
      price: Number(price),
      imageUrl,
      category,
      badge,
      stockToday: stockToday === "" ? null : Number(stockToday),
      active,
    };

    try {
      const client = createClient();
      if (isEditing) {
        await updateProduct(client, payload);
      } else {
        await createProduct(client, payload);
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar produto.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error && <p className="bg-beige text-brown text-xs px-3 py-2 rounded">{error}</p>}

      <label className="block text-xs">
        Nome
        <input
          type="text"
          className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          required
        />
      </label>

      <label className="block text-xs">
        ID (slug)
        <input
          type="text"
          className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm disabled:bg-beige/50"
          value={id}
          onChange={(event) => setId(event.target.value)}
          disabled={isEditing}
          required
        />
      </label>

      <label className="block text-xs">
        Descrição
        <textarea
          className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />
      </label>

      <label className="block text-xs">
        Preço
        <input
          type="number"
          step="0.01"
          min="0"
          className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          required
        />
      </label>

      <label className="block text-xs">
        URL da imagem
        <input
          type="text"
          className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="/products/novo-cookie.jpg"
          required
        />
      </label>

      <label className="block text-xs">
        Categoria
        <select
          className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
          value={category}
          onChange={(event) => setCategory(event.target.value as ProductCategory)}
        >
          <option value="destaque">Destaque</option>
          <option value="cookie">Cookie</option>
          <option value="especial">Especial</option>
        </select>
      </label>

      <label className="block text-xs">
        Selo
        <select
          className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
          value={badge ?? ""}
          onChange={(event) =>
            setBadge(event.target.value === "" ? null : (event.target.value as ProductBadge))
          }
        >
          <option value="">Nenhum</option>
          <option value="novo">Novo</option>
          <option value="mais_vendido">Mais vendido</option>
        </select>
      </label>

      <label className="block text-xs">
        Estoque hoje (deixe em branco para ilimitado)
        <input
          type="number"
          min="0"
          className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
          value={stockToday}
          onChange={(event) => setStockToday(event.target.value)}
        />
      </label>

      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
        Ativo (visível na loja)
      </label>

      <button
        type="submit"
        disabled={loading}
        className="bg-brown text-cream rounded py-3 px-6 text-sm font-bold disabled:opacity-40"
      >
        {loading ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}

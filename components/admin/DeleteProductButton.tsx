"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteProduct } from "@/lib/products";

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) {
      return;
    }

    const client = createClient();
    await deleteProduct(client, productId);
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="text-xs underline text-taupe">
      Excluir
    </button>
  );
}

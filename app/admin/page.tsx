import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="max-w-md mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-bold text-xl">Painel administrativo</h1>
        <LogoutButton />
      </div>
      <p className="text-sm text-taupe mb-6">Logado como {user?.email}</p>
      <nav className="space-y-2">
        <Link href="/admin/products" className="block text-sm underline text-brown">
          Gerenciar produtos
        </Link>
        <Link href="/admin/orders" className="block text-sm underline text-brown">
          Ver pedidos
        </Link>
        <Link href="/admin/reviews" className="block text-sm underline text-brown">
          Gerenciar avaliações
        </Link>
      </nav>
    </main>
  );
}

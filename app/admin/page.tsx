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
      <p className="text-sm text-taupe">Logado como {user?.email}</p>
    </main>
  );
}

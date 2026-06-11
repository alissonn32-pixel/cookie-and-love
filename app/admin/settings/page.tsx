import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStoreSettings } from "@/lib/store-settings";
import { StoreSettingsForm } from "@/components/admin/StoreSettingsForm";

export default async function StoreSettingsPage() {
  const client = await createClient();
  const settings = await getStoreSettings(client);

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="font-display font-bold text-xl mb-6">Configurações da loja</h1>
      <StoreSettingsForm settings={settings} />
      <Link href="/admin" className="block text-sm underline text-brown mt-6">
        Voltar ao painel
      </Link>
    </main>
  );
}

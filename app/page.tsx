import { HomeClient } from "@/components/HomeClient";
import { createSupabaseClient } from "@/lib/supabase";
import { getProducts } from "@/lib/products";
import { getStoreSettings } from "@/lib/store-settings";

export const revalidate = 60;

export default async function Home() {
  const client = createSupabaseClient();
  const [products, storeSettings] = await Promise.all([
    getProducts(client),
    getStoreSettings(client),
  ]);

  return <HomeClient products={products} storeSettings={storeSettings} />;
}

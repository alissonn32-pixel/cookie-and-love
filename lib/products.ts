import { SupabaseClient } from "@supabase/supabase-js";
import { Product, ProductCategory, ProductBadge } from "./types";

interface ProductRow {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: ProductCategory;
  badge: ProductBadge;
  stock_today: number | null;
  active: boolean;
}

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    imageUrl: row.image_url,
    category: row.category,
    badge: row.badge,
    stockToday: row.stock_today,
    active: row.active,
  };
}

export async function getProducts(client: SupabaseClient): Promise<Product[]> {
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("active", true)
    .order("category");

  if (error) {
    throw new Error(error.message);
  }

  return (data as ProductRow[]).map(mapRow);
}

export async function getAllProducts(client: SupabaseClient): Promise<Product[]> {
  const { data, error } = await client.from("products").select("*").order("category");

  if (error) {
    throw new Error(error.message);
  }

  return (data as ProductRow[]).map(mapRow);
}

export async function getProductById(client: SupabaseClient, id: string): Promise<Product | null> {
  const { data, error } = await client.from("products").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapRow(data as ProductRow) : null;
}

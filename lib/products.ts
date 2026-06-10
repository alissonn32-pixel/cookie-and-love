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

function toRow(product: Product): ProductRow {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    image_url: product.imageUrl,
    category: product.category,
    badge: product.badge,
    stock_today: product.stockToday,
    active: product.active,
  };
}

export function getFeaturedProducts(products: Product[]): Product[] {
  return products.filter((p) => p.active && p.badge === "mais_vendido");
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

export async function createProduct(client: SupabaseClient, product: Product): Promise<void> {
  const { error } = await client.from("products").insert(toRow(product));

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateProduct(client: SupabaseClient, product: Product): Promise<void> {
  const { error } = await client.from("products").update(toRow(product)).eq("id", product.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteProduct(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("products").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

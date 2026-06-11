import { SupabaseClient } from "@supabase/supabase-js";
import { Review } from "./types";

interface ReviewRow {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
}

function mapReviewRow(row: ReviewRow): Review {
  return {
    id: row.id,
    customerName: row.customer_name,
    rating: row.rating,
    comment: row.comment,
    approved: row.approved,
    createdAt: row.created_at,
  };
}

export async function getAllReviews(client: SupabaseClient): Promise<Review[]> {
  const { data, error } = await client
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as ReviewRow[]).map(mapReviewRow);
}

export async function setReviewApproved(
  client: SupabaseClient,
  id: string,
  approved: boolean
): Promise<void> {
  const { error } = await client.from("reviews").update({ approved }).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

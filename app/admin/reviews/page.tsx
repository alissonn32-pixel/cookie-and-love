import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllReviews } from "@/lib/reviews";
import { ReviewApprovalButton } from "@/components/admin/ReviewApprovalButton";
import { Review } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function stars(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function ReviewListItem({ review }: { review: Review }) {
  return (
    <li className="border border-beige rounded px-3 py-2 text-sm">
      <div className="flex justify-between items-center">
        <span className="font-bold">{review.customerName}</span>
        <span className="text-xs text-taupe">{formatDate(review.createdAt)}</span>
      </div>
      <p className="text-taupe text-xs mt-1">{stars(review.rating)}</p>
      <p className="mt-1">{review.comment}</p>
      <div className="mt-2">
        <ReviewApprovalButton reviewId={review.id} approved={review.approved} />
      </div>
    </li>
  );
}

export default async function AdminReviewsPage() {
  const client = await createClient();
  const reviews = await getAllReviews(client);

  const pending = reviews.filter((review) => !review.approved);
  const approved = reviews.filter((review) => review.approved);

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-bold text-xl">Avaliações</h1>
      </div>

      <section className="mb-8">
        <h2 className="font-display font-bold text-sm mb-2">Pendentes</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-taupe">Nenhuma avaliação pendente.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((review) => (
              <ReviewListItem key={review.id} review={review} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display font-bold text-sm mb-2">Aprovadas</h2>
        {approved.length === 0 ? (
          <p className="text-sm text-taupe">Nenhuma avaliação aprovada.</p>
        ) : (
          <ul className="space-y-2">
            {approved.map((review) => (
              <ReviewListItem key={review.id} review={review} />
            ))}
          </ul>
        )}
      </section>

      <Link href="/admin" className="block mt-6 text-xs underline text-taupe">
        Voltar ao painel
      </Link>
    </main>
  );
}

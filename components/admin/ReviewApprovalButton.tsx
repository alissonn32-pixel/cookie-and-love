"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setReviewApproved } from "@/lib/reviews";

interface ReviewApprovalButtonProps {
  reviewId: string;
  approved: boolean;
}

export function ReviewApprovalButton({ reviewId, approved }: ReviewApprovalButtonProps) {
  const router = useRouter();

  async function handleClick() {
    const client = createClient();
    await setReviewApproved(client, reviewId, !approved);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      className={approved ? "text-xs underline text-taupe" : "text-xs underline text-brown"}
    >
      {approved ? "Ocultar" : "Aprovar"}
    </button>
  );
}

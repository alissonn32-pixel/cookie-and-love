# Reviews Admin (Moderação de Avaliações) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `/admin/reviews` page where the store owner can moderate customer reviews stored in the existing `reviews` table — approving pending reviews and hiding previously-approved ones.

**Architecture:** A new RLS migration grants authenticated (admin) users read+update access to `reviews`. A pure data layer (`lib/reviews.ts`) maps `snake_case` rows to a new `Review` type and exposes `getAllReviews`/`setReviewApproved`. A server component page lists reviews split into "Pendentes"/"Aprovadas" sections, each row rendering a small client component button that toggles `approved` and refreshes the page.

**Tech Stack:** Next.js App Router, TypeScript, Supabase (Postgres + RLS), `@supabase/ssr`, Vitest.

---

### Task 1: RLS policies for admin review access

**Files:**
- Create: `supabase/migrations/0005_reviews_admin_policies.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Allow authenticated (admin) users to read and moderate reviews
create policy "Authenticated read access to reviews" on reviews
  for select
  to authenticated
  using (true);

create policy "Authenticated update access to reviews" on reviews
  for update
  to authenticated
  using (true)
  with check (true);
```

- [ ] **Step 2: Apply the migration to the Supabase project (manual)**

1. Go to https://supabase.com/dashboard and open the `cookie-and-love` project
2. Open the SQL Editor
3. Paste the contents of `supabase/migrations/0005_reviews_admin_policies.sql` and run it
4. Confirm no errors

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0005_reviews_admin_policies.sql
git commit -m "feat: add RLS policies for admin review moderation"
```

---

### Task 2: `Review` type

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add the `Review` interface**

Append to `lib/types.ts`:

```ts
export interface Review {
  id: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  approved: boolean;
  createdAt: string;
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add Review type"
```

---

### Task 3: `lib/reviews.ts` data layer (TDD)

**Files:**
- Create: `lib/reviews.ts`
- Create: `lib/reviews.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/reviews.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { getAllReviews, setReviewApproved } from "./reviews";
import { SupabaseClient } from "@supabase/supabase-js";
import { Review } from "./types";

function mockSelectClient(rows: unknown[] | null, error: unknown = null) {
  const order = vi.fn().mockResolvedValue({ data: rows, error });
  const select = vi.fn().mockReturnValue({ order });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as SupabaseClient;
}

function mockUpdateClient(error: unknown = null) {
  const eq = vi.fn().mockResolvedValue({ error });
  const update = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ update });
  return { from } as unknown as SupabaseClient;
}

const reviewRow = {
  id: "11111111-1111-1111-1111-111111111111",
  customer_name: "Maria Silva",
  rating: 5,
  comment: "Cookies maravilhosos, chegaram quentinhos!",
  approved: false,
  created_at: "2026-06-10T18:00:00.000Z",
};

const mappedReview: Review = {
  id: "11111111-1111-1111-1111-111111111111",
  customerName: "Maria Silva",
  rating: 5,
  comment: "Cookies maravilhosos, chegaram quentinhos!",
  approved: false,
  createdAt: "2026-06-10T18:00:00.000Z",
};

describe("getAllReviews", () => {
  it("maps database rows to Review objects, ordered by most recent", async () => {
    const client = mockSelectClient([reviewRow]);

    const reviews = await getAllReviews(client);

    expect(reviews).toEqual([mappedReview]);

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    expect(fromMock).toHaveBeenCalledWith("reviews");

    const selectMock = fromMock.mock.results[0].value.select as ReturnType<typeof vi.fn>;
    expect(selectMock).toHaveBeenCalledWith("*");

    const orderMock = selectMock.mock.results[0].value.order as ReturnType<typeof vi.fn>;
    expect(orderMock).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("maps an approved review through unchanged", async () => {
    const client = mockSelectClient([{ ...reviewRow, approved: true }]);

    const reviews = await getAllReviews(client);

    expect(reviews[0].approved).toBe(true);
  });

  it("throws an error when the query returns an error", async () => {
    const client = mockSelectClient(null, new Error("db error"));

    await expect(getAllReviews(client)).rejects.toThrow("db error");
  });
});

describe("setReviewApproved", () => {
  it("updates the approved field for the row matching the id", async () => {
    const client = mockUpdateClient();

    await setReviewApproved(client, "11111111-1111-1111-1111-111111111111", true);

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    expect(fromMock).toHaveBeenCalledWith("reviews");

    const updateMock = fromMock.mock.results[0].value.update as ReturnType<typeof vi.fn>;
    expect(updateMock).toHaveBeenCalledWith({ approved: true });

    const eqMock = updateMock.mock.results[0].value.eq as ReturnType<typeof vi.fn>;
    expect(eqMock).toHaveBeenCalledWith("id", "11111111-1111-1111-1111-111111111111");
  });

  it("can set approved back to false", async () => {
    const client = mockUpdateClient();

    await setReviewApproved(client, "11111111-1111-1111-1111-111111111111", false);

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    const updateMock = fromMock.mock.results[0].value.update as ReturnType<typeof vi.fn>;
    expect(updateMock).toHaveBeenCalledWith({ approved: false });
  });

  it("throws an error when the update returns an error", async () => {
    const client = mockUpdateClient(new Error("db error"));

    await expect(
      setReviewApproved(client, "11111111-1111-1111-1111-111111111111", true)
    ).rejects.toThrow("db error");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/reviews.test.ts`
Expected: FAIL with "Failed to resolve import './reviews'" (or similar — file doesn't exist yet)

- [ ] **Step 3: Implement `lib/reviews.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/reviews.test.ts`
Expected: PASS (all 7 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/reviews.ts lib/reviews.test.ts
git commit -m "feat: add reviews data layer (getAllReviews, setReviewApproved)"
```

---

### Task 4: `ReviewApprovalButton` component

**Files:**
- Create: `components/admin/ReviewApprovalButton.tsx`

- [ ] **Step 1: Create the component**

```tsx
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
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/admin/ReviewApprovalButton.tsx
git commit -m "feat: add ReviewApprovalButton component"
```

---

### Task 5: `/admin/reviews` page

**Files:**
- Create: `app/admin/reviews/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
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
```

- [ ] **Step 2: Run typecheck and full test suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: No type errors, all tests pass

- [ ] **Step 3: Commit**

```bash
git add app/admin/reviews/page.tsx
git commit -m "feat: add admin reviews moderation page"
```

---

### Task 6: Link from the dashboard

**Files:**
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: Add the "Gerenciar avaliações" link**

In `app/admin/page.tsx`, change:

```tsx
      <nav className="space-y-2">
        <Link href="/admin/products" className="block text-sm underline text-brown">
          Gerenciar produtos
        </Link>
        <Link href="/admin/orders" className="block text-sm underline text-brown">
          Ver pedidos
        </Link>
      </nav>
```

to:

```tsx
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
```

- [ ] **Step 2: Run typecheck and full test suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: No type errors, all tests pass

- [ ] **Step 3: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: link to reviews moderation from admin dashboard"
```

---

### Task 7: Manual end-to-end verification

**No file changes** — verification only, using the Claude Preview MCP tools against the running dev server.

- [ ] **Step 1: Insert test reviews in Supabase (manual)**

1. Go to https://supabase.com/dashboard, open the `cookie-and-love` project, open the SQL Editor
2. Run:

```sql
insert into reviews (customer_name, rating, comment, approved) values
  ('Ana Souza', 5, 'Melhor cookie de Joinville, recomendo!', false),
  ('Carlos Lima', 4, 'Muito bom, só achei um pouco doce.', true);
```

- [ ] **Step 2: Log in and open `/admin/reviews`**

Use the Claude Preview MCP tools (`preview_start`, `preview_eval`, `preview_snapshot`):

1. Navigate to `/admin/login`, log in with the admin credentials created in Plan 2c-1
2. Navigate to `/admin/reviews`
3. Confirm via `preview_snapshot`:
   - "Ana Souza" appears under "Pendentes" with `★★★★★`, the comment text, and an "Aprovar" button
   - "Carlos Lima" appears under "Aprovadas" with `★★★★☆`, the comment text, and an "Ocultar" button

- [ ] **Step 3: Approve the pending review**

1. Click the "Aprovar" button for "Ana Souza" (`preview_click`)
2. Confirm via `preview_snapshot` that "Ana Souza" now appears under "Aprovadas" with an "Ocultar" button, and "Pendentes" shows "Nenhuma avaliação pendente."

- [ ] **Step 4: Hide a review**

1. Click the "Ocultar" button for "Carlos Lima" (`preview_click`)
2. Confirm via `preview_snapshot` that "Carlos Lima" now appears under "Pendentes" with an "Aprovar" button

- [ ] **Step 5: Check for console/server errors**

Use `preview_console_logs` (level: error) to confirm no errors were logged during the flow.

- [ ] **Step 6: Clean up test data (manual)**

In the Supabase SQL Editor, run:

```sql
delete from reviews where customer_name in ('Ana Souza', 'Carlos Lima');
```

- [ ] **Step 7: Stop the preview server**

Use `preview_stop`.

- [ ] **Step 8: Report results**

Summarize what was verified and any issues found. If issues are found, fix them and re-run the relevant verification steps.

---

## Self-Review

- **Spec coverage:** RLS for admin read+update on `reviews` (Task 1) ✅, `Review` type (Task 2) ✅, `getAllReviews`/`setReviewApproved` with TDD (Task 3) ✅, approve/hide toggle button (Task 4) ✅, Pendentes/Aprovadas page with stars/date/comment and empty states (Task 5) ✅, dashboard link (Task 6) ✅, manual E2E (Task 7) ✅.
- **Type consistency:** `Review` (`lib/types.ts`) fields (`id`, `customerName`, `rating`, `comment`, `approved`, `createdAt`) used consistently by `lib/reviews.ts` (`mapReviewRow`, `getAllReviews`, `setReviewApproved`), `ReviewApprovalButton` (`reviewId`, `approved` props), and `app/admin/reviews/page.tsx` (`ReviewListItem`).
- **Scope:** 7 small tasks, each independently testable/committable; no changes to the public storefront, no review-submission flow, no permanent delete.

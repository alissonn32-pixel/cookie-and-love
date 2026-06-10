# Orders Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a customer finishes the checkout flow, save the order to the Supabase `orders` table before opening the WhatsApp link, so the store owner has a permanent record of every order placed.

**Architecture:** The `orders` table already exists (created in Plan 2a's migration `0001_init.sql`) with Row Level Security enabled but no policies, so all access is currently denied. This plan adds a migration that allows public (anon) inserts only - no reads, updates, or deletes - matching the "customers can place orders, only the admin can view them" model. A new `lib/orders.ts` module provides `saveOrder(client, cart, order, total)`, which maps the cart/order data to the `orders` table's columns and inserts a row. `CheckoutModal` calls this function when the customer submits, then proceeds to open the WhatsApp link regardless of whether the save succeeded (so a database hiccup never blocks a customer from completing their order via WhatsApp).

**Tech Stack:** Next.js (App Router) + TypeScript, `@supabase/supabase-js`, Vitest. Out of scope (future plan 2c): admin panel to view/manage saved orders, Supabase Auth.

---

## File Structure

- **Create:** `supabase/migrations/0002_orders_insert_policy.sql` - adds an RLS policy allowing public inserts into `orders`
- **Create:** `lib/orders.ts` - `saveOrder(client, cart, order, total)` maps cart/order data to the `orders` table schema and inserts a row
- **Create:** `lib/orders.test.ts` - unit tests for `saveOrder` using a mocked Supabase client
- **Modify:** `components/CheckoutModal.tsx` - call `saveOrder` on submit before opening the WhatsApp link

---

### Task 1: Add RLS insert policy for orders

**Files:**
- Create: `supabase/migrations/0002_orders_insert_policy.sql`

The `orders` table was created in `supabase/migrations/0001_init.sql` with `alter table orders enable row level security;` but no policies were added, so by default ALL access (including inserts) is denied. This task adds a policy that allows anyone (the anon/public role used by the browser) to INSERT new orders, but does NOT allow SELECT/UPDATE/DELETE - so customers can place orders but cannot read other customers' orders.

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/0002_orders_insert_policy.sql` with this exact content:

```sql
-- Allow public (anon) role to insert new orders, but not read/update/delete them
create policy "Public insert access to orders" on orders
  for insert
  with check (true);
```

- [ ] **Step 2: Run the migration in Supabase**

This step happens in the browser, not in code. No commit needed for this step alone (the file commit happens in Step 3).

1. Go to https://supabase.com/dashboard and open the `cookie-and-love` project
2. In the left sidebar, click "SQL Editor"
3. Click "New query"
4. Paste the contents of `supabase/migrations/0002_orders_insert_policy.sql`
5. Click "Run" (or Ctrl+Enter)
6. Confirm it shows "Success. No rows returned"

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0002_orders_insert_policy.sql
git commit -m "feat: allow public inserts into orders table"
```

---

### Task 2: Create `lib/orders.ts` with `saveOrder` (TDD)

**Files:**
- Create: `lib/orders.ts`
- Test: `lib/orders.test.ts`

The `orders` table (from `supabase/migrations/0001_init.sql`) has columns: `id (uuid, default), customer_name, whatsapp, pickup_time, delivery_type, payment_method, notes, items (jsonb), total, created_at (default)`.

The `items` jsonb column should store an array of `{product_id, name, qty, price}` objects, per the design spec.

The relevant types from `lib/types.ts` are:

```ts
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export type DeliveryType = "retirada" | "entrega";
export type PaymentMethod = "pix" | "dinheiro" | "cartao";

export interface OrderDetails {
  customerName: string;
  whatsapp: string;
  pickupTime: string;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  notes?: string;
}
```

Follow TDD: write the failing test file first, run it to confirm it fails, then implement, then run again to confirm it passes.

- [ ] **Step 1: Write `lib/orders.test.ts`**

Create `lib/orders.test.ts` with this exact content:

```ts
import { describe, it, expect, vi } from "vitest";
import { saveOrder } from "./orders";
import { SupabaseClient } from "@supabase/supabase-js";
import { CartItem, OrderDetails } from "./types";

function mockClient(error: unknown = null) {
  const insert = vi.fn().mockResolvedValue({ error });
  const from = vi.fn().mockReturnValue({ insert });
  return { from } as unknown as SupabaseClient;
}

const cart: CartItem[] = [
  { productId: "big-apple-choc-chunk", name: "Big Apple Choc Chunk", price: 12.9, qty: 2 },
  { productId: "brooklyn-red-velvet", name: "Brooklyn Red Velvet", price: 13.9, qty: 1 },
];

const order: OrderDetails = {
  customerName: "Maria Silva",
  whatsapp: "5511999998888",
  pickupTime: "18:30",
  deliveryType: "retirada",
  paymentMethod: "pix",
  notes: "Sem nozes, por favor",
};

describe("saveOrder", () => {
  it("inserts a row into the orders table with mapped fields", async () => {
    const client = mockClient();

    await saveOrder(client, cart, order, 39.7);

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    expect(fromMock).toHaveBeenCalledWith("orders");

    const insertMock = fromMock.mock.results[0].value.insert as ReturnType<typeof vi.fn>;
    expect(insertMock).toHaveBeenCalledWith({
      customer_name: "Maria Silva",
      whatsapp: "5511999998888",
      pickup_time: "18:30",
      delivery_type: "retirada",
      payment_method: "pix",
      notes: "Sem nozes, por favor",
      items: [
        { product_id: "big-apple-choc-chunk", name: "Big Apple Choc Chunk", qty: 2, price: 12.9 },
        { product_id: "brooklyn-red-velvet", name: "Brooklyn Red Velvet", qty: 1, price: 13.9 },
      ],
      total: 39.7,
    });
  });

  it("maps a missing notes field to null", async () => {
    const client = mockClient();

    await saveOrder(client, cart, { ...order, notes: undefined }, 39.7);

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    const insertMock = fromMock.mock.results[0].value.insert as ReturnType<typeof vi.fn>;
    const insertedRow = insertMock.mock.calls[0][0] as { notes: unknown };
    expect(insertedRow.notes).toBeNull();
  });

  it("throws an error when the insert returns an error", async () => {
    const client = mockClient(new Error("db error"));

    await expect(saveOrder(client, cart, order, 39.7)).rejects.toThrow("db error");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/orders.test.ts`
Expected: FAIL with an error like "Failed to resolve import './orders'" or "saveOrder is not a function" (the file doesn't exist yet).

- [ ] **Step 3: Write `lib/orders.ts`**

Create `lib/orders.ts` with this exact content:

```ts
import { SupabaseClient } from "@supabase/supabase-js";
import { CartItem, OrderDetails } from "./types";

export async function saveOrder(
  client: SupabaseClient,
  cart: CartItem[],
  order: OrderDetails,
  total: number
): Promise<void> {
  const { error } = await client.from("orders").insert({
    customer_name: order.customerName,
    whatsapp: order.whatsapp,
    pickup_time: order.pickupTime,
    delivery_type: order.deliveryType,
    payment_method: order.paymentMethod,
    notes: order.notes ?? null,
    items: cart.map((item) => ({
      product_id: item.productId,
      name: item.name,
      qty: item.qty,
      price: item.price,
    })),
    total,
  });

  if (error) {
    throw new Error(error.message);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/orders.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Run `npx tsc --noEmit` to confirm no type errors**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add lib/orders.ts lib/orders.test.ts
git commit -m "feat: add saveOrder for persisting orders to Supabase"
```

---

### Task 3: Wire `saveOrder` into `CheckoutModal`

**Files:**
- Modify: `components/CheckoutModal.tsx`

The current `components/CheckoutModal.tsx` has this `handleSubmit` function (around line 44-56):

```tsx
  function handleSubmit() {
    const order: OrderDetails = {
      customerName,
      whatsapp,
      pickupTime,
      deliveryType,
      paymentMethod,
      notes: notes.trim() === "" ? undefined : notes.trim(),
    };
    const message = buildOrderMessage(cart, order, total);
    const link = buildWhatsAppLink(settings.whatsappTarget, message);
    window.open(link, "_blank");
  }
```

We need to:
1. Call `saveOrder` before opening the WhatsApp link
2. Make `handleSubmit` async, since `saveOrder` is async
3. If `saveOrder` throws (e.g. network error), log it to the console but still open the WhatsApp link - the customer's order must always be completable via WhatsApp even if the database write fails
4. Add a `createSupabaseClient()` call to get a client instance

This component is a "use client" component, and `createSupabaseClient()` (from `lib/supabase.ts`, created in Plan 2a) reads `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`, which are safe to use in the browser.

- [ ] **Step 1: Update the imports at the top of `components/CheckoutModal.tsx`**

Change this:

```tsx
import { CartItem, DeliveryType, OrderDetails, PaymentMethod, StoreSettings } from "@/lib/types";
import { buildOrderMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { isStoreOpen, meetsMinimumOrder, minimumOrderShortfall } from "@/lib/validation";
```

to:

```tsx
import { CartItem, DeliveryType, OrderDetails, PaymentMethod, StoreSettings } from "@/lib/types";
import { buildOrderMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { isStoreOpen, meetsMinimumOrder, minimumOrderShortfall } from "@/lib/validation";
import { createSupabaseClient } from "@/lib/supabase";
import { saveOrder } from "@/lib/orders";
```

- [ ] **Step 2: Replace `handleSubmit` with an async version that calls `saveOrder`**

Change this:

```tsx
  function handleSubmit() {
    const order: OrderDetails = {
      customerName,
      whatsapp,
      pickupTime,
      deliveryType,
      paymentMethod,
      notes: notes.trim() === "" ? undefined : notes.trim(),
    };
    const message = buildOrderMessage(cart, order, total);
    const link = buildWhatsAppLink(settings.whatsappTarget, message);
    window.open(link, "_blank");
  }
```

to:

```tsx
  async function handleSubmit() {
    const order: OrderDetails = {
      customerName,
      whatsapp,
      pickupTime,
      deliveryType,
      paymentMethod,
      notes: notes.trim() === "" ? undefined : notes.trim(),
    };

    try {
      const client = createSupabaseClient();
      await saveOrder(client, cart, order, total);
    } catch (error) {
      console.error("Failed to save order:", error);
    }

    const message = buildOrderMessage(cart, order, total);
    const link = buildWhatsAppLink(settings.whatsappTarget, message);
    window.open(link, "_blank");
  }
```

- [ ] **Step 3: Run the existing test suite to confirm nothing broke**

Run: `npx vitest run`
Expected: all existing tests still pass (CheckoutModal has no dedicated test file, so this confirms no regressions in `lib/*`)

- [ ] **Step 4: Run `npx tsc --noEmit` to confirm no type errors**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add components/CheckoutModal.tsx
git commit -m "feat: save orders to Supabase on checkout"
```

---

### Task 4: Manual end-to-end verification

**Files:** none (manual verification only)

- [ ] **Step 1: Start the dev server and place a test order**

Use the Claude Preview MCP tools (`preview_start`, already configured via `.claude/launch.json` from Plan 2a) to start the dev server, then:

1. Open the app
2. Add a product to the cart
3. Open the checkout modal
4. Fill in the required fields (Nome, WhatsApp, Horário desejado)
5. Click "Revisar e enviar no WhatsApp"

- [ ] **Step 2: Check the browser console for errors**

Use `preview_console_logs` (or `preview_logs` for server-side errors) to confirm no errors were logged from `saveOrder`.

- [ ] **Step 3: Verify the order was saved in Supabase**

In the Supabase dashboard, go to "Table Editor" → `orders` table, and confirm a new row was created with the test data (customer name, items, total, etc.)

- [ ] **Step 4: Stop the preview server**

Use `preview_stop`.

---

## Self-Review Notes

- **Spec coverage:** The design spec's `orders` table schema (section 4) is fully covered by `lib/orders.ts`'s mapping. The "customer can always complete via WhatsApp" requirement (implicit in the existing flow) is preserved by catching/logging errors rather than blocking `window.open`.
- **Type consistency:** `saveOrder(client, cart, order, total)` signature matches usage in `CheckoutModal.tsx` exactly (`cart: CartItem[]`, `order: OrderDetails`, `total: number`).
- **No placeholders:** All code blocks are complete and exact.
- **Out of scope confirmed:** No admin UI to view orders - that's Plan 2c.

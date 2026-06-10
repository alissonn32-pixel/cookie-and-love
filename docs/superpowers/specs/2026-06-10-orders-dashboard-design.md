# Orders Dashboard (Plan 2c-3a) Design

## Goal

Give the admin a read-only view of incoming orders at `/admin/orders`, so the
store owner can see what customers ordered without relying solely on
WhatsApp messages.

## Scope

- Read-only list of the 50 most recent orders, newest first.
- Each order shows a summary (customer name, total, date/time) and can be
  expanded to show full details (items, quantities, prices, payment method,
  delivery type, pickup time, WhatsApp number, notes).
- Link to `/admin/orders` added to the `/admin` dashboard.

**Out of scope** (deferred to future plans):
- Order status tracking (no `status` column exists; adding one is a separate
  decision).
- Pagination beyond the 50-order limit.
- Filtering/searching orders.
- Editing or deleting orders.

## Database

The `orders` table (from `supabase/migrations/0001_init.sql`) has RLS
enabled with only a public INSERT policy (`0002_orders_insert_policy.sql`).
There is no SELECT policy at all, so no role can currently read orders.

New migration `supabase/migrations/0004_orders_admin_select_policy.sql`:

```sql
-- Allow authenticated (admin) users to read orders
create policy "Authenticated read access to orders" on orders
  for select
  to authenticated
  using (true);
```

## Types

Add to `lib/types.ts`:

```ts
export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  whatsapp: string;
  pickupTime: string;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  notes: string | null;
  items: OrderItem[];
  total: number;
  createdAt: string;
}
```

## Data layer

Add to `lib/orders.ts`:

```ts
export async function getRecentOrders(client: SupabaseClient, limit = 50): Promise<Order[]>
```

- Selects all columns from `orders`, ordered by `created_at` descending,
  limited to `limit` rows.
- Maps each row (snake_case DB columns) to the `Order` type (camelCase),
  parsing the `items` jsonb column into `OrderItem[]`.
- Throws on Supabase error, following the existing pattern in
  `lib/products.ts` / `lib/orders.ts`.
- Tested with the existing mocked-Supabase-client pattern used throughout
  `lib/products.test.ts` and `lib/orders.test.ts`.

## UI

`app/admin/products/page.tsx` is the closest precedent: an async server
component using `lib/supabase/server`'s `createClient()`.

`app/admin/orders/page.tsx`:
- Server component, fetches orders via `getRecentOrders`.
- Renders a list of `<details>` elements (one per order) — no client-side
  JavaScript needed for expand/collapse, using native HTML disclosure
  widgets styled with Tailwind.
- `<summary>` shows: customer name, formatted total (R$ X,XX), formatted
  date/time (pt-BR locale).
- Expanded content shows: each item (name, qty, unit price, line total),
  delivery type, payment method, pickup time, WhatsApp number, and notes (if
  any).
- "Voltar ao painel" link back to `/admin`, matching the products page
  pattern.
- Empty state: "Nenhum pedido recebido ainda." when the list is empty.

`app/admin/page.tsx`: add a "Ver pedidos" link to `/admin/orders` in the nav,
alongside the existing "Gerenciar produtos" link.

## Testing

- TDD for `getRecentOrders`: mock Supabase client `.from("orders").select("*").order("created_at", { ascending: false }).limit(50)` chain, verify mapping (including `items` jsonb → `OrderItem[]`) and error handling.
- `npx tsc --noEmit` and `npx vitest run` after each task.
- Manual E2E verification via Claude Preview MCP: log in as admin, navigate
  to `/admin/orders`, confirm the page loads (with real orders if any exist,
  or the empty state otherwise), expand an order if present, confirm no
  console/server errors.

## Self-Review

- **Spec coverage:** read-only list ✅, expand/collapse detail ✅, dashboard
  link ✅, RLS policy ✅. Status tracking and pagination explicitly deferred
  per user decision.
- **Type consistency:** `Order`/`OrderItem` reuse existing `DeliveryType` and
  `PaymentMethod` types from `lib/types.ts`. Field names mirror
  `lib/orders.ts`'s `saveOrder` (`customer_name`, `whatsapp`, `pickup_time`,
  `delivery_type`, `payment_method`, `notes`, `items`, `total`,
  `created_at`).
- **Scope:** focused single subsystem, consistent with the products-crud
  precedent.

# Orders Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only `/admin/orders` page where the admin can see the 50 most recent orders, with expandable details for each.

**Architecture:** A new RLS policy lets `authenticated` users read the `orders` table (currently has no SELECT policy at all). `lib/orders.ts` gets a new `getRecentOrders` function that fetches and maps rows to a new `Order`/`OrderItem` type in `lib/types.ts`. `app/admin/orders/page.tsx` is a server component rendering each order as a native `<details>/<summary>` element (no client JS). A "Ver pedidos" link is added to `/admin`.

**Tech Stack:** Next.js (App Router, server components), TypeScript, Supabase (`@supabase/supabase-js`, `@supabase/ssr`), Tailwind CSS, Vitest.

---

### Task 1: RLS policy for admin order reads

**Files:**
- Create: `supabase/migrations/0004_orders_admin_select_policy.sql`

The `orders` table (see `supabase/migrations/0001_init.sql`) has RLS enabled
but only a public INSERT policy (`0002_orders_insert_policy.sql`). No role
can currently read orders - not even the admin.

- [ ] **Step 1: Create the migration file**

```sql
-- Allow authenticated (admin) users to read orders
create policy "Authenticated read access to orders" on orders
  for select
  to authenticated
  using (true);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/0004_orders_admin_select_policy.sql
git commit -m "feat: allow authenticated users to read orders"
```

- [ ] **Step 3: Tell the user to run this migration's SQL in the Supabase SQL Editor** (same manual process used for `0003_products_admin_policies.sql`). Wait for confirmation it ran successfully before treating this task as fully done in a real environment - but for the purposes of this plan, proceed to Task 2 once committed.

---

### Task 2: Add `Order` and `OrderItem` types

**Files:**
- Modify: `lib/types.ts`

`lib/types.ts` currently ends with the `StoreSettings` interface. Add the
new types after it.

- [ ] **Step 1: Add types to `lib/types.ts`**

Append to the end of `lib/types.ts`:

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

`DeliveryType` and `PaymentMethod` are already defined earlier in
`lib/types.ts` (used by `OrderDetails`), so no new imports are needed.

- [ ] **Step 2: Run `npx tsc --noEmit`**

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add Order and OrderItem types"
```

---

### Task 3: Add `getRecentOrders` to `lib/orders.ts` (TDD)

**Files:**
- Modify: `lib/orders.ts`
- Modify: `lib/orders.test.ts`

`lib/orders.ts` currently only exports `saveOrder` (which inserts a new
order). Add a `getRecentOrders` function that reads the most recent orders.

- [ ] **Step 1: Write the failing tests**

`lib/orders.test.ts` currently has a `mockClient` helper used by `saveOrder`
tests (it mocks `.from().insert()`). Add a second helper for the
select/order/limit chain used by `getRecentOrders`, plus new tests. Append
to `lib/orders.test.ts`:

```ts
function mockSelectClient(rows: unknown[] | null, error: unknown = null) {
  const limit = vi.fn().mockResolvedValue({ data: rows, error });
  const order = vi.fn().mockReturnValue({ limit });
  const select = vi.fn().mockReturnValue({ order });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as SupabaseClient;
}

const orderRow = {
  id: "11111111-1111-1111-1111-111111111111",
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
  created_at: "2026-06-10T18:00:00.000Z",
};

const mappedOrder: Order = {
  id: "11111111-1111-1111-1111-111111111111",
  customerName: "Maria Silva",
  whatsapp: "5511999998888",
  pickupTime: "18:30",
  deliveryType: "retirada",
  paymentMethod: "pix",
  notes: "Sem nozes, por favor",
  items: [
    { productId: "big-apple-choc-chunk", name: "Big Apple Choc Chunk", qty: 2, price: 12.9 },
    { productId: "brooklyn-red-velvet", name: "Brooklyn Red Velvet", qty: 1, price: 13.9 },
  ],
  total: 39.7,
  createdAt: "2026-06-10T18:00:00.000Z",
};

describe("getRecentOrders", () => {
  it("maps database rows to Order objects, ordered by most recent", async () => {
    const client = mockSelectClient([orderRow]);

    const orders = await getRecentOrders(client);

    expect(orders).toEqual([mappedOrder]);

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    expect(fromMock).toHaveBeenCalledWith("orders");

    const selectMock = fromMock.mock.results[0].value.select as ReturnType<typeof vi.fn>;
    expect(selectMock).toHaveBeenCalledWith("*");

    const orderMock = selectMock.mock.results[0].value.order as ReturnType<typeof vi.fn>;
    expect(orderMock).toHaveBeenCalledWith("created_at", { ascending: false });

    const limitMock = orderMock.mock.results[0].value.limit as ReturnType<typeof vi.fn>;
    expect(limitMock).toHaveBeenCalledWith(50);
  });

  it("maps a null notes field through unchanged", async () => {
    const client = mockSelectClient([{ ...orderRow, notes: null }]);

    const orders = await getRecentOrders(client);

    expect(orders[0].notes).toBeNull();
  });

  it("respects a custom limit", async () => {
    const client = mockSelectClient([]);

    await getRecentOrders(client, 10);

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    const selectMock = fromMock.mock.results[0].value.select as ReturnType<typeof vi.fn>;
    const orderMock = selectMock.mock.results[0].value.order as ReturnType<typeof vi.fn>;
    const limitMock = orderMock.mock.results[0].value.limit as ReturnType<typeof vi.fn>;
    expect(limitMock).toHaveBeenCalledWith(10);
  });

  it("throws an error when the query returns an error", async () => {
    const client = mockSelectClient(null, new Error("db error"));

    await expect(getRecentOrders(client)).rejects.toThrow("db error");
  });
});
```

Update the import line at the top of `lib/orders.test.ts` from:

```ts
import { saveOrder } from "./orders";
```

to:

```ts
import { saveOrder, getRecentOrders } from "./orders";
```

And update the type import from:

```ts
import { CartItem, OrderDetails } from "./types";
```

to:

```ts
import { CartItem, OrderDetails, Order } from "./types";
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/orders.test.ts`
Expected: FAIL ("getRecentOrders is not defined")

- [ ] **Step 3: Implement `getRecentOrders` in `lib/orders.ts`**

`lib/orders.ts` currently imports `{ SupabaseClient }` from
`@supabase/supabase-js` and `{ CartItem, OrderDetails }` from `./types`.
Update the type import to also bring in `Order`, `OrderItem`,
`DeliveryType`, and `PaymentMethod`:

```ts
import { CartItem, OrderDetails, Order, OrderItem, DeliveryType, PaymentMethod } from "./types";
```

Add this interface and function to `lib/orders.ts` (after the existing
`saveOrder` function):

```ts
interface OrderRow {
  id: string;
  customer_name: string;
  whatsapp: string;
  pickup_time: string;
  delivery_type: DeliveryType;
  payment_method: PaymentMethod;
  notes: string | null;
  items: { product_id: string; name: string; qty: number; price: number }[];
  total: number;
  created_at: string;
}

function mapOrderRow(row: OrderRow): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    whatsapp: row.whatsapp,
    pickupTime: row.pickup_time,
    deliveryType: row.delivery_type,
    paymentMethod: row.payment_method,
    notes: row.notes,
    items: row.items.map(
      (item): OrderItem => ({
        productId: item.product_id,
        name: item.name,
        qty: item.qty,
        price: item.price,
      })
    ),
    total: row.total,
    createdAt: row.created_at,
  };
}

export async function getRecentOrders(client: SupabaseClient, limit = 50): Promise<Order[]> {
  const { data, error } = await client
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data as OrderRow[]).map(mapOrderRow);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/orders.test.ts`
Expected: PASS (7 tests: 3 existing `saveOrder` tests + 4 new
`getRecentOrders` tests)

- [ ] **Step 5: Run `npx tsc --noEmit`**

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/orders.ts lib/orders.test.ts
git commit -m "feat: add getRecentOrders"
```

---

### Task 4: Create the orders admin page

**Files:**
- Create: `app/admin/orders/page.tsx`

This is a server component, following the same pattern as
`app/admin/products/page.tsx` (uses `lib/supabase/server`'s `createClient()`,
fetches data, renders a list, has a "Voltar ao painel" link).

- [ ] **Step 1: Create `app/admin/orders/page.tsx`**

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRecentOrders } from "@/lib/orders";

const deliveryLabels: Record<string, string> = {
  retirada: "Retirada",
  entrega: "Entrega",
};

const paymentLabels: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function AdminOrdersPage() {
  const client = await createClient();
  const orders = await getRecentOrders(client);

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-bold text-xl">Pedidos</h1>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-taupe">Nenhum pedido recebido ainda.</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => (
            <li key={order.id} className="border border-beige rounded">
              <details className="text-sm">
                <summary className="flex justify-between items-center px-3 py-2 cursor-pointer">
                  <span className="font-bold">{order.customerName}</span>
                  <span className="text-xs text-taupe">
                    {formatDate(order.createdAt)} - R$ {order.total.toFixed(2)}
                  </span>
                </summary>
                <div className="px-3 pb-3 space-y-2 border-t border-beige pt-2">
                  <ul className="space-y-1">
                    {order.items.map((item) => (
                      <li key={item.productId} className="flex justify-between text-xs">
                        <span>
                          {item.qty}x {item.name}
                        </span>
                        <span>R$ {(item.price * item.qty).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-taupe">
                    {deliveryLabels[order.deliveryType] ?? order.deliveryType} - {paymentLabels[order.paymentMethod] ?? order.paymentMethod} - Retirada/entrega: {order.pickupTime}
                  </p>
                  <p className="text-xs text-taupe">WhatsApp: {order.whatsapp}</p>
                  {order.notes && <p className="text-xs text-taupe">Obs: {order.notes}</p>}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      <Link href="/admin" className="block mt-6 text-xs underline text-taupe">
        Voltar ao painel
      </Link>
    </main>
  );
}
```

- [ ] **Step 2: Run `npx vitest run`**

Expected: all tests pass.

- [ ] **Step 3: Run `npx tsc --noEmit`**

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/admin/orders/page.tsx
git commit -m "feat: add admin orders page"
```

---

### Task 5: Add "Ver pedidos" link to the admin dashboard

**Files:**
- Modify: `app/admin/page.tsx`

Current `app/admin/page.tsx`:

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="max-w-md mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-bold text-xl">Painel administrativo</h1>
        <LogoutButton />
      </div>
      <p className="text-sm text-taupe mb-6">Logado como {user?.email}</p>
      <nav>
        <Link href="/admin/products" className="text-sm underline text-brown">
          Gerenciar produtos
        </Link>
      </nav>
    </main>
  );
}
```

- [ ] **Step 1: Add a second link to the `<nav>`**

Replace the `<nav>` block with:

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

- [ ] **Step 2: Run `npx tsc --noEmit`**

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: link to orders page from admin dashboard"
```

---

### Task 6: Manual end-to-end verification

Use the Claude Preview MCP tools (`preview_start`, `preview_eval`,
`preview_fill`, `preview_click`, `preview_snapshot`,
`preview_console_logs`, `preview_logs`, `preview_stop`), following the same
pattern used for the products-crud verification.

- [ ] **Step 1: Start the dev server and log in**

Start the preview server (config `cookie-and-love`, port 3000), navigate to
`/admin/login`, and log in with the admin credentials.

- [ ] **Step 2: Navigate to the orders page**

From `/admin`, click "Ver pedidos" and confirm `/admin/orders` loads.

- [ ] **Step 3: Verify the orders list or empty state**

If there are existing orders (e.g. from earlier manual testing of the
storefront checkout), confirm they appear in the list, newest first, with
customer name, date, and total in the summary line.

If there are no orders, confirm the page shows "Nenhum pedido recebido
ainda." instead of an empty list.

- [ ] **Step 4: Expand an order (if any exist)**

Click a `<summary>` to expand an order and confirm the items, delivery
type, payment method, pickup time, WhatsApp number, and notes (if present)
are shown correctly.

- [ ] **Step 5: Check for errors**

Run `preview_console_logs` (level: error) and `preview_logs` (level: error)
and confirm no errors.

- [ ] **Step 6: Stop the preview server**

Run `preview_stop`.

---

## Self-Review Notes

- **Spec coverage:** read-only list of 50 most recent orders ✅ (Task 3/4),
  expand/collapse detail via `<details>` ✅ (Task 4), dashboard link ✅
  (Task 5), RLS SELECT policy for `authenticated` ✅ (Task 1). Status
  tracking, pagination, filtering, and edit/delete are explicitly out of
  scope per the design doc.
- **Type consistency:** `Order`/`OrderItem` (Task 2) match the field names
  produced by `mapOrderRow` (Task 3) and consumed by `app/admin/orders/page.tsx`
  (Task 4) - `customerName`, `whatsapp`, `pickupTime`, `deliveryType`,
  `paymentMethod`, `notes`, `items` (`productId`/`name`/`qty`/`price`),
  `total`, `createdAt`. `DeliveryType`/`PaymentMethod` reuse existing types
  from `lib/types.ts`.
- **Migration ordering:** `0004_orders_admin_select_policy.sql` follows
  `0003_products_admin_policies.sql` numerically, consistent with existing
  migration files.

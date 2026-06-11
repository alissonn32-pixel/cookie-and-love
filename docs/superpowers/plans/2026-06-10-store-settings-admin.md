# Configurações da Loja (Store Settings Admin) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `/admin/settings` page where the shop owner can edit the store's open/closed status, prep time, and minimum order value.

**Architecture:** A new RLS update policy on `store_settings` allows authenticated admins to update the row. `lib/store-settings.ts` gains `updateStoreSettings`, tested via mocked Supabase client (TDD). A client component `StoreSettingsForm` (mirroring `ProductForm`) renders the 3 editable fields and calls `updateStoreSettings`. A new server page `/admin/settings` fetches current settings and renders the form, with a link added from the admin dashboard.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Vitest, Supabase (`@supabase/supabase-js`, `@supabase/ssr`).

---

### Task 1: RLS update policy for `store_settings`

**Files:**
- Create: `supabase/migrations/0006_store_settings_admin_policies.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Allow authenticated (admin) users to update store settings
create policy "Authenticated update access to store settings" on store_settings
  for update
  to authenticated
  using (true)
  with check (true);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/0006_store_settings_admin_policies.sql
git commit -m "feat: add admin update policy for store settings"
```

- [ ] **Step 3: Apply manually in Supabase**

This migration must be run manually against the Supabase project (no service
role key is available in `.env.local`). Report to the user that they need to
run the SQL above in the Supabase SQL editor before the update feature will
work end-to-end. This does not block subsequent tasks (TDD and UI work do not
require a live database), but the manual E2E verification task (Task 4) does
require it to have been applied.

---

### Task 2: `updateStoreSettings` data layer (TDD)

**Files:**
- Modify: `lib/store-settings.ts`
- Create: `lib/store-settings.test.ts`

This task adds test coverage for the existing `getStoreSettings` function (it
currently has none) and implements a new `updateStoreSettings` function via
TDD.

The current contents of `lib/store-settings.ts` are:

```ts
import { SupabaseClient } from "@supabase/supabase-js";
import { StoreSettings, PaymentMethod, DeliveryType, TabConfig } from "./types";

interface StoreSettingsRow {
  id: number;
  is_open: boolean;
  prep_time_minutes: number;
  min_order_value: number;
  hero_text: string;
  whatsapp_target: string;
  payment_methods: PaymentMethod[];
  delivery_options: DeliveryType[];
  tabs_config: TabConfig[];
}

function mapRow(row: StoreSettingsRow): StoreSettings {
  return {
    isOpen: row.is_open,
    prepTimeMinutes: row.prep_time_minutes,
    minOrderValue: row.min_order_value,
    heroText: row.hero_text,
    whatsappTarget: row.whatsapp_target,
    paymentMethods: row.payment_methods,
    deliveryOptions: row.delivery_options,
    tabs: row.tabs_config,
  };
}

export async function getStoreSettings(client: SupabaseClient): Promise<StoreSettings> {
  const { data, error } = await client
    .from("store_settings")
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRow(data as StoreSettingsRow);
}
```

- [ ] **Step 1: Write the failing tests**

Create `lib/store-settings.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { getStoreSettings, updateStoreSettings } from "./store-settings";
import { SupabaseClient } from "@supabase/supabase-js";
import { StoreSettings } from "./types";

function mockSelectClient(row: unknown | null, error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data: row, error });
  const select = vi.fn().mockReturnValue({ single });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as SupabaseClient;
}

function mockUpdateClient(error: unknown = null) {
  const eq = vi.fn().mockResolvedValue({ error });
  const update = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ update });
  return { from } as unknown as SupabaseClient;
}

const settingsRow = {
  id: 1,
  is_open: true,
  prep_time_minutes: 40,
  min_order_value: 0,
  hero_text: "Crocante por fora, derretendo por dentro.",
  whatsapp_target: "5500000000000",
  payment_methods: ["pix", "dinheiro", "cartao"],
  delivery_options: ["retirada", "entrega"],
  tabs_config: [
    { id: "destaques", label: "Destaques" },
    { id: "cookies", label: "Cookies" },
  ],
};

const mappedSettings: StoreSettings = {
  isOpen: true,
  prepTimeMinutes: 40,
  minOrderValue: 0,
  heroText: "Crocante por fora, derretendo por dentro.",
  whatsappTarget: "5500000000000",
  paymentMethods: ["pix", "dinheiro", "cartao"],
  deliveryOptions: ["retirada", "entrega"],
  tabs: [
    { id: "destaques", label: "Destaques" },
    { id: "cookies", label: "Cookies" },
  ],
};

describe("getStoreSettings", () => {
  it("maps the database row to a StoreSettings object", async () => {
    const client = mockSelectClient(settingsRow);

    const settings = await getStoreSettings(client);

    expect(settings).toEqual(mappedSettings);

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    expect(fromMock).toHaveBeenCalledWith("store_settings");

    const selectMock = fromMock.mock.results[0].value.select as ReturnType<typeof vi.fn>;
    expect(selectMock).toHaveBeenCalledWith("*");
  });

  it("throws an error when the query returns an error", async () => {
    const client = mockSelectClient(null, new Error("db error"));

    await expect(getStoreSettings(client)).rejects.toThrow("db error");
  });
});

describe("updateStoreSettings", () => {
  it("updates isOpen, prepTimeMinutes, and minOrderValue for the row with id 1", async () => {
    const client = mockUpdateClient();

    await updateStoreSettings(client, {
      isOpen: false,
      prepTimeMinutes: 50,
      minOrderValue: 20,
    });

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    expect(fromMock).toHaveBeenCalledWith("store_settings");

    const updateMock = fromMock.mock.results[0].value.update as ReturnType<typeof vi.fn>;
    expect(updateMock).toHaveBeenCalledWith({
      is_open: false,
      prep_time_minutes: 50,
      min_order_value: 20,
    });

    const eqMock = updateMock.mock.results[0].value.eq as ReturnType<typeof vi.fn>;
    expect(eqMock).toHaveBeenCalledWith("id", 1);
  });

  it("throws an error when the update returns an error", async () => {
    const client = mockUpdateClient(new Error("db error"));

    await expect(
      updateStoreSettings(client, { isOpen: true, prepTimeMinutes: 40, minOrderValue: 0 })
    ).rejects.toThrow("db error");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/store-settings.test.ts`
Expected: FAIL with "updateStoreSettings is not a function" (or similar
export error). The `getStoreSettings` tests should PASS already since that
function exists.

- [ ] **Step 3: Implement `updateStoreSettings`**

Add to the bottom of `lib/store-settings.ts`:

```ts
export async function updateStoreSettings(
  client: SupabaseClient,
  settings: { isOpen: boolean; prepTimeMinutes: number; minOrderValue: number }
): Promise<void> {
  const { error } = await client
    .from("store_settings")
    .update({
      is_open: settings.isOpen,
      prep_time_minutes: settings.prepTimeMinutes,
      min_order_value: settings.minOrderValue,
    })
    .eq("id", 1);

  if (error) {
    throw new Error(error.message);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/store-settings.test.ts`
Expected: PASS (all tests in the file)

- [ ] **Step 5: Commit**

```bash
git add lib/store-settings.ts lib/store-settings.test.ts
git commit -m "feat: add updateStoreSettings data layer function"
```

---

### Task 3: `StoreSettingsForm` component

**Files:**
- Create: `components/admin/StoreSettingsForm.tsx`

This component follows the same pattern as `components/admin/ProductForm.tsx`
(`"use client"`, local state initialized from props, `createClient()` from
`lib/supabase/client.ts`, call data-layer function on submit, then
`router.refresh()`).

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateStoreSettings } from "@/lib/store-settings";
import { StoreSettings } from "@/lib/types";

interface StoreSettingsFormProps {
  settings: StoreSettings;
}

export function StoreSettingsForm({ settings }: StoreSettingsFormProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(settings.isOpen);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(String(settings.prepTimeMinutes));
  const [minOrderValue, setMinOrderValue] = useState(String(settings.minOrderValue));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const client = createClient();
      await updateStoreSettings(client, {
        isOpen,
        prepTimeMinutes: Number(prepTimeMinutes),
        minOrderValue: Number(minOrderValue),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar configurações.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error && <p className="bg-beige text-brown text-xs px-3 py-2 rounded">{error}</p>}

      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={isOpen} onChange={(event) => setIsOpen(event.target.checked)} />
        Loja aberta
      </label>

      <label className="block text-xs">
        Tempo de preparo (minutos)
        <input
          type="number"
          min="0"
          step="1"
          className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
          value={prepTimeMinutes}
          onChange={(event) => setPrepTimeMinutes(event.target.value)}
          required
        />
      </label>

      <label className="block text-xs">
        Valor mínimo do pedido (R$)
        <input
          type="number"
          min="0"
          step="0.01"
          className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
          value={minOrderValue}
          onChange={(event) => setMinOrderValue(event.target.value)}
          required
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="bg-brown text-cream rounded py-3 px-6 text-sm font-bold disabled:opacity-40"
      >
        {loading ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/admin/StoreSettingsForm.tsx
git commit -m "feat: add StoreSettingsForm component"
```

---

### Task 4: `/admin/settings` page and dashboard link

**Files:**
- Create: `app/admin/settings/page.tsx`
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: Create the settings page**

Create `app/admin/settings/page.tsx`:

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStoreSettings } from "@/lib/store-settings";
import { StoreSettingsForm } from "@/components/admin/StoreSettingsForm";

export default async function StoreSettingsPage() {
  const client = await createClient();
  const settings = await getStoreSettings(client);

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="font-display font-bold text-xl mb-6">Configurações da loja</h1>
      <StoreSettingsForm settings={settings} />
      <Link href="/admin" className="block text-sm underline text-brown mt-6">
        Voltar ao painel
      </Link>
    </main>
  );
}
```

- [ ] **Step 2: Add the dashboard link**

In `app/admin/page.tsx`, the `<nav>` currently ends with:

```tsx
        <Link href="/admin/reviews" className="block text-sm underline text-brown">
          Gerenciar avaliações
        </Link>
      </nav>
```

Change it to:

```tsx
        <Link href="/admin/reviews" className="block text-sm underline text-brown">
          Gerenciar avaliações
        </Link>
        <Link href="/admin/settings" className="block text-sm underline text-brown">
          Configurações da loja
        </Link>
      </nav>
```

- [ ] **Step 3: Run typecheck and full test suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: No type errors, all tests pass

- [ ] **Step 4: Commit**

```bash
git add app/admin/settings/page.tsx app/admin/page.tsx
git commit -m "feat: add store settings admin page"
```

---

### Task 5: Manual end-to-end verification

**No file changes** — verification only, using the Claude Preview MCP tools
against the running dev server.

**Prerequisite:** the migration from Task 1
(`supabase/migrations/0006_store_settings_admin_policies.sql`) must have been
applied to the Supabase project. If the user has not confirmed this yet, ask
before proceeding — without it, `updateStoreSettings` will fail with an RLS
permission error.

- [ ] **Step 1: Confirm the form is pre-filled with current settings**

Start/reload the preview, log in at `/admin`, navigate to `/admin/settings`.

Use `preview_snapshot` to confirm:
- The checkbox "Loja aberta" is checked (seed: `isOpen = true`).
- The "Tempo de preparo (minutos)" field shows `40`.
- The "Valor mínimo do pedido (R$)" field shows `0`.

- [ ] **Step 2: Change the values and save**

Use `preview_fill`/`preview_click` to:
- Uncheck "Loja aberta".
- Change "Tempo de preparo (minutos)" to `50`.
- Change "Valor mínimo do pedido (R$)" to `20`.
- Click "Salvar".

Confirm via `preview_console_logs` and `preview_logs` that there are no
console or server errors, and the button returns to "Salvar" (not stuck on
"Salvando...").

- [ ] **Step 3: Confirm persistence**

Reload the page (`preview_eval` with `window.location.reload()`) and use
`preview_snapshot` to confirm:
- "Loja aberta" is now unchecked.
- "Tempo de preparo (minutos)" shows `50`.
- "Valor mínimo do pedido (R$)" shows `20`.

- [ ] **Step 4: Revert to seed values**

Repeat Step 2, restoring the original seed values:
- Check "Loja aberta".
- Set "Tempo de preparo (minutos)" to `40`.
- Set "Valor mínimo do pedido (R$)" to `0`.
- Click "Salvar", reload, and confirm via `preview_snapshot` that the values
  match the seed again. This avoids leaving the public storefront in a
  "fechada"/`minOrderValue=20` state, since `getStoreSettings` is consumed by
  `app/page.tsx`, `InfoBar`, `CheckoutModal`, and `lib/validation.ts`.

- [ ] **Step 5: Report results**

Summarize what was verified and any issues found. If issues are found, fix
them and re-run the relevant verification steps.

---

## Self-Review

- **Spec coverage:** RLS update policy (Task 1) ✅, `updateStoreSettings`
  data layer with TDD (Task 2) ✅, `StoreSettingsForm` with the 3 fields
  (Task 3) ✅, `/admin/settings` page + dashboard link (Task 4) ✅, manual E2E
  with persistence check and seed reversion (Task 5) ✅.
- **Type consistency:** `updateStoreSettings(client, { isOpen: boolean,
  prepTimeMinutes: number, minOrderValue: number })` matches the call in
  `StoreSettingsForm.handleSubmit` and the test in Task 2. `StoreSettings`
  (from `lib/types.ts`) is used unchanged by `getStoreSettings`,
  `StoreSettingsForm` props, and `app/admin/settings/page.tsx`.
- **Scope:** 5 small tasks — one migration, one data-layer function (with new
  test file), one client component, one server page + dashboard link, one
  E2E verification pass. No changes to `heroText`, `whatsappTarget`,
  `paymentMethods`, `deliveryOptions`, or `tabs`.

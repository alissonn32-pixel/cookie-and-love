# Configurações da Loja (Store Settings Admin) Design

## Goal

Adicionar uma página `/admin/settings` ao painel administrativo onde o
lojista possa editar as configurações operacionais básicas da loja,
armazenadas na tabela `store_settings` (criada na migration `0001_init.sql`,
hoje somente leitura via `getStoreSettings`).

## Scope

Campos editáveis nesta primeira iteração (os 3 mais usados no dia a dia):

- **Loja aberta/fechada** (`isOpen`): checkbox.
- **Tempo de preparo** (`prepTimeMinutes`): número, em minutos.
- **Valor mínimo do pedido** (`minOrderValue`): número, em reais.

Formulário único em `/admin/settings`, com botão "Salvar" que atualiza os 3
campos de uma vez (mesmo padrão do `ProductForm`).

**Out of scope** (deferred to future work):

- Edição de `heroText` (texto do hero/banner).
- Edição de `whatsappTarget` (número de WhatsApp de destino).
- Edição de `paymentMethods` e `deliveryOptions` (listas de formas de
  pagamento/entrega aceitas).
- Edição de `tabs: TabConfig[]` (abas do storefront) — estruturalmente mais
  complexo (editor de lista com `id`/`label`), fica para uma iteração futura.

## Database

Nova migration `supabase/migrations/0006_store_settings_admin_policies.sql`,
espelhando o padrão de `0003_products_admin_policies.sql`:

```sql
-- Allow authenticated (admin) users to update store settings
create policy "Authenticated update access to store settings" on store_settings
  for update
  to authenticated
  using (true)
  with check (true);
```

A política pública existente (`"Public read access to store settings"`,
`using (true)`) permanece inalterada.

## Data layer: `lib/store-settings.ts`

Adicionar:

```ts
export async function updateStoreSettings(
  client: SupabaseClient,
  settings: { isOpen: boolean; prepTimeMinutes: number; minOrderValue: number }
): Promise<void>
```

- `update({ is_open: settings.isOpen, prep_time_minutes: settings.prepTimeMinutes, min_order_value: settings.minOrderValue }).eq("id", 1)`.
- Lança erro se `error` vier preenchido (mesmo padrão de `updateProduct`/
  `setReviewApproved`).

TDD: criar `lib/store-settings.test.ts` (módulo hoje sem testes), com mocks
do supabase client (mesmo padrão de `lib/products.test.ts`/
`lib/reviews.test.ts`), cobrindo:

- `getStoreSettings` mapeia corretamente os campos (`is_open` → `isOpen`,
  `prep_time_minutes` → `prepTimeMinutes`, etc.) e lança erro quando o client
  retorna `error`.
- `updateStoreSettings` chama `update`/`eq` com os argumentos corretos
  (snake_case, `id = 1`).
- `updateStoreSettings` lança erro quando o client retorna `error`.

## UI

### `components/admin/StoreSettingsForm.tsx` (client component)

Segue o padrão de `components/admin/ProductForm.tsx`:

```tsx
"use client";

interface StoreSettingsFormProps {
  settings: StoreSettings;
}
```

- Estado local inicializado a partir de `settings`:
  - `isOpen` (boolean).
  - `prepTimeMinutes` (string, valor inicial `String(settings.prepTimeMinutes)`).
  - `minOrderValue` (string, valor inicial `String(settings.minOrderValue)`).
  - `error: string | null`, `loading: boolean`.
- Campos do formulário:
  - Checkbox "Loja aberta" — `flex items-center gap-2 text-xs`, mesmo estilo
    do checkbox "Ativo (visível na loja)" do `ProductForm`.
  - Input `type="number"` "Tempo de preparo (minutos)" — `min="0"`,
    `step="1"`, `required`, mesmo estilo
    (`mt-1 w-full border border-beige rounded px-3 py-2 text-sm`).
  - Input `type="number"` "Valor mínimo do pedido (R$)" — `min="0"`,
    `step="0.01"`, `required`, mesmo estilo.
- `handleSubmit`:
  - `event.preventDefault()`, `setLoading(true)`, `setError(null)`.
  - Chama `updateStoreSettings(client, { isOpen, prepTimeMinutes: Number(prepTimeMinutes), minOrderValue: Number(minOrderValue) })`.
  - Em sucesso: `router.refresh()`, `setLoading(false)`.
  - Em erro: `setError(err instanceof Error ? err.message : "Erro ao salvar configurações.")`,
    `setLoading(false)`.
- Mensagem de erro: `bg-beige text-brown text-xs px-3 py-2 rounded`, mesmo
  estilo do `ProductForm`.
- Botão "Salvar" / "Salvando..." (`disabled={loading}`), mesmo estilo
  (`bg-brown text-cream rounded py-3 px-6 text-sm font-bold disabled:opacity-40`).

### `app/admin/settings/page.tsx` (server component)

```tsx
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

(Layout análogo a `app/admin/products/[id]/edit/page.tsx`.)

### `app/admin/page.tsx`

Adicionar ao `<nav>`, após "Gerenciar avaliações":

```tsx
<Link href="/admin/settings" className="block text-sm underline text-brown">
  Configurações da loja
</Link>
```

## Testing

- TDD para `lib/store-settings.ts` (`getStoreSettings`, `updateStoreSettings`)
  com mocks do supabase client.
- `npx tsc --noEmit` e `npx vitest run` após cada task.
- Manual E2E via Claude Preview MCP:
  - Login em `/admin`, navegar para `/admin/settings`.
  - Confirmar que os 3 campos vêm preenchidos com os valores atuais do seed
    (`isOpen=true`, `prepTimeMinutes=40`, `minOrderValue=0`).
  - Alterar os 3 valores (ex: desmarcar "Loja aberta", `prepTimeMinutes=50`,
    `minOrderValue=20`), salvar, confirmar ausência de erros no
    console/servidor.
  - Recarregar a página e confirmar que os novos valores persistiram.
  - Reverter os valores para os originais do seed (`isOpen=true`,
    `prepTimeMinutes=40`, `minOrderValue=0`) ao final, para não afetar a loja
    pública (storefront usa `isOpen`/`minOrderValue` em
    `lib/validation.ts`/`InfoBar`/`CheckoutModal`).

## Self-Review

- **Spec coverage:** página `/admin/settings` ✅, formulário com 3 campos
  (`isOpen`, `prepTimeMinutes`, `minOrderValue`) ✅, `updateStoreSettings` ✅,
  RLS de update para `store_settings` ✅, link no dashboard ✅, TDD ✅, E2E
  com reversão dos valores de seed ✅.
- **Type consistency:** `StoreSettings` (já existe em `lib/types.ts`) usado
  por `getStoreSettings`/`updateStoreSettings` e por
  `app/admin/settings/page.tsx`/`StoreSettingsForm`. Assinatura de
  `updateStoreSettings` usa apenas o subconjunto de campos editáveis
  (`isOpen`, `prepTimeMinutes`, `minOrderValue`), evitando sobrescrever os
  demais campos (`heroText`, `whatsappTarget`, `paymentMethods`,
  `deliveryOptions`, `tabs`) com `update` parcial.
- **Scope:** uma migration, um módulo de dados (modificado + novo arquivo de
  teste), um componente client, uma página server, um link no dashboard — sem
  mudanças no storefront público (exceto efeito indireto dos valores
  atualizados, que já são consumidos por `getStoreSettings` em `app/page.tsx`).

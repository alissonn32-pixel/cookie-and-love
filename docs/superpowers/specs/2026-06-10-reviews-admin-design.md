# Reviews Admin (Moderação de Avaliações) Design

## Goal

Adicionar uma página `/admin/reviews` ao painel administrativo onde o
lojista possa moderar as avaliações de clientes armazenadas na tabela
`reviews` (criada na migration `0001_init.sql`, hoje sem nenhuma forma de
gerenciamento).

## Scope

- Listar todas as avaliações (`reviews`), separadas em duas seções:
  **Pendentes** (`approved = false`) e **Aprovadas** (`approved = true`).
- Cada avaliação mostra: nome do cliente, nota (estrelas), comentário e data.
- Ações disponíveis:
  - Em **Pendentes**: botão "Aprovar" → marca `approved = true`.
  - Em **Aprovadas**: botão "Ocultar" → marca `approved = false` (volta para
    Pendentes).
- Link "Gerenciar avaliações" no dashboard (`/admin`).

**Out of scope** (deferred to future work):
- Formulário no storefront para o cliente enviar uma avaliação (não existe
  política de insert pública para `reviews` e não será adicionada aqui).
- Exibição pública das avaliações aprovadas na aba "Avaliações" do
  storefront.
- Exclusão permanente de avaliações.
- Resposta do lojista a avaliações.

## Database

Nova migration `supabase/migrations/0005_reviews_admin_policies.sql`,
espelhando o padrão de `0003_products_admin_policies.sql` /
`0004_orders_admin_select_policy.sql`:

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

A política pública existente (`"Public read access to approved reviews"`,
`approved = true`) permanece inalterada.

## Types

Adicionar a `lib/types.ts`:

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

## Data layer: `lib/reviews.ts`

Segue o padrão de `lib/orders.ts` (mapeamento de `snake_case` do banco para
`camelCase` do tipo, função `mapReviewRow`).

```ts
export async function getAllReviews(client: SupabaseClient): Promise<Review[]>
```
- `select("*")`, `order("created_at", { ascending: false })`.
- Mapeia cada linha via `mapReviewRow`.
- Lança erro se `error` vier preenchido (mesmo padrão de `getRecentOrders`).

```ts
export async function setReviewApproved(
  client: SupabaseClient,
  id: string,
  approved: boolean
): Promise<void>
```
- `update({ approved }).eq("id", id)`.
- Lança erro se `error` vier preenchido.

TDD: testes com mocks do supabase client (mesmo padrão de
`lib/products.test.ts`/testes de `lib/orders.ts` se existirem) cobrindo:
- `getAllReviews` mapeia corretamente os campos (`customer_name` →
  `customerName`, `created_at` → `createdAt`, etc.) e ordena por data.
- `setReviewApproved` chama `update`/`eq` com os argumentos corretos para
  `approved = true` e `approved = false`.
- Ambas lançam erro quando o client retorna `error`.

## UI

### `components/admin/ReviewApprovalButton.tsx` (client component)

Segue o padrão de `components/admin/DeleteProductButton.tsx`:

```tsx
"use client";

interface ReviewApprovalButtonProps {
  reviewId: string;
  approved: boolean; // estado atual da review
}
```

- Se `approved === false`, renderiza botão "Aprovar" → chama
  `setReviewApproved(client, reviewId, true)`.
- Se `approved === true`, renderiza botão "Ocultar" → chama
  `setReviewApproved(client, reviewId, false)`.
- Após a chamada, `router.refresh()` (mesmo padrão do `DeleteProductButton`).
- Sem `window.confirm` (ações reversíveis, diferente de exclusão).
- Estilo: `text-xs underline text-brown` (ação positiva) para "Aprovar" e
  `text-xs underline text-taupe` para "Ocultar", consistente com os
  links/botões existentes em `/admin`.

### `app/admin/reviews/page.tsx` (server component)

- Busca `getAllReviews(client)`.
- Separa em `pending = reviews.filter(r => !r.approved)` e
  `approvedReviews = reviews.filter(r => r.approved)`.
- Renderiza duas seções com `<h2>` ("Pendentes" / "Aprovadas") e listas
  (`<ul>`/`<li>`), no mesmo estilo visual de `app/admin/orders/page.tsx`
  (border `border-beige`, `rounded`, padding, texto `text-sm`/`text-xs`,
  `text-taupe` para metadados).
- Cada item mostra:
  - Nome do cliente (`font-bold`).
  - Nota como estrelas: `"★".repeat(rating) + "☆".repeat(5 - rating)`
    (`text-taupe text-xs`, mesmo estilo de `★★★★★ 5.0` no `Header.tsx`).
  - Comentário (`text-sm`).
  - Data formatada com a mesma função `formatDate` usada em
    `/admin/orders/page.tsx` (`toLocaleString("pt-BR", { dateStyle: "short",
    timeStyle: "short" })`) — duplicar a função localmente, já que é pequena
    e não há um módulo compartilhado de utils ainda.
  - `<ReviewApprovalButton reviewId={review.id} approved={review.approved} />`.
- Estado vazio: se `pending.length === 0`, mostra "Nenhuma avaliação
  pendente." na seção Pendentes; se `approvedReviews.length === 0`, mostra
  "Nenhuma avaliação aprovada." na seção Aprovadas (em vez de omitir a
  seção).
- Link "Voltar ao painel" no rodapé, igual a `/admin/orders`.

### `app/admin/page.tsx`

Adicionar ao `<nav>`, após "Ver pedidos":

```tsx
<Link href="/admin/reviews" className="block text-sm underline text-brown">
  Gerenciar avaliações
</Link>
```

## Testing

- TDD para `lib/reviews.ts` (`getAllReviews`, `setReviewApproved`) com mocks
  do supabase client.
- `npx tsc --noEmit` e `npx vitest run` após cada task.
- Manual E2E via Claude Preview MCP:
  - Inserir 1-2 reviews de teste diretamente no Supabase (1 pendente, 1
    aprovada) antes da verificação.
  - Confirmar login em `/admin`, navegar para `/admin/reviews`.
  - Confirmar que a review pendente aparece em "Pendentes" com botão
    "Aprovar"; clicar e confirmar que ela passa para "Aprovadas" com botão
    "Ocultar".
  - Clicar em "Ocultar" e confirmar que ela volta para "Pendentes".
  - Confirmar ausência de erros no console/servidor.
  - Remover as reviews de teste do Supabase ao final (ou deixar como estão,
    a critério do verificador, já que não afetam o storefront público sem
    serem aprovadas... mas reviews aprovadas de teste não devem ficar
    publicadas — reverter para não aprovado ou excluir manualmente antes de
    finalizar).

## Self-Review

- **Spec coverage:** listagem (pendentes/aprovadas) ✅, aprovar ✅,
  reprovar/ocultar ✅, link no dashboard ✅, RLS para admin ler e atualizar
  ✅.
- **Type consistency:** `Review` em `lib/types.ts` usado por `lib/reviews.ts`
  (`getAllReviews`, `setReviewApproved`) e pela página
  `app/admin/reviews/page.tsx` / `ReviewApprovalButton`.
- **Scope:** uma migration, um arquivo de tipos (modificado), um módulo de
  dados, um componente client, uma página server, um link no dashboard — sem
  mudanças no storefront público.

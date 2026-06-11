# Site responsivo (desktop e mobile) — Design

## Goal

Hoje o site inteiro (loja pública e área administrativa) é renderizado como
uma coluna fixa de até 448px (`max-w-md`), centralizada na tela. Em telas
largas (desktop), isso resulta em uma coluna estreita no centro com grandes
áreas vazias dos dois lados. O objetivo é tornar o site responsivo: o layout
mobile atual permanece exatamente como está, e telas largas (≥1024px) passam
a aproveitar melhor o espaço disponível.

## Approach

Um único breakpoint Tailwind, `lg:` (1024px):

- Abaixo de 1024px (celular e tablet): nenhuma classe muda — layout idêntico
  ao atual.
- A partir de 1024px ("modo desktop"): containers ganham largura maior,
  paddings laterais aumentam, a grade de produtos passa de 2 para 4 colunas,
  e a barra da sacola (CartBar) vira uma barra centralizada e estreita em vez
  de esticar a tela toda.

Essa abordagem foi escolhida (entre 3 propostas) por ser a mais simples de
implementar e revisar — apenas dois estados visuais (mobile/tablet vs.
desktop) — com risco mínimo de regressão no mobile, já que nenhuma classe
mobile-first é alterada.

## Storefront (loja pública)

### `components/HomeClient.tsx`

O `<main>` que hoje é `max-w-md mx-auto pb-4` passa a ser:

```tsx
<main className="max-w-md mx-auto pb-4 lg:max-w-6xl lg:pb-8">
```

### `components/Header.tsx`, `components/InfoBar.tsx`, `components/Hero.tsx`, `components/Tabs.tsx`

Cada um já usa `px-6` para o padding lateral mobile. Adicionar `lg:px-12`
junto ao `px-6` existente, para um respiro lateral maior em telas largas
(o conteúdo interno de cada componente não muda).

Em `components/Hero.tsx`, o parágrafo da citação (`max-w-sm`) ganha
`lg:max-w-xl`:

```tsx
<p className="font-display italic text-xl leading-snug max-w-sm lg:max-w-xl">
```

### `components/ProductGrid.tsx`

A grade `grid-cols-2 gap-3.5` ganha colunas extras e gap maior no desktop:

```tsx
<div className="px-6 py-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4 lg:gap-5 lg:px-12">
```

(o `px-6`/`lg:px-12` aqui segue o mesmo padrão dos outros componentes —
`ProductGrid` ainda não tinha esse padding lateral próprio antes do `lg:`,
então adicionamos `px-6` mobile junto, que já existe hoje, e `lg:px-12`
para o desktop.)

`components/ProductCard.tsx` não precisa de nenhuma mudança — o card já se
adapta bem a colunas mais largas.

### `components/CartBar.tsx`

Hoje:

```tsx
className="sticky bottom-0 mx-6 mb-5 bg-white border border-beige rounded-md px-4 py-3 text-center text-xs text-taupe"
```
e
```tsx
className="sticky bottom-0 mx-6 mb-5 bg-brown text-cream rounded-md px-4 py-3.5 flex justify-between items-center font-mono font-bold text-xs shadow-lg w-[calc(100%-3rem)]"
```

Em telas `lg:`, a barra deixa de esticar `calc(100% - 3rem)` da largura do
`<main>` (que agora é `lg:max-w-6xl`) e passa a ficar centralizada com
largura máxima de `max-w-md`:

```tsx
className="sticky bottom-0 mx-6 mb-5 ... lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-md lg:mx-0"
```

Aplicar o mesmo ajuste `lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-md
lg:mx-0` em ambos os estados (carrinho vazio e com itens) do componente, para
que o comportamento visual seja consistente.

### `components/CheckoutModal.tsx`

Nenhuma mudança — já usa `sm:items-center` e `sm:max-w-md sm:rounded-md`, que
limitam adequadamente a largura do modal em telas maiores que o mobile.

## Páginas administrativas (`/admin/*`)

Mesmo princípio: nada muda abaixo de `lg:`. Mantém o layout empilhado de
coluna única já existente — sem virar tabelas/grades (fora de escopo desta
iteração).

- **`app/admin/page.tsx`** (dashboard, hoje `max-w-md mx-auto p-6`):
  ```tsx
  <main className="max-w-md mx-auto p-6 lg:max-w-lg">
  ```

- **`app/admin/products/page.tsx`, `app/admin/orders/page.tsx`,
  `app/admin/reviews/page.tsx`** (listas, hoje `max-w-2xl mx-auto p-6`):
  ```tsx
  <main className="max-w-2xl mx-auto p-6 lg:max-w-4xl">
  ```
  As linhas da lista (`flex justify-between items-center border ...`)
  continuam exatamente iguais — só ganham mais espaço lateral dentro do
  container mais largo.

- **`app/admin/products/new/page.tsx`, `app/admin/products/[id]/edit/page.tsx`,
  `app/admin/settings/page.tsx`** (formulários, hoje `max-w-2xl mx-auto p-6`):
  mantém `max-w-2xl` sem alteração — formulários ficam melhor um pouco mais
  estreitos, evitando inputs esticados de ponta a ponta numa tela de
  1280px+.

- **`app/admin/login/page.tsx`**: sem alteração — formulário de login já é
  naturalmente estreito.

## Testing

- Sem testes automatizados novos: mudanças são puramente classes Tailwind
  (CSS), sem lógica nova. `npx tsc --noEmit` e `npx vitest run` continuam
  passando como guarda-corpo de regressão (nenhuma mudança de comportamento
  ou tipos).
- Verificação manual via Claude Preview MCP, usando `preview_resize`:
  - **Mobile (375px):** confirmar que `/` e as páginas `/admin/*` continuam
    visualmente idênticas ao estado atual (nenhuma classe `lg:` ativa).
  - **Desktop (1280px):** confirmar em `/`:
    - Grade de produtos em 4 colunas.
    - Header, InfoBar, Hero e Tabs com padding lateral maior
      (`lg:px-12`).
    - CartBar centralizada e estreita (`lg:max-w-md`), tanto vazia quanto
      com itens no carrinho.
    - CheckoutModal continua limitado em largura ao abrir.
  - Nas páginas admin (`/admin`, `/admin/products`, `/admin/orders`,
    `/admin/reviews`, `/admin/settings`, formulário de produto): confirmar
    que ficam mais largas e legíveis em 1280px, sem quebra de layout.
- Sem necessidade de reverter dados — mudança é só de estilo, não toca em
  nenhuma tabela do banco.

## Self-Review

- **Spec coverage:** layout mobile preservado ✅, grade de produtos 4
  colunas no desktop (Opção B aprovada) ✅, CartBar centralizada e estreita
  no desktop (Opção A aprovada) ✅, páginas admin mais largas no desktop ✅,
  verificação manual em mobile e desktop ✅.
- **Type consistency:** nenhuma mudança de tipos, props ou assinaturas de
  função — apenas classes `className`.
- **Scope:** um breakpoint (`lg:`), ~10 arquivos de componentes/páginas, sem
  novos componentes, sem migrations, sem mudanças de dados. Escopo único e
  coeso, adequado para um plano de implementação.
# Painel "Meu pedido" no desktop — Design

## Goal

Hoje, no desktop, o carrinho aparece como uma barra fixa estreita embaixo da
tela (`CartBar`), centralizada, igual ao comportamento mobile. No modelo de
referência (jcookies.vercel.app), o carrinho vira um painel fixo do lado
direito, sempre visível enquanto o usuário navega pela grade de produtos. O
objetivo é replicar esse painel lateral em telas `lg:` (≥1024px), mantendo o
mobile exatamente como está.

## Approach

Adicionar um novo componente `OrderSidebar`, visível apenas em `lg:`, que
mostra os itens do carrinho, o total e um botão "Revisar pedido" que abre o
`CheckoutModal` já existente (sem alterações nele). Em paralelo, o `CartBar`
(barra fixa embaixo) ganha `lg:hidden`, já que o painel lateral assume essa
função no desktop.

Essa abordagem foi escolhida (Opção A, entre 2 propostas) por reaproveitar o
`CheckoutModal` sem duplicar o formulário de checkout — o painel lateral só
lista os itens e abre o mesmo modal de revisão que o `CartBar` já abre hoje.

## Layout geral (`HomeClient`)

A partir de `lg:`, o `<main>` passa a ter duas colunas (`lg:flex lg:gap-8`):

- **Coluna esquerda (conteúdo)**: `Header`, `InfoBar`, `ProductCarousel`,
  `Hero`, `Tabs`, `ProductGrid` — sem mudanças internas, ocupando o espaço
  restante (`flex-1`).
- **Coluna direita (`OrderSidebar`)**: largura fixa `lg:w-80`, `sticky
  top-6` para acompanhar a rolagem.

O container principal volta a `lg:max-w-6xl` (era `lg:max-w-4xl` após o
ajuste anterior), para acomodar as duas colunas — a coluna de conteúdo fica
com ~830px (parecido com o `max-w-4xl` de antes), e o painel ocupa o espaço
que antes ficava vazio.

`ProductGrid` continua em `lg:grid-cols-3 lg:gap-5 lg:px-12` — esse número de
colunas cabe bem nos ~830px da coluna de conteúdo.

No mobile/tablet (<1024px): `OrderSidebar` não é renderizado (`hidden
lg:block`); `CartBar` continua exatamente como hoje.

## `components/OrderSidebar.tsx` (novo)

Props: `cart: CartItem[]`, `total: number`, `onAdd: (productId) => void`,
`onRemove: (productId) => void`, `onReview: () => void` — usando as funções
já existentes do `useCart` (`setQty` para +/-, `onReview` igual ao usado pelo
`CartBar`).

Estrutura visual:
- `hidden lg:block lg:w-80 lg:sticky lg:top-6 lg:self-start` — card branco
  (`bg-white border border-beige rounded-md p-4`).
- Título: `<h2 className="font-display font-bold text-lg">Meu pedido</h2>`.
- **Carrinho vazio** (`cart.length === 0`): emoji 🍪 centralizado (texto
  grande) + `<p className="text-center text-xs text-taupe mt-2">Seu carrinho
  está vazio. Escolha seus cookies favoritos e monte seu pedido.</p>`.
- **Com itens**: lista (`space-y-3 mt-3`) — para cada `CartItem`:
  - Nome (`text-sm font-medium`) e preço unitário (`text-xs text-taupe
    font-mono`) à esquerda.
  - Controles `−`/qty/`+` à direita, mesmo estilo do `ProductCard`
    (`bg-brown text-cream text-xs w-6 h-6 rounded`), chamando
    `setQty(item.productId, item.qty - 1)` / `setQty(item.productId,
    item.qty + 1)`.
  - Linha "Total" (`mt-4 pt-3 border-t border-beige flex justify-between
    font-mono font-bold text-sm`).
  - Botão "Revisar pedido" (`mt-3 w-full bg-brown text-cream rounded py-2.5
    text-xs font-bold`), `onClick={onReview}`.

## `components/CartBar.tsx`

Adicionar `lg:hidden` à className raiz de ambos os estados (vazio e com
itens) — sem outras mudanças. Em `lg:`, a barra desaparece porque o
`OrderSidebar` assume sua função.

## `components/CheckoutModal.tsx`

Nenhuma mudança — continua sendo aberto tanto pelo `CartBar` (mobile) quanto
pelo `OrderSidebar` (desktop) via `onReview`/`setCheckoutOpen(true)`.

## `components/HomeClient.tsx`

- `<main>` volta a `max-w-md mx-auto pb-4 lg:max-w-6xl lg:pb-8`.
- Conteúdo principal (Header até ProductGrid/mensagem "em breve") envolvido
  em `<div className="lg:flex lg:gap-8 lg:items-start">`, com a coluna de
  conteúdo em `<div className="lg:flex-1">` e `<OrderSidebar ... />` ao
  lado.
- `useCart` continua sendo a única fonte de estado do carrinho, compartilhada
  entre `ProductGrid`, `CartBar`, `OrderSidebar` e `CheckoutModal`.

## Testing

- Sem novos testes automatizados: mudança de UI reaproveitando lógica de
  `lib/cart.ts` (já testada) via `useCart`. `npx tsc --noEmit` e `npx vitest
  run` continuam passando como guarda-corpo de regressão.
- Verificação manual via Claude Preview MCP:
  - **Mobile (375px)**: `/` idêntica ao estado atual — `CartBar` visível
    embaixo, sem `OrderSidebar`.
  - **Desktop (1280px)**:
    - `OrderSidebar` visível à direita, `sticky` ao rolar a página.
    - Carrinho vazio: mensagem "Seu carrinho está vazio...".
    - Adicionar produto pela `ProductGrid`: item aparece no painel; ajustar
      quantidade com +/- no painel reflete na grade e vice-versa.
    - Clicar "Revisar pedido" abre o `CheckoutModal` corretamente.
    - `CartBar` não aparece em desktop.

## Self-Review

- **Spec coverage:** layout de duas colunas (`lg:flex`) ✅, `OrderSidebar`
  com estado vazio e com itens (lista detalhada + `+`/`-`) ✅, `CartBar`
  oculto em desktop (`lg:hidden`) ✅, `CheckoutModal` reaproveitado sem
  alterações ✅, container `lg:max-w-6xl` e grade `lg:grid-cols-3` ✅,
  verificação manual mobile + desktop ✅.
- **Type consistency:** `OrderSidebar` usa `CartItem` (`productId`, `name`,
  `price`, `qty`) e funções já existentes de `useCart` (`setQty`, sem
  precisar de `Product`) — nenhum tipo novo necessário.
- **Scope:** 1 componente novo (`OrderSidebar`), ajustes em `HomeClient` e
  `CartBar`, sem mudanças em `CheckoutModal`, sem novos dados/migrations.
  Escopo único e coeso.

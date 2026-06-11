# Navegação por seções com scroll — Design

## Goal

Hoje, ao clicar numa aba (Destaques, Cookies, Especiais da Casa, Avaliações,
Informações), o conteúdo da página troca — só a grade de produtos da
categoria selecionada é exibida, escondendo as demais. No modelo de
referência (jcookies.vercel.app), todas as seções ficam empilhadas na página
e clicar numa aba apenas rola (scroll) suavemente até a seção
correspondente. O objetivo é replicar esse comportamento.

## Approach

`HomeClient` passa a renderizar uma `<section>` por aba (na ordem de
`storeSettings.tabs`), cada uma com `id` igual ao id da aba e título
(`tab.label`). Para abas com categoria mapeada (`destaques`, `cookies`,
`especiais`), a seção mostra `ProductGrid` filtrado por categoria (mesma
lógica de filtro de hoje). Para `avaliações`/`informações`, a seção mostra o
mesmo placeholder atual ("Conteúdo desta seção em breve.").

A barra de abas (`Tabs`) fica `sticky top-0` com fundo sólido (`bg-cream`).
Clicar numa aba faz `scrollIntoView({ behavior: "smooth", block: "start" })`
até a seção correspondente, e atualiza `activeTab` (destaque visual) — sem
scroll-spy (o destaque só muda no clique, não ao rolar manualmente). Cada
seção recebe `scroll-mt-16` para compensar a altura da barra sticky.

## `components/Tabs.tsx`

- Container: adicionar `sticky top-0 z-10 bg-cream` à className existente
  (`flex gap-6 px-6 mt-5 border-b border-beige overflow-x-auto lg:px-12`).
- `onClick` de cada botão: além de `onChange(tab.id)` (mantém o destaque
  visual via `activeTab`), chama
  `document.getElementById(tab.id)?.scrollIntoView({ behavior: "smooth", block: "start" })`.
- Nenhuma mudança de props — `activeTab`/`onChange` continuam com a mesma
  assinatura.

## `components/HomeClient.tsx`

- Remove a renderização condicional única (`category` / `visibleProducts` /
  `ProductGrid` ou placeholder).
- Adiciona, dentro da coluna de conteúdo (`<div className="lg:flex-1">`),
  após `<Tabs ... />`, um bloco que itera `storeSettings.tabs` e renderiza
  para cada `tab`:
  - `<section id={tab.id} className="scroll-mt-16">`
  - Título: `<h2 className="font-display font-bold text-lg px-6 pt-6 lg:px-12">{tab.label}</h2>`
  - Se `TAB_TO_CATEGORY[tab.id]` existe: `<ProductGrid products={products.filter(p => p.active && p.category === TAB_TO_CATEGORY[tab.id])} cart={cart} onAdd={add} onRemove={remove} />`
  - Senão: `<div className="px-6 py-8 text-sm text-taupe lg:px-12">Conteúdo desta seção em breve.</div>`
  - Fecha `</section>`
- `activeTab`/`setActiveTab` continuam existindo (controlam só o destaque
  visual da aba ativa, atualizados no clique via `Tabs`).
- Sem mudanças em `OrderSidebar`, `CartBar`, `CheckoutModal`,
  `ProductCarousel`, `Header`, `InfoBar`, `Hero`.

## Testing

- Sem novos testes automatizados unitários: mudança de UI/navegação que
  depende de `scrollIntoView` (não testável de forma significativa em
  jsdom). `npx tsc --noEmit` e `npx vitest run` continuam passando como
  guarda-corpo de regressão (57/57).
- Verificação manual via Claude Preview MCP (mobile 375px e desktop 1280px):
  - Todas as seções (Destaques, Cookies, Especiais da Casa, Avaliações,
    Informações) aparecem empilhadas na página, cada uma com seu título.
  - A barra de abas permanece visível (sticky) ao rolar a página.
  - Clicar em cada aba rola suavemente até a seção correspondente, com o
    título da seção visível abaixo da barra de abas (não escondido atrás
    dela) — ajustar `scroll-mt-16` se necessário.
  - A aba clicada fica destacada (cor/borda ativa); rolar manualmente não
    altera o destaque.
  - Seções com categoria mapeada mostram os produtos corretos; seções sem
    categoria mostram o placeholder.
  - `OrderSidebar`/`CartBar` continuam funcionando normalmente.

## Self-Review

- **Spec coverage:** seções empilhadas com título ✅, barra de abas sticky
  ✅, scroll suave ao clicar ✅, destaque só no clique (sem scroll-spy) ✅,
  `scroll-mt` para compensar barra fixa ✅, abas sem categoria mostram
  placeholder ✅.
- **Type consistency:** nenhum tipo novo — `TabConfig`, `Product`,
  `CartItem` já existentes, usados como hoje.
- **Scope:** 2 arquivos modificados (`Tabs.tsx`, `HomeClient.tsx`), sem
  novos componentes, sem mudanças de dados/migrations. Escopo único e
  coeso.

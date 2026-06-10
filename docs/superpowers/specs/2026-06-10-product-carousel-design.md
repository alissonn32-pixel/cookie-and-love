# Product Carousel ("Mais Pedidos") Design

## Goal

Add a horizontal carousel of the store's most-ordered products near the top
of the storefront, replacing the empty banner space below the header, so
customers immediately see appealing product photos and want to order.

## Scope

- Carousel shows products where `active === true && badge === "mais_vendido"`.
- Each slide shows the product photo (or a placeholder if no photo), name,
  price, and a "MAIS PEDIDO" badge overlay.
- Auto-play advances slides every ~4s, wraps around at the end.
- Manual swipe/drag (native scroll-snap) lets the user navigate; interacting
  pauses auto-play, which resumes after a few seconds of inactivity.
- Dot indicators below the carousel show the current slide.
- If there are zero featured products, the carousel renders nothing (no
  empty space).

**Out of scope** (deferred to future work):
- Tapping a slide to scroll to / open that product's detail.
- A dedicated "carousel order" field — uses the existing `badge` field.
- Uploading/cropping product photos (existing admin product form already has
  an `imageUrl` field; this spec just renders whatever is there).

## Data layer

Add to `lib/products.ts`:

```ts
export function getFeaturedProducts(products: Product[]): Product[] {
  return products.filter((p) => p.active && p.badge === "mais_vendido");
}
```

- Pure function, no Supabase call — operates on the `products` array
  `HomeClient` already has.
- TDD in `lib/products.test.ts`: returns only active products with
  `badge === "mais_vendido"`, returns `[]` when none match, preserves order.

## Component: `components/ProductCarousel.tsx`

Client component (`"use client"`).

```ts
interface ProductCarouselProps {
  products: Product[];
}
```

- Returns `null` if `products.length === 0`.
- Outer container: horizontal scroll container with
  `overflow-x-auto snap-x snap-mandatory flex` and `scrollbar-hide` (hide
  scrollbar via existing Tailwind/global CSS utility, or inline style if no
  utility exists).
- Each slide: `snap-center w-full shrink-0 relative h-48` (matches the
  approximate height of a banner image).
  - Image: `next/image` with `src={product.imageUrl}`, `fill`,
    `className="object-cover"`. On `onError`, swap to the same gradient +
    🍪 emoji placeholder used in `ProductCard`
    (`bg-gradient-to-br from-[#d9a05b] via-[#a85f2c] to-[#6b3a17] flex
    items-center justify-center text-6xl`). Implement via local state
    `imgError` per slide (small inline sub-component or inline ternary).
  - Overlay (bottom-left, dark gradient scrim for legibility): product name
    (`font-display font-bold text-lg text-cream`), price
    (`R$ {price.toFixed(2)}`, `font-mono text-sm text-cream`), and a
    "MAIS PEDIDO" badge (top-right, same style as `ProductCard`'s badge:
    `bg-brown text-cream text-[9px] px-2 py-1 rounded-full tracking-widest`).
- Dot indicators: row of buttons below the carousel, one per product,
  `w-2 h-2 rounded-full`, active dot `bg-brown`, inactive `bg-beige`.
  Clicking a dot scrolls to that slide (`scrollTo({ left: index * width,
  behavior: "smooth" })`).
- Active index tracking: `onScroll` handler on the container computes
  `Math.round(scrollLeft / clientWidth)` and updates `activeIndex` state
  (debounced via the scroll event itself, no extra library).
- Auto-play: `useEffect` sets `setInterval(() => scrollToIndex((activeIndex
  + 1) % products.length), 4000)`. Cleared on unmount and reset whenever
  `activeIndex` changes (so manual navigation restarts the timer, giving the
  "pause on interaction" behavior naturally — no separate pause flag needed).
- If `products.length === 1`, no dots/auto-play needed — render the single
  slide statically (auto-play interval just re-scrolls to the same slide,
  which is harmless, but we'll skip setting the interval when length <= 1).

## Integration

`components/HomeClient.tsx`:

```ts
import { ProductCarousel } from "@/components/ProductCarousel";
import { getFeaturedProducts } from "@/lib/products";
```

```tsx
<Header />
<InfoBar settings={storeSettings} />
<ProductCarousel products={getFeaturedProducts(products)} />
<Hero text={storeSettings.heroText} />
```

## Testing

- TDD for `getFeaturedProducts` (pure function, easy to unit test).
- `npx tsc --noEmit` and `npx vitest run` after each task.
- Manual E2E verification via Claude Preview MCP:
  - With the current seed data (1 product has `badge: "mais_vendido"`),
    confirm a single static slide renders with placeholder (🍪 gradient,
    since `/products/*.jpg` doesn't exist), name, price, "MAIS PEDIDO" badge.
  - Temporarily mark a second product as `mais_vendido` (via admin or direct
    DB edit) and confirm: two dots appear, auto-play advances between them
    every ~4s, manual swipe/drag works, dots update to match.
  - Confirm no console/server errors.

## Self-Review

- **Spec coverage:** featured-product filter ✅, photo + placeholder fallback
  ✅, auto-play + manual swipe ✅, dot indicators ✅, empty state (no
  featured products → nothing rendered) ✅, positioning between InfoBar and
  Hero ✅.
- **Type consistency:** `getFeaturedProducts` takes/returns `Product[]` from
  `lib/types.ts`, matching `HomeClient`'s existing `products` prop.
- **Scope:** single focused component + one pure helper function; no new
  DB columns, no new admin UI, no routing changes.

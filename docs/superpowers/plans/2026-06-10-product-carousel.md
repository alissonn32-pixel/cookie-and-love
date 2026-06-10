# Product Carousel ("Mais Pedidos") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a horizontal, auto-playing carousel of "mais pedidos" products between the Header/InfoBar and the Hero on the storefront home page.

**Architecture:** A pure helper `getFeaturedProducts` filters the existing `products` array for `active && badge === "mais_vendido"`. A new client component `ProductCarousel` renders those products in a scroll-snap horizontal track with auto-play, manual swipe, and dot indicators, falling back to a gradient+emoji placeholder when a product image fails to load.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Vitest, `next/image`.

---

### Task 1: `getFeaturedProducts` helper (TDD)

**Files:**
- Modify: `lib/products.ts`
- Test: `lib/products.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to the bottom of `lib/products.test.ts`:

```ts
describe("getFeaturedProducts", () => {
  it("returns only active products with badge 'mais_vendido'", () => {
    const products: Product[] = [
      {
        id: "a",
        name: "A",
        description: "A desc",
        price: 10,
        imageUrl: "/products/a.jpg",
        category: "destaque",
        badge: "mais_vendido",
        stockToday: null,
        active: true,
      },
      {
        id: "b",
        name: "B",
        description: "B desc",
        price: 11,
        imageUrl: "/products/b.jpg",
        category: "cookie",
        badge: "novo",
        stockToday: null,
        active: true,
      },
      {
        id: "c",
        name: "C",
        description: "C desc",
        price: 12,
        imageUrl: "/products/c.jpg",
        category: "destaque",
        badge: "mais_vendido",
        stockToday: null,
        active: false,
      },
    ];

    expect(getFeaturedProducts(products)).toEqual([products[0]]);
  });

  it("returns an empty array when no product matches", () => {
    const products: Product[] = [
      {
        id: "a",
        name: "A",
        description: "A desc",
        price: 10,
        imageUrl: "/products/a.jpg",
        category: "destaque",
        badge: "novo",
        stockToday: null,
        active: true,
      },
    ];

    expect(getFeaturedProducts(products)).toEqual([]);
  });
});
```

Add `getFeaturedProducts` to the import at the top of `lib/products.test.ts`:

```ts
import { getProducts, getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getFeaturedProducts } from "./products";
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/products.test.ts`
Expected: FAIL with "getFeaturedProducts is not a function" (or similar export error)

- [ ] **Step 3: Implement `getFeaturedProducts`**

Add to `lib/products.ts` (after the existing `mapRow`/`toRow` functions, before `getProducts`):

```ts
export function getFeaturedProducts(products: Product[]): Product[] {
  return products.filter((p) => p.active && p.badge === "mais_vendido");
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/products.test.ts`
Expected: PASS (all tests in the file, including the two new ones)

- [ ] **Step 5: Commit**

```bash
git add lib/products.ts lib/products.test.ts
git commit -m "feat: add getFeaturedProducts helper"
```

---

### Task 2: Hide scrollbar utility class

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add the `.scrollbar-hide` utility**

Append to `app/globals.css` (after the existing `.deli-stripe` rule):

```css
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "style: add scrollbar-hide utility"
```

---

### Task 3: `ProductCarousel` component

**Files:**
- Create: `components/ProductCarousel.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Product } from "@/lib/types";

const AUTOPLAY_INTERVAL_MS = 4000;

function CarouselSlide({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="snap-center w-full shrink-0 relative h-48">
      {imgError ? (
        <div className="absolute inset-0 bg-gradient-to-br from-[#d9a05b] via-[#a85f2c] to-[#6b3a17] flex items-center justify-center text-6xl">
          🍪
        </div>
      ) : (
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
        />
      )}
      <span className="absolute top-2 right-2 bg-brown text-cream text-[9px] px-2 py-1 rounded-full tracking-widest">
        MAIS PEDIDO
      </span>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <h3 className="font-display font-bold text-lg text-cream">{product.name}</h3>
        <p className="font-mono text-sm text-cream">R$ {product.price.toFixed(2)}</p>
      </div>
    </div>
  );
}

export function ProductCarousel({ products }: { products: Product[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToIndex = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ left: index * container.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    if (products.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % products.length;
        scrollToIndex(next);
        return next;
      });
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [activeIndex, products.length]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const index = Math.round(container.scrollLeft / container.clientWidth);
    setActiveIndex(index);
  };

  if (products.length === 0) return null;

  return (
    <div className="mt-4">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        {products.map((product) => (
          <CarouselSlide key={product.id} product={product} />
        ))}
      </div>
      {products.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {products.map((_, index) => (
            <button
              key={index}
              aria-label={`Ir para slide ${index + 1}`}
              onClick={() => {
                scrollToIndex(index);
                setActiveIndex(index);
              }}
              className={`w-2 h-2 rounded-full ${
                index === activeIndex ? "bg-brown" : "bg-beige"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/ProductCarousel.tsx
git commit -m "feat: add ProductCarousel component"
```

---

### Task 4: Integrate carousel into the home page

**Files:**
- Modify: `components/HomeClient.tsx`

- [ ] **Step 1: Import the new component and helper**

In `components/HomeClient.tsx`, update the imports at the top:

```tsx
import { Header } from "@/components/Header";
import { InfoBar } from "@/components/InfoBar";
import { ProductCarousel } from "@/components/ProductCarousel";
import { Hero } from "@/components/Hero";
import { Tabs } from "@/components/Tabs";
import { ProductGrid } from "@/components/ProductGrid";
import { CartBar } from "@/components/CartBar";
import { CheckoutModal } from "@/components/CheckoutModal";
import { useCart } from "@/hooks/useCart";
import { Product, StoreSettings } from "@/lib/types";
import { getFeaturedProducts } from "@/lib/products";
```

- [ ] **Step 2: Render the carousel between InfoBar and Hero**

Change:

```tsx
      <Header />
      <InfoBar settings={storeSettings} />
      <Hero text={storeSettings.heroText} />
```

to:

```tsx
      <Header />
      <InfoBar settings={storeSettings} />
      <ProductCarousel products={getFeaturedProducts(products)} />
      <Hero text={storeSettings.heroText} />
```

- [ ] **Step 3: Run typecheck and full test suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: No type errors, all tests pass

- [ ] **Step 4: Commit**

```bash
git add components/HomeClient.tsx
git commit -m "feat: show product carousel on home page"
```

---

### Task 5: Manual end-to-end verification

**No file changes** — verification only, using the Claude Preview MCP tools against the running dev server.

- [ ] **Step 1: Reload the preview and confirm the single-slide case**

With the seed data (only "Big Apple Choc Chunk" has `badge: "mais_vendido"`), reload the page (`preview_eval` with `window.location.reload()`).

Use `preview_snapshot` and `preview_eval` (bounding boxes, as done earlier in this session) to confirm:
- A carousel slide renders below the InfoBar, above the Hero quote.
- Since `/products/big-apple-choc-chunk.jpg` does not exist, the 🍪 gradient placeholder is shown (image `onError` fired).
- The slide shows "Big Apple Choc Chunk", "R$ 12.90", and a "MAIS PEDIDO" badge.
- No dot indicators are rendered (only one product).
- No console errors via `preview_console_logs`.

- [ ] **Step 2: Add a second featured product and confirm multi-slide behavior**

Temporarily mark a second seed product (e.g. "Brooklyn Red Velvet") as `badge = 'mais_vendido'` directly in Supabase (via the admin product edit page at `/admin/products`, or a one-off SQL update through the Supabase dashboard).

Reload the page and confirm via `preview_snapshot`/`preview_eval`:
- Two dot indicators are rendered.
- Clicking the second dot (`preview_click` on the second `button[aria-label="Ir para slide 2"]`) scrolls to the second slide and updates the active dot.
- After ~4-5 seconds without interaction, the active index advances automatically (re-check `activeIndex` via a `preview_eval` reading the active dot's class, or just confirm the interval logic by code review since headless timing can be flaky).
- No console errors.

- [ ] **Step 3: Revert the temporary seed change**

If a second product was marked `mais_vendido` for testing, revert it back to its original badge (`novo` for "Brooklyn Red Velvet") so the seed data matches `supabase/migrations/0001_init.sql`.

- [ ] **Step 4: Report results**

Summarize what was verified and any issues found. If issues are found, fix them and re-run the relevant verification steps.

---

## Self-Review

- **Spec coverage:** featured-product filter (Task 1) ✅, photo + placeholder fallback (Task 3) ✅, auto-play + manual swipe + dots (Task 3) ✅, empty state via early `return null` (Task 3) ✅, positioning between InfoBar and Hero (Task 4) ✅, manual E2E (Task 5) ✅.
- **Type consistency:** `getFeaturedProducts(products: Product[]): Product[]` matches `HomeClient`'s existing `products: Product[]` prop and `ProductCarousel`'s `products: Product[]` prop.
- **Scope:** 5 small tasks, each independently testable/committable; no DB schema changes, no new admin UI.

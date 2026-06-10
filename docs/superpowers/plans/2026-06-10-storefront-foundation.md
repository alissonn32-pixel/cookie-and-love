# Cookie & Love — Storefront Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working Next.js storefront for "Cookie & Love" with the "NYC Artisan" (light) design system, a placeholder menu, a cart, and a checkout flow that generates a WhatsApp order link.

**Architecture:** Next.js (App Router) + TypeScript + Tailwind CSS, single public page (`app/page.tsx`) composed of presentational components. Cart/order/validation logic lives in pure, unit-tested functions under `lib/`, wrapped by a `useCart` hook that persists to `localStorage`. No backend yet — products and store settings come from static placeholder data in `lib/`, structured to match the Supabase schema defined in the design spec so Plan 2 can swap the data source without changing component interfaces.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4, Vitest + Testing Library for unit tests, `next/font/google` for Fraunces + Space Mono.

**Reference spec:** `docs/superpowers/specs/2026-06-10-cookie-and-love-design.md`

---

## File Structure

```
package.json
tsconfig.json
next.config.ts
postcss.config.mjs
tailwind.config.ts (if needed for v4 theme tokens)
vitest.config.ts
vitest.setup.ts
app/
  layout.tsx
  globals.css
  page.tsx
lib/
  types.ts
  products.ts
  store-settings.ts
  cart.ts
  cart.test.ts
  whatsapp.ts
  whatsapp.test.ts
  validation.ts
  validation.test.ts
hooks/
  useCart.ts
components/
  Header.tsx
  InfoBar.tsx
  Hero.tsx
  Tabs.tsx
  ProductCard.tsx
  ProductGrid.tsx
  CartBar.tsx
  CheckoutModal.tsx
```

---

### Task 1: Scaffold the Next.js project

**Files:**
- Create: project root files via `create-next-app` (`package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `postcss.config.mjs`, `.eslintrc`/`eslint.config.mjs`)

- [ ] **Step 1: Run create-next-app**

Run from `C:\Users\Pichau\Documents\PROJETOS CLAUDE\LOJA DE COOKIES`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-npm
```

When prompted about the existing `.git`/`docs`/`.gitignore`/`.superpowers` files in a non-empty directory, choose to continue (it will only add new files, not overwrite `docs/` or `.gitignore`). If `create-next-app` refuses to run in a non-empty directory, instead run it in a temp folder and move the generated files into the project root, merging `.gitignore` manually (keep the existing entries plus the Next.js-specific ones it adds).

Expected: A working Next.js app skeleton with `package.json`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `tailwind.config.ts` (or Tailwind v4 config in `globals.css`), `tsconfig.json`.

- [ ] **Step 2: Verify dev server runs**

Run: `npm run dev`

Expected: Server starts on `http://localhost:3000` without errors. Stop it with Ctrl+C after confirming.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with TypeScript and Tailwind"
```

---

### Task 2: Configure design tokens (NYC Artisan light theme)

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add Google Fonts via next/font in `app/layout.tsx`**

Replace the contents of `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Fraunces, Space_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "900"],
  style: ["normal", "italic"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Cookie & Love",
  description: "Cookies artesanais estilo Nova York — crocantes por fora, derretendo por dentro.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${fraunces.variable} ${spaceMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Define color tokens and base styles in `app/globals.css`**

Replace the contents of `app/globals.css` with:

```css
@import "tailwindcss";

@theme {
  --color-cream: #faf3e8;
  --color-brown: #2a1c12;
  --color-caramel: #c8783c;
  --color-beige: #e3cdb6;
  --color-taupe: #a08a76;

  --font-display: var(--font-fraunces), serif;
  --font-mono: var(--font-space-mono), monospace;
}

body {
  background-color: var(--color-cream);
  color: var(--color-brown);
  font-family: var(--font-mono);
}

.font-display {
  font-family: var(--font-display);
}

.deli-stripe {
  height: 8px;
  background-image: repeating-linear-gradient(
    45deg,
    var(--color-caramel) 0 14px,
    var(--color-cream) 14px 28px
  );
}
```

If `npx create-next-app@latest` generated a Tailwind v3 project instead of v4 (check whether `app/globals.css` contains `@tailwind base;` directives), use this Tailwind v3-compatible version of `app/globals.css` instead:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-cream: #faf3e8;
  --color-brown: #2a1c12;
  --color-caramel: #c8783c;
  --color-beige: #e3cdb6;
  --color-taupe: #a08a76;
}

body {
  background-color: var(--color-cream);
  color: var(--color-brown);
  font-family: var(--font-space-mono), monospace;
}

.font-display {
  font-family: var(--font-fraunces), serif;
}

.deli-stripe {
  height: 8px;
  background-image: repeating-linear-gradient(
    45deg,
    var(--color-caramel) 0 14px,
    var(--color-cream) 14px 28px
  );
}
```

and add a `tailwind.config.ts` at the project root with:

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#faf3e8",
        brown: "#2a1c12",
        caramel: "#c8783c",
        beige: "#e3cdb6",
        taupe: "#a08a76",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        mono: ["var(--font-space-mono)", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 3: Verify it builds**

Run: `npm run dev`, open `http://localhost:3000`.

Expected: Page background is cream-colored (no errors in terminal). Stop the server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: configure NYC Artisan design tokens and fonts"
```

---

### Task 3: Define shared types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Write the types file**

```ts
export type ProductCategory = "destaque" | "cookie" | "especial";
export type ProductBadge = "novo" | "mais_vendido" | null;

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: ProductCategory;
  badge: ProductBadge;
  stockToday: number | null; // null = unlimited, 0 = sold out
  active: boolean;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export type DeliveryType = "retirada" | "entrega";
export type PaymentMethod = "pix" | "dinheiro" | "cartao";

export interface OrderDetails {
  customerName: string;
  whatsapp: string;
  pickupTime: string;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface TabConfig {
  id: string;
  label: string;
}

export interface StoreSettings {
  isOpen: boolean;
  prepTimeMinutes: number;
  minOrderValue: number;
  heroText: string;
  whatsappTarget: string;
  paymentMethods: PaymentMethod[];
  deliveryOptions: DeliveryType[];
  tabs: TabConfig[];
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add shared domain types"
```

---

### Task 4: Add placeholder data (products and store settings)

**Files:**
- Create: `lib/products.ts`
- Create: `lib/store-settings.ts`

- [ ] **Step 1: Write placeholder products**

```ts
import { Product } from "./types";

export const products: Product[] = [
  {
    id: "big-apple-choc-chunk",
    name: "Big Apple Choc Chunk",
    description: "Massa amanteigada com gotas de chocolate belga",
    price: 12.9,
    imageUrl: "/products/big-apple-choc-chunk.jpg",
    category: "destaque",
    badge: "mais_vendido",
    stockToday: null,
    active: true,
  },
  {
    id: "brooklyn-red-velvet",
    name: "Brooklyn Red Velvet",
    description: "Cookie red velvet com recheio de cream cheese",
    price: 13.9,
    imageUrl: "/products/brooklyn-red-velvet.jpg",
    category: "destaque",
    badge: "novo",
    stockToday: null,
    active: true,
  },
  {
    id: "central-park-oatmeal",
    name: "Central Park Oatmeal",
    description: "Aveia, canela e passas, textura macia",
    price: 11.9,
    imageUrl: "/products/central-park-oatmeal.jpg",
    category: "cookie",
    badge: null,
    stockToday: null,
    active: true,
  },
  {
    id: "harlem-peanut-butter",
    name: "Harlem Peanut Butter",
    description: "Pasta de amendoim com gotas de chocolate ao leite",
    price: 13.5,
    imageUrl: "/products/harlem-peanut-butter.jpg",
    category: "cookie",
    badge: null,
    stockToday: 0,
    active: true,
  },
  {
    id: "soho-triple-chocolate",
    name: "SoHo Triple Chocolate",
    description: "Massa de cacau com três tipos de chocolate",
    price: 14.9,
    imageUrl: "/products/soho-triple-chocolate.jpg",
    category: "especial",
    badge: "mais_vendido",
    stockToday: 5,
    active: true,
  },
  {
    id: "tribeca-salted-caramel",
    name: "Tribeca Salted Caramel",
    description: "Recheio de doce de leite com flor de sal",
    price: 15.9,
    imageUrl: "/products/tribeca-salted-caramel.jpg",
    category: "especial",
    badge: "novo",
    stockToday: null,
    active: true,
  },
];
```

- [ ] **Step 2: Write placeholder store settings**

```ts
import { StoreSettings } from "./types";

export const storeSettings: StoreSettings = {
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
    { id: "especiais", label: "Especiais da casa" },
    { id: "avaliacoes", label: "Avaliações" },
    { id: "informacoes", label: "Informações" },
  ],
};
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add lib/products.ts lib/store-settings.ts
git commit -m "feat: add placeholder product catalog and store settings"
```

---

### Task 5: Set up Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest and Testing Library**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add a `test` script to `package.json`**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 5: Verify Vitest runs with no tests**

Run: `npm test`

Expected: Output shows "No test files found" (exit code may be non-zero — that's expected at this point since there are no tests yet).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: configure Vitest with Testing Library"
```

---

### Task 6: Cart logic (TDD)

**Files:**
- Create: `lib/cart.ts`
- Test: `lib/cart.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from "vitest";
import { addItem, removeItem, updateQty, cartTotal } from "./cart";
import { CartItem, Product } from "./types";

const cookie: Product = {
  id: "big-apple-choc-chunk",
  name: "Big Apple Choc Chunk",
  description: "Massa amanteigada com gotas de chocolate belga",
  price: 12.9,
  imageUrl: "/products/big-apple-choc-chunk.jpg",
  category: "destaque",
  badge: "mais_vendido",
  stockToday: null,
  active: true,
};

const otherCookie: Product = {
  ...cookie,
  id: "brooklyn-red-velvet",
  name: "Brooklyn Red Velvet",
  price: 13.9,
};

describe("addItem", () => {
  it("adds a new product to an empty cart with qty 1", () => {
    const result = addItem([], cookie);
    expect(result).toEqual<CartItem[]>([
      { productId: "big-apple-choc-chunk", name: "Big Apple Choc Chunk", price: 12.9, qty: 1 },
    ]);
  });

  it("increments qty if the product is already in the cart", () => {
    const cart = addItem([], cookie);
    const result = addItem(cart, cookie);
    expect(result).toEqual<CartItem[]>([
      { productId: "big-apple-choc-chunk", name: "Big Apple Choc Chunk", price: 12.9, qty: 2 },
    ]);
  });

  it("adds a second distinct product as a separate line", () => {
    const cart = addItem([], cookie);
    const result = addItem(cart, otherCookie);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual<CartItem>({
      productId: "brooklyn-red-velvet",
      name: "Brooklyn Red Velvet",
      price: 13.9,
      qty: 1,
    });
  });
});

describe("removeItem", () => {
  it("removes the line for the given productId", () => {
    const cart = addItem(addItem([], cookie), otherCookie);
    const result = removeItem(cart, "big-apple-choc-chunk");
    expect(result).toEqual<CartItem[]>([
      { productId: "brooklyn-red-velvet", name: "Brooklyn Red Velvet", price: 13.9, qty: 1 },
    ]);
  });

  it("is a no-op if the productId is not in the cart", () => {
    const cart = addItem([], cookie);
    const result = removeItem(cart, "does-not-exist");
    expect(result).toEqual(cart);
  });
});

describe("updateQty", () => {
  it("updates the quantity for the given productId", () => {
    const cart = addItem([], cookie);
    const result = updateQty(cart, "big-apple-choc-chunk", 5);
    expect(result[0].qty).toBe(5);
  });

  it("removes the line entirely when qty is set to 0", () => {
    const cart = addItem([], cookie);
    const result = updateQty(cart, "big-apple-choc-chunk", 0);
    expect(result).toEqual([]);
  });
});

describe("cartTotal", () => {
  it("returns 0 for an empty cart", () => {
    expect(cartTotal([])).toBe(0);
  });

  it("sums price * qty across all items", () => {
    const cart: CartItem[] = [
      { productId: "a", name: "A", price: 12.9, qty: 2 },
      { productId: "b", name: "B", price: 13.9, qty: 1 },
    ];
    expect(cartTotal(cart)).toBeCloseTo(39.7, 5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL — `lib/cart.ts` does not exist / exports not found.

- [ ] **Step 3: Implement `lib/cart.ts`**

```ts
import { CartItem, Product } from "./types";

export function addItem(cart: CartItem[], product: Product, qty = 1): CartItem[] {
  const existing = cart.find((item) => item.productId === product.id);
  if (existing) {
    return cart.map((item) =>
      item.productId === product.id ? { ...item, qty: item.qty + qty } : item
    );
  }
  return [
    ...cart,
    { productId: product.id, name: product.name, price: product.price, qty },
  ];
}

export function removeItem(cart: CartItem[], productId: string): CartItem[] {
  return cart.filter((item) => item.productId !== productId);
}

export function updateQty(cart: CartItem[], productId: string, qty: number): CartItem[] {
  if (qty <= 0) {
    return removeItem(cart, productId);
  }
  return cart.map((item) => (item.productId === productId ? { ...item, qty } : item));
}

export function cartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`

Expected: All tests in `lib/cart.test.ts` PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/cart.ts lib/cart.test.ts
git commit -m "feat: add cart manipulation and total logic"
```

---

### Task 7: WhatsApp message generation (TDD)

**Files:**
- Create: `lib/whatsapp.ts`
- Test: `lib/whatsapp.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from "vitest";
import { buildOrderMessage, buildWhatsAppLink } from "./whatsapp";
import { CartItem, OrderDetails } from "./types";

const cart: CartItem[] = [
  { productId: "big-apple-choc-chunk", name: "Big Apple Choc Chunk", price: 12.9, qty: 2 },
  { productId: "brooklyn-red-velvet", name: "Brooklyn Red Velvet", price: 13.9, qty: 1 },
];

const order: OrderDetails = {
  customerName: "Maria Silva",
  whatsapp: "5511999998888",
  pickupTime: "18:30",
  deliveryType: "retirada",
  paymentMethod: "pix",
  notes: "Sem nozes, por favor",
};

describe("buildOrderMessage", () => {
  it("includes each item with quantity and subtotal", () => {
    const message = buildOrderMessage(cart, order, 39.7);
    expect(message).toContain("2x Big Apple Choc Chunk - R$ 25.80");
    expect(message).toContain("1x Brooklyn Red Velvet - R$ 13.90");
  });

  it("includes the total, customer name, pickup time, delivery type and payment method", () => {
    const message = buildOrderMessage(cart, order, 39.7);
    expect(message).toContain("Total: R$ 39.70");
    expect(message).toContain("Maria Silva");
    expect(message).toContain("18:30");
    expect(message).toContain("Retirada");
    expect(message).toContain("Pix");
  });

  it("includes notes when present and omits the notes line when absent", () => {
    const withNotes = buildOrderMessage(cart, order, 39.7);
    expect(withNotes).toContain("Sem nozes, por favor");

    const withoutNotes = buildOrderMessage(cart, { ...order, notes: undefined }, 39.7);
    expect(withoutNotes).not.toContain("Observações:");
  });
});

describe("buildWhatsAppLink", () => {
  it("builds a wa.me link with the URL-encoded message", () => {
    const link = buildWhatsAppLink("5500000000000", "Olá! Pedido: 1x Cookie");
    expect(link).toBe(
      "https://wa.me/5500000000000?text=Ol%C3%A1!%20Pedido%3A%201x%20Cookie"
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL — `lib/whatsapp.ts` does not exist.

- [ ] **Step 3: Implement `lib/whatsapp.ts`**

```ts
import { CartItem, OrderDetails, DeliveryType, PaymentMethod } from "./types";

const DELIVERY_LABELS: Record<DeliveryType, string> = {
  retirada: "Retirada",
  entrega: "Entrega",
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
};

export function buildOrderMessage(
  cart: CartItem[],
  order: OrderDetails,
  total: number
): string {
  const lines: string[] = [];

  lines.push("Olá! Gostaria de fazer o seguinte pedido:");
  lines.push("");

  for (const item of cart) {
    const subtotal = (item.price * item.qty).toFixed(2);
    lines.push(`${item.qty}x ${item.name} - R$ ${subtotal}`);
  }

  lines.push("");
  lines.push(`Total: R$ ${total.toFixed(2)}`);
  lines.push("");
  lines.push(`Nome: ${order.customerName}`);
  lines.push(`Horário desejado: ${order.pickupTime}`);
  lines.push(`Entrega: ${DELIVERY_LABELS[order.deliveryType]}`);
  lines.push(`Pagamento: ${PAYMENT_LABELS[order.paymentMethod]}`);

  if (order.notes) {
    lines.push(`Observações: ${order.notes}`);
  }

  return lines.join("\n");
}

export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`

Expected: All tests in `lib/whatsapp.test.ts` PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/whatsapp.ts lib/whatsapp.test.ts
git commit -m "feat: add WhatsApp order message and link generation"
```

---

### Task 8: Order validation (TDD)

**Files:**
- Create: `lib/validation.ts`
- Test: `lib/validation.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from "vitest";
import { isStoreOpen, meetsMinimumOrder, minimumOrderShortfall } from "./validation";
import { StoreSettings } from "./types";

const baseSettings: StoreSettings = {
  isOpen: true,
  prepTimeMinutes: 40,
  minOrderValue: 20,
  heroText: "Crocante por fora, derretendo por dentro.",
  whatsappTarget: "5500000000000",
  paymentMethods: ["pix", "dinheiro", "cartao"],
  deliveryOptions: ["retirada", "entrega"],
  tabs: [],
};

describe("isStoreOpen", () => {
  it("returns true when isOpen is true", () => {
    expect(isStoreOpen(baseSettings)).toBe(true);
  });

  it("returns false when isOpen is false", () => {
    expect(isStoreOpen({ ...baseSettings, isOpen: false })).toBe(false);
  });
});

describe("meetsMinimumOrder", () => {
  it("returns true when total is greater than or equal to minOrderValue", () => {
    expect(meetsMinimumOrder(20, baseSettings)).toBe(true);
    expect(meetsMinimumOrder(25, baseSettings)).toBe(true);
  });

  it("returns false when total is less than minOrderValue", () => {
    expect(meetsMinimumOrder(19.99, baseSettings)).toBe(false);
  });

  it("returns true for any total when minOrderValue is 0", () => {
    expect(meetsMinimumOrder(0, { ...baseSettings, minOrderValue: 0 })).toBe(true);
  });
});

describe("minimumOrderShortfall", () => {
  it("returns the remaining amount needed to reach the minimum", () => {
    expect(minimumOrderShortfall(12, baseSettings)).toBeCloseTo(8, 5);
  });

  it("returns 0 when the minimum is already met", () => {
    expect(minimumOrderShortfall(20, baseSettings)).toBe(0);
    expect(minimumOrderShortfall(25, baseSettings)).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL — `lib/validation.ts` does not exist.

- [ ] **Step 3: Implement `lib/validation.ts`**

```ts
import { StoreSettings } from "./types";

export function isStoreOpen(settings: StoreSettings): boolean {
  return settings.isOpen;
}

export function meetsMinimumOrder(total: number, settings: StoreSettings): boolean {
  return total >= settings.minOrderValue;
}

export function minimumOrderShortfall(total: number, settings: StoreSettings): number {
  const shortfall = settings.minOrderValue - total;
  return shortfall > 0 ? shortfall : 0;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`

Expected: All tests in `lib/validation.test.ts` PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/validation.ts lib/validation.test.ts
git commit -m "feat: add store-open and minimum-order validation"
```

---

### Task 9: `useCart` hook with localStorage persistence

**Files:**
- Create: `hooks/useCart.ts`

- [ ] **Step 1: Implement the hook**

```ts
"use client";

import { useEffect, useState } from "react";
import { CartItem, Product } from "@/lib/types";
import { addItem, removeItem, updateQty, cartTotal } from "@/lib/cart";

const STORAGE_KEY = "cookie-and-love-cart";

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCart(JSON.parse(stored) as CartItem[]);
      } catch {
        setCart([]);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, hydrated]);

  return {
    cart,
    total: cartTotal(cart),
    add: (product: Product, qty = 1) => setCart((current) => addItem(current, product, qty)),
    remove: (productId: string) => setCart((current) => removeItem(current, productId)),
    setQty: (productId: string, qty: number) =>
      setCart((current) => updateQty(current, productId, qty)),
    clear: () => setCart([]),
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useCart.ts
git commit -m "feat: add useCart hook with localStorage persistence"
```

---

### Task 10: Header and InfoBar components

**Files:**
- Create: `components/Header.tsx`
- Create: `components/InfoBar.tsx`

- [ ] **Step 1: Implement `components/Header.tsx`**

```tsx
export function Header() {
  return (
    <header className="px-6 pt-6 pb-2">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-display font-black text-4xl leading-none tracking-tight text-brown">
            Cookie
            <br />
            <span className="italic font-medium text-caramel">&amp; Love</span>
          </h1>
          <p className="text-[10px] tracking-[0.25em] uppercase text-taupe mt-2">
            Est. New York Style — Cookies Artesanais
          </p>
        </div>
        <div className="text-right text-xs text-caramel leading-relaxed">
          <p>● ABERTO AGORA</p>
          <p className="text-taupe">★★★★★ 5.0</p>
          <a
            href="https://www.instagram.com/cookieandlove.jll/"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1 underline text-brown"
          >
            Instagram
          </a>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Implement `components/InfoBar.tsx`**

```tsx
import { StoreSettings } from "@/lib/types";

export function InfoBar({ settings }: { settings: StoreSettings }) {
  return (
    <div className="flex gap-2 flex-wrap px-6 mt-4">
      <span className="border border-beige text-brown text-[10px] px-3 py-1.5 rounded-full tracking-wide">
        ⏱ ~{settings.prepTimeMinutes} MIN
      </span>
      {settings.deliveryOptions.includes("retirada") && (
        <span className="border border-beige text-brown text-[10px] px-3 py-1.5 rounded-full tracking-wide">
          📍 RETIRADA
        </span>
      )}
      {settings.deliveryOptions.includes("entrega") && (
        <span className="border border-beige text-brown text-[10px] px-3 py-1.5 rounded-full tracking-wide">
          🛵 ENTREGA
        </span>
      )}
      <span className="border border-beige text-brown text-[10px] px-3 py-1.5 rounded-full tracking-wide">
        {settings.minOrderValue > 0
          ? `PEDIDO MÍNIMO R$ ${settings.minOrderValue.toFixed(2)}`
          : "SEM PEDIDO MÍNIMO"}
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add components/Header.tsx components/InfoBar.tsx
git commit -m "feat: add Header and InfoBar components"
```

---

### Task 11: Hero and Tabs components

**Files:**
- Create: `components/Hero.tsx`
- Create: `components/Tabs.tsx`

- [ ] **Step 1: Implement `components/Hero.tsx`**

```tsx
export function Hero({ text }: { text: string }) {
  return (
    <div className="px-6 py-7 border-y border-beige mt-4">
      <p className="font-display italic text-xl leading-snug max-w-sm">
        “{text}”
      </p>
      <p className="text-[11px] text-taupe mt-2 tracking-wide">
        Cookies recheados, gigantes, assados na hora — todo dia fresquinho.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Implement `components/Tabs.tsx`**

```tsx
"use client";

import { TabConfig } from "@/lib/types";

export function Tabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: TabConfig[];
  activeTab: string;
  onChange: (tabId: string) => void;
}) {
  return (
    <div className="flex gap-6 px-6 mt-5 border-b border-beige overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`pb-2.5 text-[11px] tracking-[0.1em] uppercase whitespace-nowrap ${
            activeTab === tab.id
              ? "text-brown border-b-2 border-caramel"
              : "text-taupe"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add components/Hero.tsx components/Tabs.tsx
git commit -m "feat: add Hero and Tabs components"
```

---

### Task 12: ProductCard and ProductGrid components

**Files:**
- Create: `components/ProductCard.tsx`
- Create: `components/ProductGrid.tsx`

- [ ] **Step 1: Implement `components/ProductCard.tsx`**

```tsx
import { Product } from "@/lib/types";

const BADGE_LABELS: Record<NonNullable<Product["badge"]>, string> = {
  novo: "NOVO",
  mais_vendido: "MAIS VENDIDO",
};

export function ProductCard({
  product,
  qty,
  onAdd,
  onRemove,
}: {
  product: Product;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const soldOut = product.stockToday === 0;

  return (
    <div className="bg-white rounded-md overflow-hidden border border-[#f0e0cd] shadow-sm">
      <div className="h-28 relative bg-gradient-to-br from-[#d9a05b] via-[#a85f2c] to-[#6b3a17] flex items-center justify-center text-5xl">
        🍪
        {product.badge && !soldOut && (
          <span className="absolute top-2 right-2 bg-brown text-cream text-[9px] px-2 py-1 rounded-full tracking-widest">
            {BADGE_LABELS[product.badge]}
          </span>
        )}
        {soldOut && (
          <span className="absolute top-2 right-2 bg-taupe text-cream text-[9px] px-2 py-1 rounded-full tracking-widest">
            ESGOTADO
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-display font-semibold text-base">{product.name}</h3>
        <p className="text-[10px] text-taupe uppercase tracking-wide my-1.5">
          {product.description}
        </p>
        <div className="flex justify-between items-center">
          <span className="font-mono font-bold text-sm">
            R$ {product.price.toFixed(2)}
          </span>
          {soldOut ? (
            <span className="text-[11px] text-taupe">Indisponível</span>
          ) : qty > 0 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onRemove}
                className="bg-brown text-cream text-xs w-6 h-6 rounded"
                aria-label={`Remover ${product.name}`}
              >
                −
              </button>
              <span className="font-mono text-xs">{qty}</span>
              <button
                onClick={onAdd}
                className="bg-brown text-cream text-xs w-6 h-6 rounded"
                aria-label={`Adicionar ${product.name}`}
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={onAdd}
              className="bg-brown text-cream text-[11px] px-3 py-1.5 rounded"
            >
              Adicionar +
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `components/ProductGrid.tsx`**

```tsx
import { CartItem, Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  cart,
  onAdd,
  onRemove,
}: {
  products: Product[];
  cart: CartItem[];
  onAdd: (product: Product) => void;
  onRemove: (productId: string) => void;
}) {
  if (products.length === 0) {
    return (
      <p className="px-6 py-8 text-sm text-taupe">
        Nenhum produto disponível nesta categoria no momento.
      </p>
    );
  }

  return (
    <div className="px-6 py-5 grid grid-cols-2 gap-3.5">
      {products.map((product) => {
        const cartItem = cart.find((item) => item.productId === product.id);
        return (
          <ProductCard
            key={product.id}
            product={product}
            qty={cartItem?.qty ?? 0}
            onAdd={() => onAdd(product)}
            onRemove={() => onRemove(product.id)}
          />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add components/ProductCard.tsx components/ProductGrid.tsx
git commit -m "feat: add ProductCard and ProductGrid components"
```

---

### Task 13: CartBar component

**Files:**
- Create: `components/CartBar.tsx`

- [ ] **Step 1: Implement `components/CartBar.tsx`**

```tsx
import { CartItem } from "@/lib/types";

export function CartBar({
  cart,
  total,
  onReview,
}: {
  cart: CartItem[];
  total: number;
  onReview: () => void;
}) {
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  if (itemCount === 0) {
    return (
      <div className="sticky bottom-0 mx-6 mb-5 bg-white border border-beige rounded-md px-4 py-3 text-center text-xs text-taupe">
        Seu carrinho está vazio. Adicione cookies para começar! 🍪
      </div>
    );
  }

  return (
    <button
      onClick={onReview}
      className="sticky bottom-0 mx-6 mb-5 bg-brown text-cream rounded-md px-4 py-3.5 flex justify-between items-center font-mono font-bold text-xs shadow-lg w-[calc(100%-3rem)]"
    >
      <span>
        🛍 {itemCount} {itemCount === 1 ? "ITEM" : "ITENS"} NA SACOLA
      </span>
      <span className="text-caramel">R$ {total.toFixed(2)} →</span>
    </button>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/CartBar.tsx
git commit -m "feat: add CartBar component"
```

---

### Task 14: CheckoutModal component

**Files:**
- Create: `components/CheckoutModal.tsx`

- [ ] **Step 1: Implement `components/CheckoutModal.tsx`**

```tsx
"use client";

import { useState } from "react";
import { CartItem, DeliveryType, OrderDetails, PaymentMethod, StoreSettings } from "@/lib/types";
import { buildOrderMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { isStoreOpen, meetsMinimumOrder, minimumOrderShortfall } from "@/lib/validation";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
};

const DELIVERY_LABELS: Record<DeliveryType, string> = {
  retirada: "Retirada",
  entrega: "Entrega",
};

export function CheckoutModal({
  cart,
  total,
  settings,
  onClose,
}: {
  cart: CartItem[];
  total: number;
  settings: StoreSettings;
  onClose: () => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(settings.deliveryOptions[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(settings.paymentMethods[0]);
  const [notes, setNotes] = useState("");

  const storeOpen = isStoreOpen(settings);
  const minimumMet = meetsMinimumOrder(total, settings);
  const shortfall = minimumOrderShortfall(total, settings);

  const canSubmit =
    storeOpen && minimumMet && customerName.trim() !== "" && whatsapp.trim() !== "" && pickupTime.trim() !== "";

  function handleSubmit() {
    const order: OrderDetails = {
      customerName,
      whatsapp,
      pickupTime,
      deliveryType,
      paymentMethod,
      notes: notes.trim() === "" ? undefined : notes.trim(),
    };
    const message = buildOrderMessage(cart, order, total);
    const link = buildWhatsAppLink(settings.whatsappTarget, message);
    window.open(link, "_blank");
  }

  return (
    <div className="fixed inset-0 bg-brown/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-cream w-full sm:max-w-md sm:rounded-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display font-bold text-xl">Revisar pedido</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-taupe text-xl">
            ×
          </button>
        </div>

        {!storeOpen && (
          <p className="bg-beige text-brown text-xs px-3 py-2 rounded mb-3">
            Loja fechada no momento. Não é possível finalizar o pedido agora.
          </p>
        )}

        {storeOpen && !minimumMet && (
          <p className="bg-beige text-brown text-xs px-3 py-2 rounded mb-3">
            Faltam R$ {shortfall.toFixed(2)} para atingir o pedido mínimo de R$ {settings.minOrderValue.toFixed(2)}.
          </p>
        )}

        <div className="space-y-3">
          <label className="block text-xs">
            Nome
            <input
              className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </label>

          <label className="block text-xs">
            WhatsApp
            <input
              className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 99999-8888"
            />
          </label>

          <label className="block text-xs">
            Horário desejado
            <input
              className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              placeholder="18:30"
            />
          </label>

          <fieldset className="text-xs">
            <legend className="mb-1">Entrega</legend>
            <div className="flex gap-3">
              {settings.deliveryOptions.map((option) => (
                <label key={option} className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="deliveryType"
                    checked={deliveryType === option}
                    onChange={() => setDeliveryType(option)}
                  />
                  {DELIVERY_LABELS[option]}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="text-xs">
            <legend className="mb-1">Pagamento</legend>
            <div className="flex gap-3 flex-wrap">
              {settings.paymentMethods.map((option) => (
                <label key={option} className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === option}
                    onChange={() => setPaymentMethod(option)}
                  />
                  {PAYMENT_LABELS[option]}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block text-xs">
            Observações (opcional)
            <textarea
              className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </label>
        </div>

        <div className="mt-4 flex justify-between items-center font-mono font-bold text-sm">
          <span>Total</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-4 w-full bg-brown text-cream rounded py-3 text-sm font-bold disabled:opacity-40"
        >
          Revisar e enviar no WhatsApp
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/CheckoutModal.tsx
git commit -m "feat: add CheckoutModal with WhatsApp order submission"
```

---

### Task 15: Assemble the home page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { InfoBar } from "@/components/InfoBar";
import { Hero } from "@/components/Hero";
import { Tabs } from "@/components/Tabs";
import { ProductGrid } from "@/components/ProductGrid";
import { CartBar } from "@/components/CartBar";
import { CheckoutModal } from "@/components/CheckoutModal";
import { products } from "@/lib/products";
import { storeSettings } from "@/lib/store-settings";
import { useCart } from "@/hooks/useCart";

const TAB_TO_CATEGORY: Record<string, string> = {
  destaques: "destaque",
  cookies: "cookie",
  especiais: "especial",
};

export default function Home() {
  const [activeTab, setActiveTab] = useState(storeSettings.tabs[0].id);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { cart, total, add, remove } = useCart();

  const category = TAB_TO_CATEGORY[activeTab];
  const visibleProducts = products.filter(
    (product) => product.active && product.category === category
  );

  return (
    <main className="max-w-md mx-auto pb-4">
      <div className="deli-stripe" />
      <Header />
      <InfoBar settings={storeSettings} />
      <Hero text={storeSettings.heroText} />
      <Tabs tabs={storeSettings.tabs} activeTab={activeTab} onChange={setActiveTab} />

      {category ? (
        <ProductGrid
          products={visibleProducts}
          cart={cart}
          onAdd={add}
          onRemove={remove}
        />
      ) : (
        <div className="px-6 py-8 text-sm text-taupe">
          Conteúdo desta seção em breve.
        </div>
      )}

      <CartBar cart={cart} total={total} onReview={() => setCheckoutOpen(true)} />

      {checkoutOpen && (
        <CheckoutModal
          cart={cart}
          total={total}
          settings={storeSettings}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 2: Run all unit tests**

Run: `npm test`

Expected: All tests in `lib/cart.test.ts`, `lib/whatsapp.test.ts`, `lib/validation.test.ts` PASS.

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 4: Manual verification in the browser**

Run: `npm run dev`, open `http://localhost:3000`.

Verify:
- Page shows the Cookie & Love header, info bar, hero quote, and 5 tabs
- "Destaques" tab shows 2 products (Big Apple Choc Chunk, Brooklyn Red Velvet) with badges
- "Cookies" tab shows Central Park Oatmeal and Harlem Peanut Butter (the latter marked "ESGOTADO" and not addable)
- "Especiais da casa" tab shows SoHo Triple Chocolate and Tribeca Salted Caramel
- "Avaliações" and "Informações" tabs show "Conteúdo desta seção em breve."
- Adding items updates the cart bar total and item count
- Clicking the cart bar opens the checkout modal
- Filling the form and clicking "Revisar e enviar no WhatsApp" opens a `wa.me` link in a new tab with the order details pre-filled

Stop the dev server after verification.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: assemble Cookie & Love storefront home page"
```

---

### Task 16: Push to GitHub

**Files:** none (git operations only)

- [ ] **Step 1: Push the branch**

```bash
git push -u origin main
```

Expected: Push succeeds, all commits from this plan are visible at `https://github.com/alissonn32-pixel/cookie-and-love`.

---

## Spec Coverage Notes

This plan covers the public storefront portions of the design spec (sections 1-3 hero/header/tabs/grid/cart/checkout, section 2 visual identity, section 6 edge cases for stock/store-closed/minimum-order/empty-cart/WhatsApp message, section 8 unit tests). It deliberately does **not** cover:
- Section 3 admin panel (`/admin`)
- Section 4 Supabase data model and Auth
- Section 5 Supabase/Vercel account setup and deploy
- Section 7 wiring real product images (placeholder emoji/gradients used instead)

These are covered by the follow-up plan: `docs/superpowers/plans/<date>-supabase-and-admin.md` (to be written next).

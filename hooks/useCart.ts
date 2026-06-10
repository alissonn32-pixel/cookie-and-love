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

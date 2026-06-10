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

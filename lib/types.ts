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

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  whatsapp: string;
  pickupTime: string;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  notes: string | null;
  items: OrderItem[];
  total: number;
  createdAt: string;
}

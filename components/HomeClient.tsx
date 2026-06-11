"use client";

import { useState } from "react";
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

const TAB_TO_CATEGORY: Record<string, string> = {
  destaques: "destaque",
  cookies: "cookie",
  especiais: "especial",
};

interface HomeClientProps {
  products: Product[];
  storeSettings: StoreSettings;
}

export function HomeClient({ products, storeSettings }: HomeClientProps) {
  const [activeTab, setActiveTab] = useState(storeSettings.tabs[0].id);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { cart, total, add, remove } = useCart();

  const category = TAB_TO_CATEGORY[activeTab];
  const visibleProducts = products.filter(
    (product) => product.active && product.category === category
  );

  return (
    <main className="max-w-md mx-auto pb-4 lg:max-w-4xl lg:pb-8">
      <div className="deli-stripe" />
      <Header />
      <InfoBar settings={storeSettings} />
      <ProductCarousel products={getFeaturedProducts(products)} />
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
        <div className="px-6 py-8 text-sm text-taupe lg:px-12">
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

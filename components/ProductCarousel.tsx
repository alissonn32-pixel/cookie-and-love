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

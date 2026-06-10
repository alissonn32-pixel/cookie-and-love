import Image from "next/image";

export function Header() {
  return (
    <header className="px-6 pt-6 pb-2">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-cropped.png"
            alt="Cookie & Love"
            width={48}
            height={48}
            className="rounded-full w-12 h-12"
          />
          <div>
            <h1 className="font-display font-black text-2xl leading-none tracking-tight text-brown">
              Cookie <span className="italic font-medium text-caramel">&amp; Love</span>
            </h1>
            <p className="text-[10px] tracking-[0.25em] uppercase text-taupe mt-2">
              Est. New York Style — Cookies Artesanais
            </p>
            <p className="text-xs text-caramel mt-1">📍 Joinville - SC</p>
          </div>
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

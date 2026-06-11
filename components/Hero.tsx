export function Hero({ text }: { text: string }) {
  return (
    <div className="px-6 py-7 border-y border-beige mt-4 lg:px-12">
      <p className="font-display italic text-xl leading-snug max-w-sm lg:max-w-xl">
        “{text}”
      </p>
      <p className="text-[11px] text-taupe mt-2 tracking-wide">
        Cookies recheados, gigantes, assados na hora — todo dia fresquinho.
      </p>
    </div>
  );
}

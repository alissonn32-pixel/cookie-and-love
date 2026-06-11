"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateStoreSettings } from "@/lib/store-settings";
import { StoreSettings } from "@/lib/types";

interface StoreSettingsFormProps {
  settings: StoreSettings;
}

export function StoreSettingsForm({ settings }: StoreSettingsFormProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(settings.isOpen);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(String(settings.prepTimeMinutes));
  const [minOrderValue, setMinOrderValue] = useState(String(settings.minOrderValue));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const client = createClient();
      await updateStoreSettings(client, {
        isOpen,
        prepTimeMinutes: Number(prepTimeMinutes),
        minOrderValue: Number(minOrderValue),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar configurações.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error && <p className="bg-beige text-brown text-xs px-3 py-2 rounded">{error}</p>}

      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={isOpen} onChange={(event) => setIsOpen(event.target.checked)} />
        Loja aberta
      </label>

      <label className="block text-xs">
        Tempo de preparo (minutos)
        <input
          type="number"
          min="0"
          step="1"
          className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
          value={prepTimeMinutes}
          onChange={(event) => setPrepTimeMinutes(event.target.value)}
          required
        />
      </label>

      <label className="block text-xs">
        Valor mínimo do pedido (R$)
        <input
          type="number"
          min="0"
          step="0.01"
          className="mt-1 w-full border border-beige rounded px-3 py-2 text-sm"
          value={minOrderValue}
          onChange={(event) => setMinOrderValue(event.target.value)}
          required
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="bg-brown text-cream rounded py-3 px-6 text-sm font-bold disabled:opacity-40"
      >
        {loading ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}

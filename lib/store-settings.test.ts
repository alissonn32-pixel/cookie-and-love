import { describe, it, expect, vi } from "vitest";
import { getStoreSettings } from "./store-settings";
import { SupabaseClient } from "@supabase/supabase-js";

function mockClient(row: unknown, error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data: row, error });
  const select = vi.fn().mockReturnValue({ single });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as SupabaseClient;
}

describe("getStoreSettings", () => {
  it("maps the database row to a StoreSettings object", async () => {
    const row = {
      id: 1,
      is_open: true,
      prep_time_minutes: 40,
      min_order_value: 0,
      hero_text: "Crocante por fora, derretendo por dentro.",
      whatsapp_target: "5500000000000",
      payment_methods: ["pix", "dinheiro", "cartao"],
      delivery_options: ["retirada", "entrega"],
      tabs_config: [
        { id: "destaques", label: "Destaques" },
        { id: "cookies", label: "Cookies" },
      ],
    };
    const client = mockClient(row);

    const settings = await getStoreSettings(client);

    expect(settings).toEqual({
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
      ],
    });
  });

  it("queries the store_settings table for a single row", async () => {
    const client = mockClient({
      id: 1,
      is_open: true,
      prep_time_minutes: 40,
      min_order_value: 0,
      hero_text: "x",
      whatsapp_target: "x",
      payment_methods: [],
      delivery_options: [],
      tabs_config: [],
    });

    await getStoreSettings(client);

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    expect(fromMock).toHaveBeenCalledWith("store_settings");

    const selectMock = fromMock.mock.results[0].value.select as ReturnType<typeof vi.fn>;
    expect(selectMock).toHaveBeenCalledWith("*");
  });

  it("throws an error when the query returns an error", async () => {
    const client = mockClient(null, new Error("db error"));

    await expect(getStoreSettings(client)).rejects.toThrow("db error");
  });
});

import { describe, it, expect, vi } from "vitest";
import { getStoreSettings, updateStoreSettings } from "./store-settings";
import { SupabaseClient } from "@supabase/supabase-js";
import { StoreSettings } from "./types";

function mockSelectClient(row: unknown | null, error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data: row, error });
  const select = vi.fn().mockReturnValue({ single });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as SupabaseClient;
}

function mockUpdateClient(error: unknown = null) {
  const eq = vi.fn().mockResolvedValue({ error });
  const update = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ update });
  return { from } as unknown as SupabaseClient;
}

const settingsRow = {
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

const mappedSettings: StoreSettings = {
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
};

describe("getStoreSettings", () => {
  it("maps the database row to a StoreSettings object", async () => {
    const client = mockSelectClient(settingsRow);

    const settings = await getStoreSettings(client);

    expect(settings).toEqual(mappedSettings);

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    expect(fromMock).toHaveBeenCalledWith("store_settings");

    const selectMock = fromMock.mock.results[0].value.select as ReturnType<typeof vi.fn>;
    expect(selectMock).toHaveBeenCalledWith("*");
  });

  it("throws an error when the query returns an error", async () => {
    const client = mockSelectClient(null, new Error("db error"));

    await expect(getStoreSettings(client)).rejects.toThrow("db error");
  });
});

describe("updateStoreSettings", () => {
  it("updates isOpen, prepTimeMinutes, and minOrderValue for the row with id 1", async () => {
    const client = mockUpdateClient();

    await updateStoreSettings(client, {
      isOpen: false,
      prepTimeMinutes: 50,
      minOrderValue: 20,
    });

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    expect(fromMock).toHaveBeenCalledWith("store_settings");

    const updateMock = fromMock.mock.results[0].value.update as ReturnType<typeof vi.fn>;
    expect(updateMock).toHaveBeenCalledWith({
      is_open: false,
      prep_time_minutes: 50,
      min_order_value: 20,
    });

    const eqMock = updateMock.mock.results[0].value.eq as ReturnType<typeof vi.fn>;
    expect(eqMock).toHaveBeenCalledWith("id", 1);
  });

  it("throws an error when the update returns an error", async () => {
    const client = mockUpdateClient(new Error("db error"));

    await expect(
      updateStoreSettings(client, { isOpen: true, prepTimeMinutes: 40, minOrderValue: 0 })
    ).rejects.toThrow("db error");
  });
});

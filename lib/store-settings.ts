import { SupabaseClient } from "@supabase/supabase-js";
import { StoreSettings, PaymentMethod, DeliveryType, TabConfig } from "./types";

interface StoreSettingsRow {
  id: number;
  is_open: boolean;
  prep_time_minutes: number;
  min_order_value: number;
  hero_text: string;
  whatsapp_target: string;
  payment_methods: PaymentMethod[];
  delivery_options: DeliveryType[];
  tabs_config: TabConfig[];
}

function mapRow(row: StoreSettingsRow): StoreSettings {
  return {
    isOpen: row.is_open,
    prepTimeMinutes: row.prep_time_minutes,
    minOrderValue: row.min_order_value,
    heroText: row.hero_text,
    whatsappTarget: row.whatsapp_target,
    paymentMethods: row.payment_methods,
    deliveryOptions: row.delivery_options,
    tabs: row.tabs_config,
  };
}

export async function getStoreSettings(client: SupabaseClient): Promise<StoreSettings> {
  const { data, error } = await client
    .from("store_settings")
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRow(data as StoreSettingsRow);
}

export async function updateStoreSettings(
  client: SupabaseClient,
  settings: { isOpen: boolean; prepTimeMinutes: number; minOrderValue: number }
): Promise<void> {
  const { error } = await client
    .from("store_settings")
    .update({
      is_open: settings.isOpen,
      prep_time_minutes: settings.prepTimeMinutes,
      min_order_value: settings.minOrderValue,
    })
    .eq("id", 1);

  if (error) {
    throw new Error(error.message);
  }
}

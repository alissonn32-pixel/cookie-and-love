import { StoreSettings } from "./types";

export function isStoreOpen(settings: StoreSettings): boolean {
  return settings.isOpen;
}

export function meetsMinimumOrder(total: number, settings: StoreSettings): boolean {
  return total >= settings.minOrderValue;
}

export function minimumOrderShortfall(total: number, settings: StoreSettings): number {
  const shortfall = settings.minOrderValue - total;
  return shortfall > 0 ? shortfall : 0;
}

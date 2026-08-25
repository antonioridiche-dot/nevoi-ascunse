export const CALENDAR_PACKAGE_IDS = ["oneMonth", "twoMonths", "threeMonths"] as const;
export type CalendarPackageId = typeof CALENDAR_PACKAGE_IDS[number];
export type CalendarCurrency = "usd" | "eur" | "gbp";

export const CALENDAR_PACKAGES: Record<CalendarPackageId, { name: string; description: string; prices: Record<CalendarCurrency, number> }> = {
  oneMonth: { name: "Calendarul Norocului · 1 lună", description: "Acces la calendarul personal pentru o lună.", prices: { usd: 3900, eur: 3600, gbp: 3000 } },
  twoMonths: { name: "Calendarul Norocului · 2 luni", description: "Acces la calendarul personal pentru două luni.", prices: { usd: 5900, eur: 5400, gbp: 4600 } },
  threeMonths: { name: "Calendarul Norocului · 3 luni", description: "Acces la calendarul personal pentru trei luni.", prices: { usd: 8700, eur: 8000, gbp: 6800 } },
};

export function calendarPrice(packageId: CalendarPackageId, currency: CalendarCurrency) {
  return CALENDAR_PACKAGES[packageId].prices[currency];
}

export function calendarEligiblePackages(owned: readonly CalendarPackageId[]) {
  const existing = new Set(owned);
  return CALENDAR_PACKAGE_IDS.filter((packageId) => !existing.has(packageId));
}

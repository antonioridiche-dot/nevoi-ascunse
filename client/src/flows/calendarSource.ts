export type CalendarZodiacKey = "capricorn" | "varsator" | "pesti" | "berbec" | "taur" | "gemeni" | "rac" | "leu" | "fecioara" | "balanta" | "scorpion" | "sagetator";
export type CalendarZodiac = { key: CalendarZodiacKey; name: string; glyph: string; element: string; focus: string };

export const calendarZodiacSigns: CalendarZodiac[] = [
  { key: "capricorn", name: "Capricorn", glyph: "♑", element: "Pământ", focus: "alegeri construite în pași mici și siguri" },
  { key: "varsator", name: "Vărsător", glyph: "♒", element: "Aer", focus: "idei care schimbă perspectiva" },
  { key: "pesti", name: "Pești", glyph: "♓", element: "Apă", focus: "intuiție și atenție la nuanțe" },
  { key: "berbec", name: "Berbec", glyph: "♈", element: "Foc", focus: "inițiativă fără grabă inutilă" },
  { key: "taur", name: "Taur", glyph: "♉", element: "Pământ", focus: "stabilitate și răbdare" },
  { key: "gemeni", name: "Gemeni", glyph: "♊", element: "Aer", focus: "conversații și perspective noi" },
  { key: "rac", name: "Rac", glyph: "♋", element: "Apă", focus: "relații și spațiu emoțional" },
  { key: "leu", name: "Leu", glyph: "♌", element: "Foc", focus: "vizibilitate și exprimare autentică" },
  { key: "fecioara", name: "Fecioară", glyph: "♍", element: "Pământ", focus: "detalii care pot fi clarificate" },
  { key: "balanta", name: "Balanță", glyph: "♎", element: "Aer", focus: "echilibru și dialog" },
  { key: "scorpion", name: "Scorpion", glyph: "♏", element: "Apă", focus: "profunzime și limite clare" },
  { key: "sagetator", name: "Săgetător", glyph: "♐", element: "Foc", focus: "direcție, curaj și sens" },
];

export function calculateCalendarZodiac(month: number, day: number) {
  if (!month || !day) return undefined;
  const cutoffs = [19, 18, 20, 19, 20, 20, 22, 22, 22, 22, 21, 21];
  const order: CalendarZodiacKey[] = ["capricorn", "varsator", "pesti", "berbec", "taur", "gemeni", "rac", "leu", "fecioara", "balanta", "scorpion", "sagetator"];
  return calendarZodiacSigns.find((sign) => sign.key === (day <= cutoffs[month - 1] ? order[month - 1] : order[month % 12]));
}

export function calendarLifePathNumber(month: number, day: number, year: number) {
  let total = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`.split("").reduce((sum, digit) => sum + Number(digit), 0);
  while (total > 9 && total !== 11 && total !== 22 && total !== 33) total = String(total).split("").reduce((sum, digit) => sum + Number(digit), 0);
  return total;
}

export function calendarPathFocus(path: number) {
  return ({ 1: "inițiativă și direcție proprie", 2: "colaborare și tact", 3: "expresie și conversație", 4: "ordine și consecvență", 5: "schimbare și flexibilitate", 6: "echilibru și responsabilitate", 7: "observație și timp de gândire", 8: "organizare și alegeri practice", 9: "încheieri cu sens", 11: "intuiție și inspirație", 22: "viziune practică", 33: "sprijin și compasiune" } as Record<number, string>)[path] ?? "ritmul tău personal";
}

/**
 * Helpers de fecha para las vistas públicas. Trabajan sobre strings
 * yyyy-MM-dd (o ISO) y evitan `new Date("yyyy-MM-dd")`, que interpreta la
 * fecha como UTC y puede correrse un día según la zona horaria.
 */

/** Parte de día (yyyy-MM-dd) de un ISO/fecha string. */
export const dayPart = (value: string): string => String(value).split("T")[0];

/** "2026-07-15" -> "miércoles 15 de julio". */
export function formatLongDate(iso: string): string {
  const [y, m, d] = dayPart(iso).split("-").map(Number);
  if (!y || !m || !d) return String(iso);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** "2026-07-15" -> "15/07/2026". */
export function formatShortDate(iso: string): string {
  const [y, m, d] = dayPart(iso).split("-");
  if (!y || !m || !d) return String(iso);
  return `${d}/${m}/${y}`;
}

/** "15/07/2026" o "15/07/2026 al 18/07/2026" según sea un día o un rango. */
export function formatDateRange(from: string, to: string): string {
  const a = formatShortDate(from);
  const b = formatShortDate(to);
  return dayPart(from) === dayPart(to) ? a : `${a} al ${b}`;
}

/** Fecha de hoy como yyyy-MM-dd en hora local. */
export function todayISO(): string {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, "0");
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}

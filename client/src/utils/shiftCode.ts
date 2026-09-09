/**
 * Código corto de reserva. Espejo de `api/src/libs/shiftCode.ts`: se deriva
 * del id de Mongo (los últimos 6 caracteres, en mayúsculas) para que el panel,
 * el Excel y el comprobante de Mercado Pago muestren siempre lo mismo sin
 * guardar un campo nuevo.
 */
export const SHIFT_CODE_PREFIX = "R-";

export function buildShiftCode(shiftId?: string): string {
  const id = String(shiftId || "");
  if (!id) return "";
  return `${SHIFT_CODE_PREFIX}${id.slice(-6).toUpperCase()}`;
}

/** Coincidencia tolerante: sin prefijo y en minúsculas también matchea. */
export function matchesShiftCode(shiftId: string | undefined, text: string) {
  const q = text.trim().toUpperCase().replace(/^R-/, "");
  if (!q) return false;
  return buildShiftCode(shiftId).replace(SHIFT_CODE_PREFIX, "").includes(q);
}

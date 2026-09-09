/**
 * Código corto de reserva.
 *
 * El id de Mongo son 24 caracteres hexadecimales: sirve como clave, pero es
 * ilegible en un comprobante de Mercado Pago o dictado por teléfono. Este
 * código lo deriva del propio id, así que no hace falta guardar nada nuevo ni
 * migrar las reservas ya cargadas: la misma reserva siempre da el mismo
 * código, y el id completo sigue siendo la clave real.
 *
 * Se usan los últimos 6 caracteres (el contador del ObjectId, lo que más
 * cambia entre reservas consecutivas) en mayúsculas: `R-4B29F1`.
 */
export const SHIFT_CODE_PREFIX = "R-";

export function buildShiftCode(shiftId: string): string {
  const id = String(shiftId || "");
  if (!id) return "";
  return `${SHIFT_CODE_PREFIX}${id.slice(-6).toUpperCase()}`;
}

/**
 * ¿El texto es el código de esta reserva? Tolera que lo escriban sin el
 * prefijo y en minúsculas, que es como suele llegar copiado del comprobante.
 */
export function matchesShiftCode(shiftId: string, text: string): boolean {
  const q = String(text || "")
    .trim()
    .toUpperCase()
    .replace(/^R-/, "");
  if (!q) return false;
  return buildShiftCode(shiftId).replace(SHIFT_CODE_PREFIX, "").includes(q);
}

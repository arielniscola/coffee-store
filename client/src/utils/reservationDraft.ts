import { IShift } from "../interfaces/shift";

/**
 * Borrador de la reserva en curso. Vive en sessionStorage para sobrevivir el
 * redirect a Mercado Pago: cuando el usuario vuelve, el formulario se
 * reconstruye y `shiftId` permite saber que quedó un pago sin resolver.
 */
export interface ReservationDraft {
  formData: IShift;
  step: 1 | 2 | 3;
  shiftId?: string;
}

export const RESERVATION_DRAFT_KEY = "reservationDraft";

export function readReservationDraft(): ReservationDraft | undefined {
  try {
    const raw = sessionStorage.getItem(RESERVATION_DRAFT_KEY);
    if (!raw) return undefined;
    const draft = JSON.parse(raw) as ReservationDraft;
    return draft || undefined;
  } catch {
    return undefined;
  }
}

export function writeReservationDraft(draft: ReservationDraft) {
  try {
    sessionStorage.setItem(RESERVATION_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota errors */
  }
}

export function clearReservationDraft() {
  try {
    sessionStorage.removeItem(RESERVATION_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Suelta el pago pendiente sin borrar el formulario. Se usa cuando ya
 * mandamos al usuario a la pantalla de resultado: evita que el borrador lo
 * siga redirigiendo en cada visita a la landing.
 */
export function clearPendingShiftId() {
  const draft = readReservationDraft();
  if (!draft || !draft.shiftId) return;
  delete draft.shiftId;
  writeReservationDraft(draft);
}

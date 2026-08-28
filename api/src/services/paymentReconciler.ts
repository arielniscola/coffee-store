import Log from "../libs/logger";
import { IShift } from "../models/shift";
import { mercadoPagoService } from "./mercadopago";
import { shiftService } from "./shift";
import { sendShiftConfirmationEmailOnce } from "./email";

const log = new Log("PaymentReconciler");

export interface ReconcileOptions {
  /**
   * Presupuesto de tiempo. Corta la pasada y devuelve `timedOut` en vez de
   * que la plataforma mate la función a mitad de camino: en Vercel el límite
   * del plan Hobby son 10s, así que por defecto nos guardamos margen.
   */
  maxDurationMs?: number;
  /** Máximo de reservas a revisar en una pasada. */
  limit?: number;
}

export interface ReconcileResult {
  scanned: number;
  checked: number;
  paid: number;
  rejected: number;
  timedOut: boolean;
}

/**
 * Para cada shift en pendingPayment, consulta MP por external_reference y
 * actualiza su estado. Red de seguridad por si falla el webhook.
 */
async function reconcileOnce(
  options: ReconcileOptions = {},
): Promise<ReconcileResult> {
  const startedAt = Date.now();
  const maxDurationMs = options.maxDurationMs ?? 8000;
  const limit = options.limit ?? 50;
  const result: ReconcileResult = {
    scanned: 0,
    checked: 0,
    paid: 0,
    rejected: 0,
    timedOut: false,
  };
  const outOfTime = () => Date.now() - startedAt > maxDurationMs;

  try {
    // Buscar shifts pendingPayment de TODAS las compañías. Cada compañía
    // tiene su token MP propio, así que agrupamos por companyCode.
    const pending = await shiftService.find({ status: "pendingPayment" });
    result.scanned = pending.length;
    if (!pending.length) return result;

    const byCompany = new Map<string, typeof pending>();
    for (const s of pending) {
      const arr = byCompany.get(s.companyCode) || [];
      arr.push(s);
      byCompany.set(s.companyCode, arr);
    }

    for (const [companyCode, shifts] of byCompany) {
      // Liberar vencidos primero (libera cupo). Los seguimos consultando más
      // abajo: si el pago se acredita tarde, la reserva se recupera.
      await shiftService.releaseExpiredPending(companyCode);

      for (const shift of shifts) {
        if (result.checked >= limit || outOfTime()) {
          result.timedOut = true;
          return result;
        }
        try {
          result.checked += 1;
          const payment = await mercadoPagoService.findLastPaymentByShift(
            companyCode,
            String(shift._id),
          );
          if (!payment) continue;
          const newPaymentStatus = payment.status as string;
          const update: Partial<IShift> = {
            paymentStatus: newPaymentStatus,
            paymentId: String(payment.id),
          };
          if (newPaymentStatus === "approved") {
            update.status = "paid";
            update.paidAt = new Date();
            result.paid += 1;
          } else if (newPaymentStatus === "rejected") {
            update.status = "cancelled";
            result.rejected += 1;
          }
          await shiftService.updateOne({ _id: shift._id }, update);
          if (update.status === "paid") {
            await sendShiftConfirmationEmailOnce(String(shift._id));
          }
        } catch (e) {
          log.error(e, `Error reconciliando shift ${shift._id}`);
        }
      }
    }
  } catch (e) {
    log.error(e, "Error general en reconciliador MP");
  }
  return result;
}

let timer: NodeJS.Timeout | null = null;

export const paymentReconciler = {
  /**
   * Arranca el reconciliador con el intervalo indicado (ms). Por defecto 5 min.
   *
   * Solo sirve en un servidor de larga vida (local o VPS): en serverless la
   * instancia se congela entre requests y el intervalo no corre. En Vercel el
   * disparador es un cron externo (cron-job.org) contra
   * GET /payments/reconcile.
   */
  start(intervalMs: number = 5 * 60 * 1000) {
    if (timer) return;
    log.info(`Iniciando reconciliador MP cada ${intervalMs / 1000}s`);
    // Primer corrida diferida para no bloquear el arranque.
    timer = setInterval(() => reconcileOnce(), intervalMs);
    setTimeout(() => reconcileOnce(), 30 * 1000);
  },
  stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  },
  runNow: reconcileOnce,
};

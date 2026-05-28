import Log from "../libs/logger";
import { IShift } from "../models/shift";
import { mercadoPagoService } from "./mercadopago";
import { shiftService } from "./shift";

const log = new Log("PaymentReconciler");

/**
 * Para cada shift en pendingPayment, consulta MP por external_reference y
 * actualiza su estado. Red de seguridad por si falla el webhook.
 */
async function reconcileOnce() {
  try {
    // Buscar shifts pendingPayment de TODAS las compañías. Cada compañía
    // tiene su token MP propio, así que agrupamos por companyCode.
    const pending = await shiftService.find({ status: "pendingPayment" });
    if (!pending.length) return;

    const byCompany = new Map<string, typeof pending>();
    for (const s of pending) {
      const arr = byCompany.get(s.companyCode) || [];
      arr.push(s);
      byCompany.set(s.companyCode, arr);
    }

    for (const [companyCode, shifts] of byCompany) {
      // Liberar vencidos primero (libera cupo).
      await shiftService.releaseExpiredPending(companyCode);

      for (const shift of shifts) {
        try {
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
          } else if (newPaymentStatus === "rejected") {
            update.status = "cancelled";
          }
          await shiftService.updateOne({ _id: shift._id }, update);
        } catch (e) {
          log.error(e, `Error reconciliando shift ${shift._id}`);
        }
      }
    }
  } catch (e) {
    log.error(e, "Error general en reconciliador MP");
  }
}

let timer: NodeJS.Timeout | null = null;

export const paymentReconciler = {
  /**
   * Arranca el reconciliador con el intervalo indicado (ms). Por defecto 5 min.
   */
  start(intervalMs: number = 5 * 60 * 1000) {
    if (timer) return;
    log.info(`Iniciando reconciliador MP cada ${intervalMs / 1000}s`);
    // Primer corrida diferida para no bloquear el arranque.
    timer = setInterval(reconcileOnce, intervalMs);
    setTimeout(reconcileOnce, 30 * 1000);
  },
  stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  },
  runNow: reconcileOnce,
};

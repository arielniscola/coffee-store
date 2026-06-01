import Log from "../libs/logger";
import { IRouteController } from "../routes/index";
import { IShift } from "../models/shift";
import { mercadoPagoService } from "../services/mercadopago";
import { shiftService } from "../services/shift";
import { sendShiftConfirmationEmailOnce } from "../services/email";

export class PaymentsController {
  /**
   * Webhook IPN de Mercado Pago. Se llama cada vez que cambia el estado de
   * un pago. No requiere auth — MP lo invoca directamente. Para identificar
   * la compañía, esperamos ?company=XXX en la URL configurada como
   * notification_url al crear la preferencia.
   *
   * MP no garantiza un único intento: el handler debe ser idempotente.
   */
  static mercadoPagoWebhook: IRouteController<
    {},
    any,
    any,
    { company?: string; type?: string; "data.id"?: string; id?: string }
  > = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "PaymentsController.mercadoPagoWebhook",
    );
    // Siempre responder 200 rápido para que MP no reintente; el trabajo
    // se hace de forma defensiva (cualquier error se loguea, no se propaga).
    res.status(200).json({ ack: 0 });

    try {
      const companyCode =
        (req.query.company as string) || res.locals.companyCode;
      if (!companyCode) {
        logger.error(null, "Webhook MP sin companyCode");
        return;
      }

      // MP manda el id del pago en distintas ubicaciones según la versión.
      const paymentId =
        (req.body && req.body.data && req.body.data.id) ||
        req.query["data.id"] ||
        req.query.id ||
        (req.body && req.body.id);

      const type = (req.body && (req.body.type || req.body.topic)) || req.query.type;

      if (!paymentId || (type && type !== "payment")) {
        // Notificaciones que no son de pago (merchant_order, etc.) las ignoramos.
        return;
      }

      const payment = await mercadoPagoService.getPayment(
        companyCode,
        String(paymentId),
      );
      if (!payment) {
        logger.error(null, `Webhook: pago ${paymentId} no encontrado en MP`);
        return;
      }

      const shiftId = payment.external_reference;
      if (!shiftId || !shiftService.validateId(shiftId)) {
        logger.error(null, `Webhook: external_reference inválido (${shiftId})`);
        return;
      }

      const shift = await shiftService.findOne({ _id: shiftId });
      if (!shift) {
        logger.error(null, `Webhook: reserva ${shiftId} no existe`);
        return;
      }

      // Idempotencia: si ya está en estado final, no reescribir.
      if (shift.status === "paid" || shift.status === "confirmed") return;

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
      await shiftService.updateOne({ _id: shiftId }, update);

      // Pago acreditado: enviar email de confirmación (una sola vez).
      if (update.status === "paid") {
        await sendShiftConfirmationEmailOnce(shiftId);
      }
    } catch (e) {
      logger.error(e, "Error procesando webhook MP");
    }
  };

  /**
   * Lista los pagos de la cuenta de Mercado Pago de la compañía.
   * Acepta query params: from, to, limit. Devuelve cada pago con la reserva
   * vinculada si existe (matcheada por external_reference).
   */
  static listMercadoPago: IRouteController<
    {},
    {},
    {},
    { from?: string; to?: string; limit?: string }
  > = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "PaymentsController.listMercadoPago",
    );
    try {
      const companyCode = res.locals.companyCode;
      if (!companyCode) throw new Error("Compañía no identificada");

      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const payments = await mercadoPagoService.searchPayments(companyCode, {
        from: req.query.from,
        to: req.query.to,
        limit,
      });

      // Recolectar external_references únicas para buscar las reservas en lote
      const refIds = Array.from(
        new Set(
          payments
            .map((p: any) => p.external_reference)
            .filter((r: any) => r && shiftService.validateId(r)),
        ),
      ) as string[];

      const shifts = refIds.length
        ? await shiftService.find({ _id: { $in: refIds } as any })
        : [];
      const shiftMap = new Map(shifts.map((s: any) => [String(s._id), s]));

      const enriched = payments.map((p: any) => ({
        id: String(p.id),
        status: p.status,
        statusDetail: p.status_detail,
        amount: p.transaction_amount,
        netAmount: p.transaction_details?.net_received_amount,
        currency: p.currency_id,
        method: p.payment_method_id,
        type: p.payment_type_id,
        payerEmail: p.payer?.email,
        dateCreated: p.date_created,
        dateApproved: p.date_approved,
        externalReference: p.external_reference,
        shift: p.external_reference
          ? shiftMap.get(String(p.external_reference)) || null
          : null,
      }));

      return res.status(200).json({ ack: 0, data: enriched });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  /**
   * Vincula manualmente un paymentId con una reserva. Si el pago está
   * approved, también marca la reserva como paid.
   */
  static linkPayment: IRouteController<
    { id: string },
    {},
    { paymentId: string }
  > = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "PaymentsController.linkPayment",
    );
    try {
      const companyCode = res.locals.companyCode;
      const shiftId = req.params.id;
      const { paymentId } = req.body;
      if (!paymentId) throw new Error("paymentId es requerido");
      if (!shiftService.validateId(shiftId)) throw new Error("ID inválido");

      const shift = await shiftService.findOne({ _id: shiftId });
      if (!shift) throw new Error("Reserva no encontrada");

      const payment = await mercadoPagoService.getPayment(
        companyCode,
        paymentId,
      );
      if (!payment) throw new Error("Pago no encontrado en Mercado Pago");

      const update: any = {
        paymentId: String(payment.id),
        paymentStatus: payment.status,
      };
      if (payment.status === "approved") {
        update.status = "paid";
        update.paidAt = new Date();
      }
      await shiftService.updateOne({ _id: shiftId }, update);

      if (update.status === "paid") {
        await sendShiftConfirmationEmailOnce(shiftId);
      }

      return res.status(200).json({
        ack: 0,
        message: "Pago vinculado correctamente",
        paymentStatus: payment.status,
      });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };
}

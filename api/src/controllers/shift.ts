import moment from "moment";
import Log from "../libs/logger";
import { IShift } from "../models/shift";
import { IRouteController } from "../routes/index";
import { shiftService } from "../services/shift";
import configService from "../services/config";
import { tableService } from "../services/table";
import { mercadoPagoService } from "../services/mercadopago";
import { sendShiftConfirmationEmailOnce } from "../services/email";

export class ShiftController {
  static find: IRouteController<
    {},
    {},
    {},
    { date: string; unitBusiness?: string }
  > = async (req, res) => {
    const logger = new Log(res.locals.requestId, "ShiftController.find");
    try {
      const companyCode = res.locals.companyCode;
      // Reconciliar pagos pendientes con MP, luego liberar vencidos
      await this.reconcilePendingPayments(companyCode);
      await shiftService.releaseExpiredPending(companyCode);
      const startDate = moment(req.query.date, "YYYY-MM-DD")
        .startOf("day")
        .utc(true);
      const endDate = moment(req.query.date, "YYYY-MM-DD")
        .utc(true)
        .endOf("day");
      const filter = {
        ...{ companyCode: companyCode },
        // No mostrar reservas en pendingPayment como reservas reales
        status: { $ne: "pendingPayment" },
        ...(req.query.unitBusiness
          ? { unitBusiness: req.query.unitBusiness }
          : {}),
        ...(req.query.date
          ? { date: { $gte: startDate.toDate(), $lte: endDate.toDate() } }
          : {}),
      };
      const data: IShift[] = await shiftService.find(filter, {});

      return res.status(200).json({ ack: 0, data: data });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static create: IRouteController = async (req, res) => {
    const logger = new Log(res.locals.requestId, "ShiftController.create");
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const shift: IShift = req.body;
      shift.companyCode = companyCode;
      delete shift._id;
      // Convertir fecha string a Date UTC
      if (typeof shift.date === "string") {
        shift.date = moment(shift.date, "YYYY-MM-DD").utc(true).toDate();
      }
      /** Calculamos el tiempo de finalizacion */

      const shiftDuration = (
        await configService.findOne({
          code: "durationShift",
          companyCode: companyCode,
        })
      ).value as string;
      const initTime = this.parseTimeToMinutes(shift.timeStart);
      let endTime = initTime + parseInt(shiftDuration);
      let endtimeString = this.parseMinutesToTime(endTime);
      shift.timeEnd = endtimeString;

      const isValid = await shiftService.validate(shift);
      if (isValid) throw new Error(isValid.message);

      const created = await shiftService.insertOne(shift);
      if (!created) throw new Error("No se creo el turno");
      return res
        .status(200)
        .json({ ack: 0, message: "Se creo turno correctamente" });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static update: IRouteController = async (req, res) => {
    const logger = new Log(res.locals.requestId, "ShiftController.update");
    try {
      const companyCode = res.locals.companyCode;
      const shiftUpdate: IShift = req.body;
      // Convertir fecha string a Date UTC
      if (typeof shiftUpdate.date === "string") {
        const dateStr = (shiftUpdate.date as string).split("T")[0];
        shiftUpdate.date = moment(dateStr, "YYYY-MM-DD").utc(true).toDate();
      }
      /** Verificar si existe */
      const exist = await shiftService.findOne({
        _id: shiftUpdate._id,
      });
      if (!exist) throw new Error("Turno no encontrado");
      /** Calculamos el tiempo de finalizacion */

      const shiftDuration = (
        await configService.findOne({
          code: "durationShift",
          companyCode: companyCode,
        })
      ).value as string;
      const initTime = this.parseTimeToMinutes(shiftUpdate.timeStart);
      let endTime = initTime + parseInt(shiftDuration);
      let endtimeString = this.parseMinutesToTime(endTime);
      shiftUpdate.timeEnd = endtimeString;

      const response = await shiftService.updateOne(shiftUpdate);
      if (!response) throw new Error("Turno no se actualizo");
      return res.status(200).json({ ack: 0, message: "Turno actualizado" });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static delete: IRouteController<{ id: string }> = async (req, res) => {
    const logger = new Log(res.locals.requestId, "ShiftController.delete");
    try {
      const companyCode = res.locals.companyCode;
      const id = req.params.id;
      if (!shiftService.validateId(id)) throw new Error("ID no valido");

      const deleted = await shiftService.deleteOne({ _id: id });
      if (!deleted) throw new Error("No se pude eliminar turno");
      res
        .status(200)
        .json({ ack: 0, message: "Turno eliminado correctamente" });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static statistics: IRouteController<{}, {}, {}, { date: string }> = async (
    req,
    res
  ) => {
    const logger = new Log(res.locals.requestId, "ShiftController.statistics");
    try {
      const companyCode = res.locals.companyCode;
      const startDate = moment(req.query.date, "MM/YYYY")
        .startOf("month")
        .utc(true);
      const endDate = moment(req.query.date, "MM/YYYY")
        .utc(true)
        .endOf("month");
      const filter = {
        ...{ companyCode: companyCode },
        ...(req.query.date
          ? { date: { $gte: startDate.toDate(), $lte: endDate.toDate() } }
          : {}),
      };
      const data: IShift[] = await shiftService.find(filter, {}, {});
      let totalForStatus = {
        paid: 0,
        confirmed: 0,
        people: 0,
        adults: 0,
        children: 0,
        toConfirm: 0,
        cancelled: 0,
        total: 0,
      };
      for (const el of data) {
        // Excluir reservas en espera de pago: no son reservas reales todavía
        if (el.status === "pendingPayment") continue;
        if (el.status === "paid") totalForStatus.paid += 1;
        if (el.status === "confirmed") totalForStatus.confirmed += 1;

        if (el.status === "toConfirm") totalForStatus.toConfirm += 1;
        if (el.status === "cancelled") totalForStatus.cancelled += 1;
        totalForStatus.total += 1;
        totalForStatus.people += el.peopleQty ? el.peopleQty : 0;
        totalForStatus.adults += el.adultsQty ? el.adultsQty : 0;
        totalForStatus.children += el.childrenQty ? el.childrenQty : 0;
      }
      return res.status(200).json({ ack: 0, data: totalForStatus });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static getAvaliableShifts: IRouteController<
    {},
    {},
    {},
    { date: string; unitBusiness: string }
  > = async (req, res) => {
    const logger = new Log(res.locals.requestId, "ShiftController.avaliable");
    try {
      const companyCode = res.locals.companyCode;
      const date = req.query.date
        ? req.query.date
        : moment().format("YYYY-MM-DD");
      const startDate = moment(date, "YYYY-MM-DD").startOf("day").utc(true);
      const endDate = moment(date, "YYYY-MM-DD").utc(true).endOf("day");
      const filter = {
        ...{ companyCode: companyCode },
        ...{ status: { $ne: "cancelled" } },
        ...(req.query.unitBusiness
          ? { unitBusiness: req.query.unitBusiness }
          : {}),
        ...(date
          ? { date: { $gte: startDate.toDate(), $lte: endDate.toDate() } }
          : {}),
      };
      /** Obtenemos los turnos creados de la fecha */
      const shifts = await shiftService.find(filter);

      const reservationsAvailables = await this.getScheduleDay(
        date,
        companyCode,
        req.query.unitBusiness,
        shifts
      );

      return res.status(200).json({ ack: 0, data: reservationsAvailables });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  private static async getScheduleDay(
    date: string,
    companyCode: string,
    unitBusiness: string,
    shifts: IShift[]
  ) {
    /** Obtenemos el dia en inglés para coincidir con configuración */
    let day = moment(date).locale("en").format("dddd");
    day = day.charAt(0).toUpperCase() + day.slice(1);
    /** Obtenemos datos de inicio, duracion, final de dia */
    const timeSchedule = (
      await configService.findOne({ code: `scheduleDay${day}` })
    ).value as string;
    const durationConfig = (
      await configService.findOne({
        code: "durationShift",
      })
    ).value as string;
    /** Validamos cuantos horarios contiene */
    const scheduleSlot = timeSchedule.trim().split(",");

    /** Obtenemos las mesas disponibles */
    const tables = await tableService.find({
      companyCode: companyCode,
      unitBusiness: unitBusiness,
      active: true,
    });
    let totalPlaces = 0;
    tables.map((tab) => (totalPlaces += tab.capacity));
    let reservationsAvailables: { availables: number; initialTime: string }[] =
      [];
    /** Algoritmo para obtener turnos restantes disponibles */
    for (const slot of scheduleSlot) {
      const timeSlotArray = slot.split("-");
      let initialTime = this.parseTimeToMinutes(timeSlotArray[0]);
      let endTime = this.parseTimeToMinutes(timeSlotArray[1]);
      let countTime = 0;

      countTime = initialTime;
      while (endTime > countTime) {
        reservationsAvailables.push({
          availables: totalPlaces,
          initialTime: this.parseMinutesToTime(countTime),
        });
        countTime += parseInt(durationConfig);
      }
    }
    for (const reserv of shifts) {
      const index = reservationsAvailables.findIndex(
        (r) => r.initialTime === reserv.timeStart
      );
      if (index !== -1) {
        reservationsAvailables[index].availables -= reserv.peopleQty;
      }
    }
    return reservationsAvailables;
  }

  /**
   * Crea una reserva en estado pendingPayment, libera cupos viejos vencidos,
   * genera la preferencia de Mercado Pago y devuelve el link de checkout.
   */
  static checkout: IRouteController = async (req, res) => {
    const logger = new Log(res.locals.requestId, "ShiftController.checkout");
    try {
      const companyCode = res.locals.companyCode || "wichiwi";

      // Liberar reservas pendientes vencidas (>15 min sin pagar)
      await shiftService.releaseExpiredPending(companyCode);

      const shift: IShift = req.body;
      shift.companyCode = companyCode;
      shift.status = "pendingPayment";
      delete shift._id;

      if (typeof shift.date === "string") {
        shift.date = moment(shift.date, "YYYY-MM-DD").utc(true).toDate();
      }
      const shiftDuration = (
        await configService.findOne({
          code: "durationShift",
          companyCode,
        })
      ).value as string;
      const initTime = this.parseTimeToMinutes(shift.timeStart);
      shift.timeEnd = this.parseMinutesToTime(
        initTime + parseInt(shiftDuration),
      );

      const expiresAt = moment().add(15, "minutes").toDate();
      shift.paymentExpiresAt = expiresAt;
      const totalPrice = Number(shift.price) || 0;

      // Idempotencia: si el mismo cliente ya tiene una reserva pendingPayment
      // viva para el mismo turno, reusarla en vez de duplicar.
      if (totalPrice > 0 && shift.email) {
        const existing = await shiftService.findOne({
          companyCode,
          status: "pendingPayment",
          email: shift.email,
          date: shift.date,
          timeStart: shift.timeStart,
          unitBusiness: shift.unitBusiness,
          paymentExpiresAt: { $gt: new Date() } as any,
        });
        if (existing && existing.paymentLink) {
          return res.status(200).json({
            ack: 0,
            shiftId: String(existing._id),
            requiresPayment: true,
            paymentLink: existing.paymentLink,
            reused: true,
          });
        }
      }

      const isValid = await shiftService.validate(shift);
      if (isValid) throw new Error(isValid.message);

      const created = await shiftService.insertOne(shift);
      if (!created) throw new Error("No se creo el turno");

      if (totalPrice <= 0) {
        return res.status(200).json({
          ack: 0,
          shiftId: String(created._id),
          requiresPayment: false,
          message: "Reserva creada (sin pago requerido)",
        });
      }

      const pref = await mercadoPagoService.createPreference({
        shiftId: String(created._id),
        companyCode,
        title: `Reserva ${moment(shift.date).format("DD/MM/YYYY")} ${shift.timeStart}`,
        unitPrice: totalPrice,
        quantity: 1,
        payerEmail: shift.email,
        expirationDate: expiresAt.toISOString(),
      });

      if (!pref) {
        // Si MP falla, mantener la reserva pero avisar
        return res.status(200).json({
          ack: 0,
          shiftId: String(created._id),
          requiresPayment: true,
          paymentLink: null,
          message:
            "Reserva creada, pero no se pudo generar link de pago. Contactar al negocio.",
        });
      }

      await shiftService.updateOne(
        { _id: created._id },
        {
          preferenceId: pref.preferenceId,
          paymentLink: pref.initPoint,
          paymentStatus: "pending",
        },
      );

      return res.status(200).json({
        ack: 0,
        shiftId: String(created._id),
        requiresPayment: true,
        paymentLink: pref.initPoint,
      });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  /**
   * Consulta el estado de pago de una reserva (fallback polling sin webhook).
   * Si MP marca approved, confirma la reserva.
   */
  static paymentStatus: IRouteController<
    { id: string },
    {},
    {},
    { payment_id?: string }
  > = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "ShiftController.paymentStatus",
    );
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const id = req.params.id;
      if (!shiftService.validateId(id)) throw new Error("ID inválido");

      const shift = await shiftService.findOne({ _id: id });
      if (!shift) throw new Error("Reserva no encontrada");

      const summary = {
        client: shift.client,
        date: shift.date,
        timeStart: shift.timeStart,
        peopleQty: shift.peopleQty,
        adultsQty: shift.adultsQty,
        childrenQty: shift.childrenQty,
        price: shift.price,
        paymentLink: shift.paymentLink,
      };

      if (shift.status === "confirmed" || shift.status === "paid") {
        return res.status(200).json({
          ack: 0,
          status: shift.status,
          paymentStatus: shift.paymentStatus,
          paidAt: shift.paidAt,
          shift: summary,
        });
      }

      // Si MP devolvió payment_id en el back_url, consultar ese pago directo.
      // Fallback: buscar por external_reference = shiftId.
      const paymentIdParam = req.query.payment_id;
      const lastPayment = paymentIdParam
        ? await mercadoPagoService.getPayment(companyCode, paymentIdParam)
        : await mercadoPagoService.findLastPaymentByShift(companyCode, id);

      if (!lastPayment) {
        return res.status(200).json({
          ack: 0,
          status: shift.status,
          paymentStatus: shift.paymentStatus || "pending",
          shift: summary,
        });
      }

      const newPaymentStatus = lastPayment.status as string;
      const update: Partial<IShift> = {
        paymentStatus: newPaymentStatus,
        paymentId: String(lastPayment.id),
      };
      if (newPaymentStatus === "approved") {
        update.status = "paid";
        update.paidAt = new Date();
      } else if (newPaymentStatus === "rejected") {
        update.status = "cancelled";
      }
      await shiftService.updateOne({ _id: id }, update);

      // Pago acreditado vía polling: enviar email de confirmación (una vez).
      if (update.status === "paid") {
        await sendShiftConfirmationEmailOnce(id);
      }

      return res.status(200).json({
        ack: 0,
        status: update.status || shift.status,
        paymentStatus: newPaymentStatus,
        paidAt: update.paidAt,
        shift: summary,
      });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  /**
   * Para cada shift en pendingPayment, consulta MP por external_reference
   * y actualiza el estado de la reserva si el pago fue approved/rejected.
   * Se llama antes de listar reservas, así el admin ve siempre el estado real.
   */
  private static async reconcilePendingPayments(companyCode: string) {
    try {
      const pending = await shiftService.findPendingPayments(companyCode);
      for (const shift of pending) {
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
        if (update.status === "paid") {
          await sendShiftConfirmationEmailOnce(String(shift._id));
        }
      }
    } catch (e) {
      // No bloquear el listado si MP falla
    }
  }

  private static parseTimeToMinutes(time: string): number {
    const timeSplit = time.split(":");
    return parseInt(timeSplit[0]) * 60 + parseInt(timeSplit[1]);
  }
  private static parseMinutesToTime(time: number): string {
    const hora = Math.floor(time / 60);
    const min = time % 60;
    return `${String(hora).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }
}

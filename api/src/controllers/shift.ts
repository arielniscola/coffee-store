import moment from "moment";
import Log from "../libs/logger";
import { IShift } from "../models/shift";
import { IRouteController } from "../routes/index";
import { shiftService } from "../services/shift";
import configService from "../services/config";
import { mercadoPagoService } from "../services/mercadopago";
import { sendShiftConfirmationEmailOnce } from "../services/email";
import {
  scheduleExceptionService,
  minutesToTime,
} from "../services/scheduleException";
import { weeklyScheduleService } from "../services/weeklySchedule";
import { workshopService } from "../services/workshop";

export class ShiftController {
  static find: IRouteController<
    {},
    {},
    {},
    { date?: string; dateFrom?: string; dateTo?: string; unitBusiness?: string }
  > = async (req, res) => {
    const logger = new Log(res.locals.requestId, "ShiftController.find");
    try {
      const companyCode = res.locals.companyCode;
      // Reconciliar pagos pendientes con MP, luego liberar vencidos
      await this.reconcilePendingPayments(companyCode);
      await shiftService.releaseExpiredPending(companyCode);

      // Filtro de fecha: soporta un rango (dateFrom / dateTo, cualquiera
      // opcional) o un día puntual (date, legacy del calendario). Si no se
      // envía ninguno, se devuelven todos los turnos.
      const { date, dateFrom, dateTo } = req.query;
      let dateFilter: { $gte?: Date; $lte?: Date } | undefined;
      if (dateFrom || dateTo) {
        dateFilter = {};
        if (dateFrom)
          dateFilter.$gte = moment(dateFrom, "YYYY-MM-DD")
            .startOf("day")
            .utc(true)
            .toDate();
        if (dateTo)
          dateFilter.$lte = moment(dateTo, "YYYY-MM-DD")
            .utc(true)
            .endOf("day")
            .toDate();
      } else if (date) {
        dateFilter = {
          $gte: moment(date, "YYYY-MM-DD").startOf("day").utc(true).toDate(),
          $lte: moment(date, "YYYY-MM-DD").utc(true).endOf("day").toDate(),
        };
      }

      const filter = {
        ...{ companyCode: companyCode },
        // No mostrar reservas en pendingPayment como reservas reales
        status: { $ne: "pendingPayment" },
        ...(req.query.unitBusiness
          ? { unitBusiness: req.query.unitBusiness }
          : {}),
        ...(dateFilter ? { date: dateFilter } : {}),
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
      // No permitir reservas en fechas marcadas como cerradas.
      const dateStr =
        typeof shift.date === "string"
          ? (shift.date as string).split("T")[0]
          : moment(shift.date).format("YYYY-MM-DD");
      if (await this.isDateClosed(companyCode, dateStr)) {
        throw new Error(
          "El local está cerrado en la fecha seleccionada. Por favor elegí otra fecha."
        );
      }
      // Convertir fecha string a Date UTC
      if (typeof shift.date === "string") {
        shift.date = moment(shift.date, "YYYY-MM-DD").utc(true).toDate();
      }
      /** Calculamos el tiempo de finalizacion */

      const shiftDuration = await this.requireShiftDurationMinutes(companyCode);
      const initTime = this.parseTimeToMinutes(shift.timeStart);
      let endTime = initTime + shiftDuration;
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

      const shiftDuration = await this.requireShiftDurationMinutes(companyCode);
      const initTime = this.parseTimeToMinutes(shiftUpdate.timeStart);
      let endTime = initTime + shiftDuration;
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
        babies: 0,
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
        totalForStatus.babies += el.babiesQty ? el.babiesQty : 0;
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
      // El endpoint es público y puede no resolver companyCode, igual que
      // checkout/create usamos "wichiwi" como compañía por defecto.
      const companyCode = res.locals.companyCode || "wichiwi";
      const date = req.query.date
        ? req.query.date
        : moment().format("YYYY-MM-DD");
      // Liberar las reservas pendientes vencidas antes de medir la ocupación.
      // Sin esto, un checkout abandonado retiene el cupo indefinidamente: el
      // horario se ve lleno, el cliente no puede avanzar y por lo tanto nunca
      // llega a /shifts/checkout, que era el único punto que las liberaba.
      await shiftService.releaseExpiredPending(companyCode);
      // Si el local está cerrado ese día, no hay horarios disponibles.
      if (await this.isDateClosed(companyCode, date)) {
        return res.status(200).json({ ack: 0, data: [] });
      }
      const startDate = moment(date, "YYYY-MM-DD").startOf("day").utc(true);
      const endDate = moment(date, "YYYY-MM-DD").utc(true).endOf("day");
      const filter = {
        ...{ companyCode: companyCode },
        ...{ status: { $ne: "cancelled" } },
        // Defensa en profundidad: aunque la liberación de arriba no haya
        // corrido, una pendingPayment ya vencida no debe ocupar lugares.
        ...{
          $nor: [
            { status: "pendingPayment", paymentExpiresAt: { $lt: new Date() } },
          ],
        },
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
    /** Duración del turno (por compañía) */
    const durationMin = await this.getShiftDurationMinutes(companyCode);
    // Sin duración configurada no hay forma de generar slots.
    if (!durationMin) return [];
    /**
     * Rangos del horario semanal estructurado (con fallback al config legacy),
     * ajustados por las excepciones (abrir/cerrar).
     */
    const weeklyRanges = await weeklyScheduleService.getRangesForDay(
      companyCode,
      day
    );
    const exceptions = await scheduleExceptionService.findActiveForDate(
      companyCode,
      date
    );
    const effectiveRanges = scheduleExceptionService.computeEffectiveRanges(
      weeklyRanges,
      exceptions
    );

    /** Capacidad diferenciada de adultos y niños según el modo configurado */
    const capacity = await shiftService.getCapacity(companyCode, unitBusiness);
    /**
     * Franjas sin seña del día. Se toman del horario semanal (no de los rangos
     * efectivos, que vienen fusionados) y no aplican si ese día hay taller: el
     * taller siempre se cobra.
     */
    const freeRanges = (await workshopService.findActiveByDate(companyCode, date))
      ? []
      : weeklyRanges.filter((r) => r.free);
    let reservationsAvailables: {
      availables: number;
      availablesAdults: number;
      availablesChildren: number;
      initialTime: string;
      free: boolean;
    }[] = [];
    /** Algoritmo para obtener turnos restantes disponibles */
    for (const range of effectiveRanges) {
      let countTime = range.start;
      while (range.end > countTime) {
        reservationsAvailables.push({
          availables: capacity.adults + capacity.children,
          availablesAdults: capacity.adults,
          availablesChildren: capacity.children,
          initialTime: minutesToTime(countTime),
          free: this.isInRanges(freeRanges, countTime),
        });
        countTime += durationMin;
      }
    }
    for (const reserv of shifts) {
      const index = reservationsAvailables.findIndex(
        (r) => r.initialTime === reserv.timeStart
      );
      if (index !== -1) {
        reservationsAvailables[index].availablesAdults -= reserv.adultsQty || 0;
        reservationsAvailables[index].availablesChildren -=
          reserv.childrenQty || 0;
        reservationsAvailables[index].availables =
          reservationsAvailables[index].availablesAdults +
          reservationsAvailables[index].availablesChildren;
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

      // No permitir reservas en fechas marcadas como cerradas.
      const dateStr =
        typeof shift.date === "string"
          ? (shift.date as string).split("T")[0]
          : moment(shift.date).format("YYYY-MM-DD");
      if (await this.isDateClosed(companyCode, dateStr)) {
        throw new Error(
          "El local está cerrado en la fecha seleccionada. Por favor elegí otra fecha."
        );
      }
      // No permitir reservas más allá de la ventana de anticipación permitida.
      const windowError = await this.getWindowError(companyCode, dateStr);
      if (windowError) throw new Error(windowError);

      if (typeof shift.date === "string") {
        shift.date = moment(shift.date, "YYYY-MM-DD").utc(true).toDate();
      }
      const shiftDuration = await this.requireShiftDurationMinutes(companyCode);
      const initTime = this.parseTimeToMinutes(shift.timeStart);
      shift.timeEnd = this.parseMinutesToTime(initTime + shiftDuration);

      const expiresAt = moment().add(15, "minutes").toDate();
      shift.paymentExpiresAt = expiresAt;

      // El precio se recalcula siempre en el servidor para no depender del
      // que manda el cliente. Si la fecha tiene taller, el precio por niño
      // lo define el taller.
      const workshop = await workshopService.findActiveByDate(
        companyCode,
        dateStr
      );
      const priceChildConfig = await configService.findOne({
        code: "priceChild",
        companyCode,
      });
      const priceAdultConfig = await configService.findOne({
        code: "priceAdult",
        companyCode,
      });
      const priceChild = workshop
        ? workshop.priceChild
        : Number(priceChildConfig?.value) || 0;
      const priceAdult = Number(priceAdultConfig?.value) || 0;
      const adultsQty = shift.adultsQty || 0;
      const childrenQty = shift.childrenQty || 0;

      // El cobro es excluyente: si la reserva incluye al menos un niño se cobra
      // únicamente por los niños; si no hay niños se cobra por los adultos.
      // Los bebés nunca abonan.
      // Si el horario elegido cae en una franja sin seña, la reserva no abona.
      const freeSlot =
        !workshop && (await this.isFreeSlot(companyCode, dateStr, shift.timeStart));
      const totalPrice = freeSlot
        ? 0
        : childrenQty > 0
          ? childrenQty * priceChild
          : adultsQty * priceAdult;
      shift.price = totalPrice;

      // Sin monto a pagar (franja sin seña o precios en 0) la reserva no pasa
      // por Mercado Pago: se guarda directo a confirmar y sin vencimiento, si
      // no la liberaría releaseExpiredPending a los 15 minutos.
      if (totalPrice <= 0) {
        shift.status = "toConfirm";
        shift.paymentExpiresAt = undefined;
      }

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
        title: workshop
          ? `Taller "${workshop.title}" ${moment(shift.date).format("DD/MM/YYYY")} ${shift.timeStart}`
          : `Reserva ${moment(shift.date).format("DD/MM/YYYY")} ${shift.timeStart}`,
        unitPrice: totalPrice,
        quantity: 1,
        payerEmail: shift.email,
        expirationDate: expiresAt.toISOString(),
      });

      if (!pref) {
        // Sin link de pago la reserva no se puede completar: se cancela para
        // liberar el cupo enseguida (si no, lo bloquea 15 minutos y además
        // impide que el propio cliente reintente) y se responde como error,
        // así el front no muestra la reserva como confirmada.
        await shiftService.updateOne(
          { _id: created._id },
          { status: "cancelled", paymentStatus: "preference_failed" },
        );
        return res.status(400).json({
          ack: 1,
          shiftId: String(created._id),
          message:
            "No pudimos generar el link de pago. Por favor probá de nuevo en unos minutos o escribinos por WhatsApp.",
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
        babiesQty: shift.babiesQty,
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
   * Genera un checkout nuevo para una reserva que no llegó a pagarse (pago
   * rechazado o vencimiento de los 15 minutos). La preferencia anterior no
   * sirve: nace con `expires` a 15 minutos, así que reintentar siempre exige
   * crear una nueva y volver a tomar el cupo.
   */
  static retryPayment: IRouteController<{ id: string }> = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "ShiftController.retryPayment",
    );
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const id = req.params.id;
      if (!shiftService.validateId(id)) throw new Error("ID inválido");

      const shift = await shiftService.findOne({ _id: id });
      if (!shift) throw new Error("Reserva no encontrada");

      // Ya está paga: no hay nada que reintentar.
      if (shift.status === "paid" || shift.status === "confirmed") {
        return res.status(200).json({
          ack: 0,
          alreadyPaid: true,
          message: "La reserva ya figura como pagada.",
        });
      }
      if (!shift.price || shift.price <= 0) {
        throw new Error("Esta reserva no requiere seña.");
      }

      const dateStr = moment(shift.date).utc().format("YYYY-MM-DD");
      if (dateStr < moment().format("YYYY-MM-DD")) {
        throw new Error(
          "La fecha de la reserva ya pasó. Por favor hacé una reserva nueva.",
        );
      }
      if (await this.isDateClosed(companyCode, dateStr)) {
        throw new Error("El local está cerrado en la fecha de la reserva.");
      }

      // Liberar vencidas primero, para no medir el cupo contra reservas muertas.
      await shiftService.releaseExpiredPending(companyCode);

      // Entre el rechazo y el reintento el cupo pudo haberse ocupado. Se
      // revalida excluyendo esta misma reserva.
      const hasRoom = await shiftService.validatedShift({
        _id: id,
        companyCode,
        date: shift.date,
        timeStart: shift.timeStart,
        unitBusiness: shift.unitBusiness,
        adultsQty: shift.adultsQty,
        childrenQty: shift.childrenQty,
      });
      if (!hasRoom) {
        throw new Error(
          "Ese horario ya no tiene lugar disponible. Elegí otro horario.",
        );
      }

      const expiresAt = moment().add(15, "minutes").toDate();
      const workshop = await workshopService.findActiveByDate(
        companyCode,
        dateStr,
      );
      const pref = await mercadoPagoService.createPreference({
        shiftId: id,
        companyCode,
        title: workshop
          ? `Taller "${workshop.title}" ${moment(shift.date).utc().format("DD/MM/YYYY")} ${shift.timeStart}`
          : `Reserva ${moment(shift.date).utc().format("DD/MM/YYYY")} ${shift.timeStart}`,
        unitPrice: shift.price,
        quantity: 1,
        payerEmail: shift.email,
        expirationDate: expiresAt.toISOString(),
      });
      if (!pref) {
        throw new Error(
          "No pudimos generar el link de pago. Probá de nuevo en unos minutos.",
        );
      }

      // La reserva vuelve a tomar el cupo por otros 15 minutos.
      await shiftService.updateOne(
        { _id: id },
        {
          status: "pendingPayment",
          paymentExpiresAt: expiresAt,
          preferenceId: pref.preferenceId,
          paymentLink: pref.initPoint,
          paymentStatus: "pending",
        },
      );

      return res.status(200).json({
        ack: 0,
        shiftId: id,
        paymentLink: pref.initPoint,
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

  /**
   * Determina si una fecha (yyyy-MM-dd) está marcada como cerrada para la
   * compañía. Las fechas cerradas se configuran desde el dashboard en el
   * parámetro `closedDates` (lista separada por coma).
   */
  private static async isDateClosed(
    companyCode: string,
    date: string
  ): Promise<boolean> {
    try {
      return await scheduleExceptionService.isDateClosed(companyCode, date);
    } catch (e) {
      // Si falla, no bloquear las reservas.
      return false;
    }
  }

  /**
   * Límite de anticipación (config `reservationMaxDays`): cantidad de días
   * hacia adelante desde hoy en los que se puede reservar. 0 o ausente = sin
   * límite. Devuelve 0 si no hay límite configurado.
   */
  private static async getReservationMaxDays(
    companyCode: string
  ): Promise<number> {
    try {
      const cfg = await configService.findOne({
        code: "reservationMaxDays",
        companyCode,
      });
      const n = parseInt(String(cfg?.value ?? "0"), 10);
      return Number.isNaN(n) || n < 0 ? 0 : n;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Si la fecha (yyyy-MM-dd) excede la ventana de reservas permitida
   * (hoy + `reservationMaxDays`), devuelve un mensaje de error para mostrar al
   * cliente; si está dentro de la ventana (o no hay límite), devuelve null.
   * La comparación es lexicográfica sobre yyyy-MM-dd.
   */
  private static async getWindowError(
    companyCode: string,
    date: string
  ): Promise<string | null> {
    const maxDays = await this.getReservationMaxDays(companyCode);
    if (!maxDays) return null;
    const todayStr = moment().format("YYYY-MM-DD");
    const maxDateStr = moment(todayStr, "YYYY-MM-DD")
      .add(maxDays, "days")
      .format("YYYY-MM-DD");
    if (date <= maxDateStr) return null;
    return `Solo se puede reservar hasta el ${moment(
      maxDateStr,
      "YYYY-MM-DD"
    ).format("DD/MM/YYYY")} (máximo ${maxDays} días de anticipación).`;
  }

  /**
   * Endpoint público: lista de fechas (yyyy-MM-dd) totalmente cerradas, para
   * deshabilitarlas en el selector de fechas del flujo de reserva.
   */
  static closedDates: IRouteController = async (req, res) => {
    const logger = new Log(res.locals.requestId, "ShiftController.closedDates");
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const data = await scheduleExceptionService.getClosedDates(companyCode);
      return res.status(200).json({ ack: 0, data });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  /** True si los minutos caen dentro de alguno de los rangos [start, end). */
  private static isInRanges(
    ranges: { start: number; end: number }[],
    minutes: number
  ): boolean {
    return ranges.some((r) => minutes >= r.start && minutes < r.end);
  }

  /**
   * Determina si el horario (HH:mm) de una fecha cae en una franja marcada
   * como "sin seña" en el horario semanal. Ante cualquier error se asume que
   * la reserva sí abona, para no perder el cobro por una falla de lectura.
   */
  private static async isFreeSlot(
    companyCode: string,
    date: string,
    timeStart: string
  ): Promise<boolean> {
    try {
      if (!timeStart) return false;
      let day = moment(date, "YYYY-MM-DD").locale("en").format("dddd");
      day = day.charAt(0).toUpperCase() + day.slice(1);
      const ranges = await weeklyScheduleService.getRangesForDay(
        companyCode,
        day
      );
      return this.isInRanges(
        ranges.filter((r) => r.free),
        this.parseTimeToMinutes(timeStart)
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Duración del turno en minutos (config `durationShift`). Devuelve 0 si el
   * config no existe o no es un número positivo, para que cada caller decida
   * qué hacer: generar cero slots o cortar con un error explícito.
   */
  private static async getShiftDurationMinutes(
    companyCode: string
  ): Promise<number> {
    try {
      const cfg = await configService.findOne({
        code: "durationShift",
        companyCode,
      });
      const n = parseInt(String(cfg?.value ?? ""), 10);
      return Number.isNaN(n) || n <= 0 ? 0 : n;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Igual que getShiftDurationMinutes, pero lanza un error entendible en vez
   * de dejar reventar un `null.value` con un TypeError que termina llegando al
   * cliente como mensaje de la reserva fallida.
   */
  private static async requireShiftDurationMinutes(
    companyCode: string
  ): Promise<number> {
    const duration = await this.getShiftDurationMinutes(companyCode);
    if (!duration) {
      throw new Error(
        "La duración del turno no está configurada. Por favor escribinos por WhatsApp para completar la reserva."
      );
    }
    return duration;
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

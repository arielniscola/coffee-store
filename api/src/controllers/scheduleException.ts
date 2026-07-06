import moment from "moment";
import Log from "../libs/logger";
import { IRouteController } from "../routes/index";
import { IScheduleException } from "../models/scheduleException";
import {
  scheduleExceptionService,
  timeToMinutes,
} from "../services/scheduleException";
import { shiftService } from "../services/shift";

export class ScheduleExceptionController {
  static find: IRouteController = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "ScheduleExceptionController.find"
    );
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const data = await scheduleExceptionService.find(
        { companyCode },
        {},
        { sort: { dateFrom: 1, timeStart: 1 } }
      );
      return res.status(200).json({ ack: 0, data });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  /**
   * Endpoint público: aperturas especiales vigentes (tipo "open"), para
   * informarlas en la landing como "fechas especiales".
   */
  static publicUpcoming: IRouteController = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "ScheduleExceptionController.publicUpcoming"
    );
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const data = await scheduleExceptionService.findUpcomingOpen(companyCode);
      return res.status(200).json({ ack: 0, data });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static create: IRouteController = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "ScheduleExceptionController.create"
    );
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const body: Partial<IScheduleException> & {
        dateFrom?: string;
        dateTo?: string;
      } = req.body;

      const type = body.type;
      const allDay = body.allDay === true;
      const dateFrom = String(body.dateFrom || "");
      const dateTo = String(body.dateTo || "");
      // En un cierre de día completo las horas no aplican: usamos el día entero.
      const timeStart = allDay ? "00:00" : String(body.timeStart || "");
      const timeEnd = allDay ? "23:59" : String(body.timeEnd || "");

      // Validaciones básicas de entrada.
      if (type !== "open" && type !== "close") {
        throw new Error("El tipo debe ser 'open' o 'close'.");
      }
      if (allDay && type !== "close") {
        throw new Error("El día completo solo aplica a cierres.");
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
        throw new Error("Fechas inválidas. Formato esperado yyyy-MM-dd.");
      }
      if (moment(dateTo).isBefore(moment(dateFrom), "day")) {
        throw new Error("La fecha de fin no puede ser anterior a la de inicio.");
      }
      if (!allDay) {
        if (!/^\d{2}:\d{2}$/.test(timeStart) || !/^\d{2}:\d{2}$/.test(timeEnd)) {
          throw new Error("Horas inválidas. Formato esperado HH:mm.");
        }
        if (timeToMinutes(timeEnd) <= timeToMinutes(timeStart)) {
          throw new Error("La hora de fin debe ser posterior a la de inicio.");
        }
      }

      // Para "open" verificamos que no se pise con el horario ya configurado.
      if (type === "open") {
        const conflicts = await scheduleExceptionService.findOpenConflicts(
          companyCode,
          dateFrom,
          dateTo,
          timeStart,
          timeEnd
        );
        if (conflicts.length > 0) {
          const sample = conflicts.slice(0, 5).join(", ");
          const extra = conflicts.length > 5 ? `… (+${conflicts.length - 5})` : "";
          throw new Error(
            `La franja ${timeStart}-${timeEnd} se solapa con horarios ya configurados en: ${sample}${extra}`
          );
        }
      }

      const created = await scheduleExceptionService.insertOne({
        companyCode,
        type,
        allDay,
        timeStart,
        timeEnd,
        dateFrom: moment(dateFrom, "YYYY-MM-DD").utc(true).startOf("day").toDate(),
        dateTo: moment(dateTo, "YYYY-MM-DD").utc(true).startOf("day").toDate(),
      });

      // Al cerrar, contamos reservas existentes afectadas para avisar (no se
      // cancelan automáticamente).
      let affectedReservations = 0;
      if (type === "close") {
        affectedReservations = await this.countAffectedReservations(
          companyCode,
          dateFrom,
          dateTo,
          timeStart,
          timeEnd
        );
      }

      return res.status(200).json({
        ack: 0,
        message: "Excepción de horario creada",
        data: created,
        affectedReservations,
      });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static delete: IRouteController<{ id: string }> = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "ScheduleExceptionController.delete"
    );
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const id = req.params.id;
      if (!scheduleExceptionService.validateId(id)) {
        throw new Error("ID no válido");
      }
      const deleted = await scheduleExceptionService.deleteOne({
        _id: id,
        companyCode,
      });
      if (!deleted.deletedCount) throw new Error("Excepción no encontrada");
      return res
        .status(200)
        .json({ ack: 0, message: "Excepción eliminada correctamente" });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  /**
   * Cuenta reservas activas cuyo horario de inicio cae dentro de la franja
   * [timeStart, timeEnd) en cualquier fecha del rango. Solo informativo.
   */
  private static async countAffectedReservations(
    companyCode: string,
    dateFrom: string,
    dateTo: string,
    timeStart: string,
    timeEnd: string
  ): Promise<number> {
    const start = moment(dateFrom, "YYYY-MM-DD").utc(true).startOf("day");
    const end = moment(dateTo, "YYYY-MM-DD").utc(true).endOf("day");
    const shifts = await shiftService.find({
      companyCode,
      status: { $nin: ["cancelled", "pendingPayment"] },
      date: { $gte: start.toDate(), $lte: end.toDate() },
    });
    const from = timeToMinutes(timeStart);
    const to = timeToMinutes(timeEnd);
    return shifts.filter((s) => {
      const m = timeToMinutes(s.timeStart);
      return m >= from && m < to;
    }).length;
  }
}

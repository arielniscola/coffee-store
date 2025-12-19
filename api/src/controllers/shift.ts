import moment from "moment";
import Log from "../libs/logger";
import { IShift } from "../models/shift";
import { IRouteController } from "../routes/index";
import { shiftService } from "../services/shift";
import configService from "../services/config";
import { tableService } from "../services/table";

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
      const startDate = moment(req.query.date, "YYYY/MM/DD")
        .startOf("day")
        .utc(true);
      const endDate = moment(req.query.date, "YYYY/MM/DD")
        .utc(true)
        .endOf("day");
      const filter = {
        ...{ companyCode: companyCode },
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
        toConfirm: 0,
        cancelled: 0,
        total: 0,
      };
      for (const el of data) {
        if (el.status === "paid") totalForStatus.paid += 1;
        if (el.status === "confirmed") totalForStatus.confirmed += 1;

        if (el.status === "toConfirm") totalForStatus.toConfirm += 1;
        if (el.status === "cancelled") totalForStatus.cancelled += 1;
        totalForStatus.total += 1;
        totalForStatus.people += el.peopleQty ? el.peopleQty : 0;
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
        : moment().format("yyyy-MM-dd");
      const startDate = moment(date, "YYYY/MM/DD").startOf("day").utc(true);
      const endDate = moment(date, "YYYY/MM/DD").utc(true).endOf("day");
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
    /** Obtenemos el dia */
    let day = moment(date).format("dddd");
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

  private static parseTimeToMinutes(time: string): number {
    const timeSplit = time.split(":");
    return parseInt(timeSplit[0]) * 60 + parseInt(timeSplit[1]);
  }
  private static parseMinutesToTime(time: number): string {
    let hora = time / 60;
    const min = time % 60;
    hora = Math.floor(hora);
    return `${hora}:${min % 10 > 0 ? min : min + "0"}`;
  }
}

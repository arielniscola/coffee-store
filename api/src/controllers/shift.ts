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
      const companyCode = res.locals.companyCode;
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
      const shiftUpdate: IShift = req.body;
      /** Verificar si existe */
      const exist = await shiftService.findOne({
        _id: shiftUpdate._id,
      });
      if (!exist) throw new Error("Turno no encontrado");
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
        debt: 0,
        toConfirm: 0,
        cancelled: 0,
        total: 0,
        clients: 0,
      };
      let countClients: string[] = [];
      for (const el of data) {
        if (el.status === "paid") totalForStatus.paid += 1;
        if (el.status === "confirmed") totalForStatus.confirmed += 1;
        if (el.status === "debt") totalForStatus.debt += 1;
        if (el.status === "toConfirm") totalForStatus.toConfirm += 1;
        if (el.status === "cancelled") totalForStatus.cancelled += 1;
        totalForStatus.total += 1;
        if (!countClients.includes(el.client as string))
          countClients.push(el.client as string);
      }
      totalForStatus.clients = countClients.length;
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
      /** Obtenemos los turnos creados de la fecha */
      const shifts = await shiftService.find(filter);

      /** Obtenemos datos de inicio, duracion, final de dia */
      const initialTimeConfig = (
        await configService.findOne({ code: "timeStartDay" })
      ).value as string;
      const endTimeConfig = (
        await configService.findOne({ code: "timeEndDay" })
      ).value as string;
      const durationConfig = (
        await configService.findOne({
          code: "durationShift",
        })
      ).value as string;

      /** Obtenemos las mesas disponibles */
      const tables = await tableService.find({
        companyCode: companyCode,
        unitBusiness: req.query.unitBusiness,
      });

      /** Algoritmo para obtener turnos restantes disponibles */
      let countTime = 0;
      let reservationsAvailables: { table: number; initialTime: string }[] = [];
      const endTime = this.parseTimeToMinutes(endTimeConfig);
      const initialTime = this.parseTimeToMinutes(initialTimeConfig);
      countTime = initialTime;
      while (endTime > countTime) {
        for (const tab of tables) {
          let existReserv = shifts.find(
            (reserv) =>
              this.parseTimeToMinutes(reserv.timeStart) == countTime &&
              reserv.tableNumber == tab.number
          );
          if (!existReserv)
            reservationsAvailables.push({
              table: tab.number,
              initialTime: this.parseMinutesToTime(countTime),
            });
        }
        countTime += parseInt(durationConfig);
      }

      return res.status(200).json({ ack: 0, data: reservationsAvailables });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  private static parseTimeToMinutes(time: string): number {
    const timeSplit = time.split(":");
    return parseInt(timeSplit[0]) * 60 + parseInt(timeSplit[1]);
  }
  private static parseMinutesToTime(time: number): string {
    const hora = time / 60;
    const min = time % 60;

    return `${hora}:${min % 10 > 0 ? min : min + "0"}`;
  }
}

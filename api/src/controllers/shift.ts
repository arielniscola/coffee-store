import moment from "moment";
import Log from "../libs/logger";
import { IShift } from "../models/shift";
import { IRouteController } from "../routes/index";
import { shiftService } from "../services/shift";

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
        .endOf("day")
        .add(7, "days");
      const filter = {
        ...{ companyCode: companyCode },
        ...(req.query.unitBusiness
          ? { unitBusiness: req.query.unitBusiness }
          : {}),
        ...(req.query.date
          ? { date: { $gte: startDate.toDate(), $lte: endDate.toDate() } }
          : {}),
      };
      const data: IShift[] = await shiftService.find(
        filter,
        {},
        { populate: "client" }
      );

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
}

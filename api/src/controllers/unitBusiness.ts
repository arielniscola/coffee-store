import Log from "../libs/logger";
import { IRouteController } from "../routes/index";

import { IUnitBusiness } from "../models/unitBusiness";
import { unitBusinessService } from "../services/unitBusiness";

export class UnitBusinessController {
  static find: IRouteController<{}, {}, {}, { active: string }> = async (
    req,
    res
  ) => {
    const logger = new Log(res.locals.requestId, "UnitBusinessController.find");
    try {
      const companyCode = res.locals.companyCode;
      const active = req.query.active == "true";
      const filter = {
        ...{ companyCode: companyCode },
        ...(active ? { active: req.query.active } : {}),
      };
      const data: IUnitBusiness[] = await unitBusinessService.find(filter, {});

      return res.status(200).json({ ack: 0, data: data });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static create: IRouteController = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "UnitBusinessController.create"
    );
    try {
      const companyCode = res.locals.companyCode;
      const unitBusiness: IUnitBusiness = req.body;
      delete unitBusiness._id;
      unitBusiness.companyCode = companyCode;
      /** Verificar que codigo no exista dentro de la misma compañia */
      const exist = await unitBusinessService.findOne({
        code: unitBusiness.code,
        companyCode: companyCode,
      });
      /** Si existe arrojar error */
      if (exist) throw new Error("Codigo de unidad de negocio ya existe");
      const created = await unitBusinessService.insertOne(unitBusiness);
      if (!created) throw new Error("No se creo la unidad de negocio");
      return res.status(200).json({
        ack: 0,
        message: "Se creo la unidad de negocio correctamente",
      });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static update: IRouteController = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "UnitBusinessController.update"
    );
    try {
      const unitBusiness: IUnitBusiness = req.body;
      /** Verificar si existe */
      const exist = await unitBusinessService.findOne({
        _id: unitBusiness._id,
      });
      if (!exist) throw new Error("Unidad de negocio no encontrada");
      const unitUpdated = await unitBusinessService.updateOne(
        { _id: unitBusiness._id },
        unitBusiness
      );
      if (!unitUpdated) throw new Error("Unidad de negocio no se actualizo");
      return res
        .status(200)
        .json({ ack: 0, message: "Unidad de negocio actualizada" });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static delete: IRouteController = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "UnitBusinessController.delete"
    );
    try {
      const id = req.params.id;
      const deleted = await unitBusinessService.deleteOne({
        _id: id,
      });
      if (!deleted) throw new Error("Unidad de negocio no eliminada");
      return res
        .status(200)
        .json({ ack: 0, message: "Unidad de negocio eliminada correctamente" });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };
}

import Log from "../libs/logger";
import { ICompany } from "../models/company";
import { IRouteController } from "../routes/index";
import { companyService } from "../services/company";

export class CompanyController {
  static find: IRouteController<{}, {}, {}, { code: string; active: boolean }> =
    async (req, res) => {
      const logger = new Log(res.locals.requestId, "CompanyController.find");
      try {
        const companyCode = res.locals.companyCode;
        const filter = {
          ...{ code: companyCode },
          ...(req.query.code ? { code: req.query.code } : {}),
          ...(req.query.code ? { active: true } : {}),
        };
        const data = await companyService.find(filter);
        return res.status(200).json({ ack: 0, data: data[0] });
      } catch (e) {
        logger.error(e);
        return res.status(400).json({ ack: 1, message: e.message });
      }
    };

  static create: IRouteController = async (req, res) => {
    const logger = new Log(res.locals.requestId, "CompanyController.create");
    try {
      const company: ICompany = req.body;
      /** Verificar que no exista compañia con mismo codigo */
      const exist = await companyService.findOne({ code: company.code });
      if (exist)
        throw new Error(
          `Ya existe una compañia registrada con el codigo ${company.code}`
        );
      const created = await companyService.insertOne(company);

      if (!created) throw "Compañia no fue creada";
      return res
        .status(200)
        .json({ ack: 0, message: "Compañia creada correctamente" });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 0, message: e.message });
    }
  };
  static update: IRouteController = async (req, res) => {
    const logger = new Log(res.locals.requestId, "CompanyController.update");
    try {
      const companyCode = res.locals.companyCode;
      const companyUpdate: ICompany = req.body;
      /** Verificar si existe */
      const exist = await companyService.findOne({
        code: companyCode,
      });
      if (!exist) throw new Error("Compañia no encontrada");
      const response = await companyService.updateOne(
        { code: exist.code },
        { ...companyUpdate }
      );
      if (!response) throw new Error("Compañia no se actualizo");
      return res.status(200).json({ ack: 0, message: "Compañia actualizada" });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };
}

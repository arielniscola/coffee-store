import Log from "../libs/logger";
import { IRouteController } from "../routes/index";
import { IConfig } from "../models/config";
import configService from "../services/config";

export class ConfigController {
  static find: IRouteController<{}, {}, {}, {}> = async (req, res) => {
    const logger = new Log(res.locals.requestId, "ShiftController.find");
    try {
      const companyCode = res.locals.companyCode;
      const data: IConfig[] = await configService.find({
        ...{ companyCode: companyCode },
      });
      return res.status(200).json({ ack: 0, data: data });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static update: IRouteController = async (req, res) => {
    const logger = new Log(res.locals.requestId, "ConfigController.update");
    try {
      const configUpdate: IConfig = req.body;
      /** Verificar si existe */
      const exist = await configService.findOne({
        code: configUpdate.code,
        companyCode: configUpdate.companyCode,
      });
      if (exist.type == "number") {
        configUpdate.value = parseInt(configUpdate.value as string);
      }
      if (!exist) throw new Error("Config no encontrado");
      const response = await configService.updateOne(
        { code: exist.code, companyCode: exist.companyCode },
        { ...configUpdate }
      );
      if (!response) throw new Error("Config no se actualizo");
      return res.status(200).json({ ack: 0, message: "Config actualizada" });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };
}

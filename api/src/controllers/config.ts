import Log from "../libs/logger";
import { IRouteController } from "../routes/index";
import { IConfig } from "../models/config";
import configService from "../services/config";
import accessTokenService from "../services/accessToken";
import { validateScheduleString } from "../services/scheduleException";

/**
 * Configs que el front público (landing, modal de reserva, resultado de pago)
 * necesita leer sin estar autenticado. El endpoint es `auth: false`, así que
 * TODO lo que no esté en esta lista queda fuera del alcance de un visitante:
 * el resto incluye credenciales (mpAccessToken, smtpPass) y parámetros
 * internos que no tienen por qué ser públicos.
 *
 * Al sumar un config nuevo que la landing tenga que mostrar, agregalo acá.
 */
const PUBLIC_CONFIG_CODES = [
  "priceAdult",
  "priceChild",
  "reservationMaxDays",
  "whatsappNumber",
  "scheduleText",
  "scheduleSubtitle",
  "policiesText",
];

export class ConfigController {
  /**
   * Autenticación opcional. La ruta está declarada `auth: false` (la landing
   * tiene que poder leer precios sin login), así que validateToken NO corre y
   * res.locals.companyCode viene siempre vacío. Para poder distinguir al admin
   * del visitante validamos el token acá si viene, sin exigirlo.
   */
  private static async resolveSession(
    req: any
  ): Promise<{ companyCode: string } | null> {
    try {
      const authHeader = req.headers?.["authorization"];
      const token = authHeader && String(authHeader).split(" ")[1];
      if (!token) return null;
      const payload = await accessTokenService.validateToken(token);
      if (!payload?.companyCode) return null;
      return { companyCode: payload.companyCode };
    } catch (e) {
      return null;
    }
  }

  static find: IRouteController<{}, {}, {}, {}> = async (req, res) => {
    const logger = new Log(res.locals.requestId, "ShiftController.find");
    try {
      // Sin sesión válida la request es pública: solo ve la whitelist.
      const session = await this.resolveSession(req);
      const isPublic = !session;
      const companyCode =
        session?.companyCode || res.locals.companyCode || "wichiwi";
      const data: IConfig[] = await configService.find({
        companyCode,
        ...(isPublic ? { code: { $in: PUBLIC_CONFIG_CODES } } : {}),
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
      /** Validar formato de los horarios semanales antes de guardar */
      if (configUpdate.code?.startsWith("scheduleDay")) {
        const scheduleError = validateScheduleString(configUpdate.value);
        if (scheduleError) throw new Error(scheduleError);
      }
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

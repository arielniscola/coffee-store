/**
 * Middleware para marcar la ruta como API
 */
import moment from "moment";
import { DEFAULT_LOG_LEVEL } from "../constants/defaults";
import Log from "../libs/logger";
import { resDotJsonInterceptor } from "../libs/server";
import { IRouteController } from "../routes/index";
import configCoreService from "../services/config";

export const requestTrace: IRouteController = (req, res, next) => {
  // Si hay x-request-id en el header, usarlo, sino generar uno
  res.locals.requestId =
    req.get("x-request-id") ||
    Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
  res.locals.authResponseDateStart = new Date().getTime();
  (async () => {
    // Por el momento, loggear solo cuando sea una ruta API
    if (!res.locals.isApiRoute) return;
    const LoggerCore = new Log("requestTrace", res.locals.requestId);
    const logLevel = (await configCoreService.getValue(
      "appLogLevel"
    )) as number;
    if (logLevel != DEFAULT_LOG_LEVEL.BAJO) {
      /** Log de Request */
      LoggerCore.info(
        `authResponseDateStart: ${moment().format("YYYY-MM-DD HH:mm:ss.SSS")}`
      );
      LoggerCore.info(`<------------ New Request ${req.url} ----------->`);
      LoggerCore.info(`request.body -->> ${JSON.stringify(req.body)}`);

      /**
       * Log de Response:
       * Implementar interceptor
       * */
      res.json = resDotJsonInterceptor(res, res.json);
      /** Esperar cierre de respuesta */
      res.once("close", async () => {
        const response = res.locals.response;
        LoggerCore.info(`response.body -->> ${JSON.stringify(response)}`);
      });
    }
  })();
  next();
};

export default requestTrace;

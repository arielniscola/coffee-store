import { IConfig } from "../models/config";

/**
 * Configuraciones por defecto a crear para una compania
 */
export const DEFAULT_GLOBAL_SETTINGS: IConfig[] = [
  {
    type: "cron",
    code: "dailyBalanceSales",
    name: "Multi-compañía: SYSTEM CRON: calculo balance diario de ventas",
    value: "0 3 * * *",
    dataType: "string",
    companyCode: "admin",
  },
];

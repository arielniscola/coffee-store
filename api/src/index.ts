import { DB } from "./libs/db";
import Log from "./libs/logger";
import processManager from "./libs/processManager";
import AppServer from "./libs/server";
import { IRoutes } from "./routes/index";
import { AlertConfig } from "./services/alertConfig";

export interface IShiftManagementOptions {
  /**
   * Parametros de configuracion del servidor
   */
  server: {
    port: number;
    secret: string;
    ssl?: boolean;
  };
  /**
   * Parametros de configuracion de la BD
   */
  db: {
    /**
     * URI de conexion
     */
    uri: string;
  };
  /**
   * Scripts a ejecutar en el arranque
   * @defaultValue []
   */
  bootstrapScripts: Function[];
  routes: IRoutes;
  /**
   * Path de los procesos
   */
  processesPath?: string;
  /**
   * Version a mostrar en consola
   */
  version?: string;
  /**
   * Configuracion de Logs
   */
  logs?: {
    /**
     * Path de los logs
     */
    path?: string;
    /**
     * Prefijo para los logs
     */
    prefix?: string;
    /**
     * Frecuencia de logeo
     * @defaultValue 15m
     */
    frequency?: string;
  };
  /**
   * Alertas
   */
  alerts?: AlertConfig[];
}

const defaultOptions: IShiftManagementOptions = {
  server: {
    port: 3000,
    secret: "secret",
  },
  db: {
    uri: "mongodb://localhost:27017/coffeeshop",
  },
  bootstrapScripts: [],
  routes: [],
  version: "",
  logs: {
    path: "./log",
    prefix: "coffeeshop",
    frequency: "15m",
  },
  alerts: [],
};

/**
 * Shift Management
 * @version 1.0.0
 * @author Ariel Niscola
 * @description Clase que inicializa servidor
 */

export class Coffeshop {
  /** Opciones de ininializacion */
  private static _options: IShiftManagementOptions;
  /** Flag para verificar si ha sido inicializada */
  private _initialized: boolean = false;

  constructor(options?: Partial<IShiftManagementOptions>) {
    this.setOptions(options);
  }

  private setOptions(
    options: Partial<IShiftManagementOptions> = defaultOptions
  ) {
    Coffeshop._options = {
      ...defaultOptions,
      ...options,
    };
  }

  /**
   * Iniciar aplicacion
   */

  async init() {
    const log = new Log("Coffeshop.init()");
    try {
      /** Checkear que servidor no este inicializado */
      if (this._initialized) {
        throw new Error("Servidor ya inicializado");
      }
      log.info("Iniciando servicios api");

      const options = Coffeshop._options;

      /** Conexion a la BD */
      await DB.connect(options.db.uri);

      /**
       * TODO:
       *  Upgrade scripts
       *  Bootstrap
       *  Menu build
       */

      /**
       * Leemos los procesos disponibles
       */
      processManager.loadProcesses(options.processesPath);

      /** Creamos el cliente AppServer */
      await AppServer.start(options.server.port, {
        routes: options.routes,
      });
      /** Marcamos al Servidor como inicializado */
      this._initialized = true;
      log.info(`Servidor inicializado: ${this._initialized}`);
    } catch (err) {
      log.error(err, `Error al iniciar servidor: ${err.message}`);
      throw err;
    }
  }
  /**
   * Obtiene configuracion
   * @param code Codigo de configuracion
   * @returns Valor de configuracion
   * @example
   * const port = Coffeshop.get('server.port')
   */
  static get(code: string): any {
    const value = code
      .split(".")
      .reduce((o: any, i) => o[i], Coffeshop._options);
    return value;
  }
}
export const defineOptions = (data: IShiftManagementOptions) => data;
export default Coffeshop;

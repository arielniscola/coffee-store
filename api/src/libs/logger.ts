import moment from "moment";
import {
  createLogger,
  format,
  Logger,
  LoggerOptions,
  transports,
} from "winston";

interface LogOptions {
  /** Loggear stack de error */
  logErrorStack?: boolean;
}

/** Opciones por defecto */
const DEFAULT_OPTIONS: LogOptions = {
  logErrorStack: false, // No loggear stack por defecto. Solo en caso de que se especifique
};

export class Log {
  private static _logger: Logger;
  private _service: string;
  private _requestId: string;
  private _prefix: string;
  private _options: LogOptions;
  private static _files: string[] = [];

  /**
   * Crear una instancia de Log
   * @param service Servicio que lo invoca
   * @param requestId Id de la peticion (opcional)
   * @param options Opciones de configuracion (opcional)
   */
  constructor(service: string, requestId?: string, options?: LogOptions) {
    this._service = service;
    this._requestId = requestId;
    this._options = options || DEFAULT_OPTIONS;
    this._prefix = `${requestId ? `[${requestId}] ` : ""}${service} =>`;
  }
  /**
   * Instancia del Logger
   */
  private static get logger(): Logger {
    if (!Log._logger) {
      Log._logger = this.create();
    }
    return Log._logger;
  }
  /**
   * Opciones de configuracion
   */
  get options(): LogOptions {
    return this._options;
  }

  /**
   * Crear instancia del Logger
   */
  private static create() {
    /**
     * Opciones de Transporte de logger: Consola
     */
    const TRANSPORT_CONSOLE = new transports.Console({
      level: "debug",
      handleExceptions: true,
    });

    /**
     * Flags para marcar cuando se crearon los primeros archivos
     */
    let firstInfoFileCreated = false;
    let firstErrorFileCreated = false;

    /**
     * Metodo para mover los archivos que quedaron sueltos
     * @param level Nivel de logs
     * @param newFilename Nombre del archivo a exceptuar
     */
    const options: LoggerOptions = {
      // Formato de salida del log
      format: format.combine(
        format.timestamp(),
        format.printf((i) => {
          // Formatear timestamp en hora local del servidor
          const timestamp = moment(i.timestamp).format("YYYY-MM-DD HH:mm:ss");
          return `${timestamp} | ${i.message}`;
        })
      ),
      // Medios y niveles de log
      transports: [TRANSPORT_CONSOLE],
      exitOnError: false, // No salir en caso de error
    };
    const logger = createLogger(options);
    return logger;
  }

  /**
   * Setter para el requestId
   * @param requestId Id de la peticion
   */
  set requestId(requestId: string) {
    this._requestId = requestId;
    this._prefix = `${requestId ? `[${requestId}] ` : ""}${this._service} =>`;
  }

  /**
   * Setter para el servicio
   * @param service Servicio que lo invoca
   */
  set service(service: string) {
    this._service = service;
    this._prefix = `${
      this._requestId ? `[${this._requestId}] ` : ""
    }${service} =>`;
  }

  /**
   * Loggear mensaje de advertencia (warn)
   * @param message Mensaje
   */
  warn(message: string) {
    Log.logger.warn(`${this._prefix} WARN: ${message}`);
  }

  /**
   * Loggear mensaje de depuración (debug)
   * @param message Mensaje
   */
  debug(message: string) {
    Log.logger.debug(`${this._prefix} DEBUG: ${message}`);
  }

  /**
   * Loggear mensaje genérico (log)
   * @param level Nivel del mensaje
   * @param message Mensaje
   */
  info(message: string) {
    Log.logger.info(`${this._prefix} ${message}`);
  }
  /**
   * Loggear mensaje de error
   * @param message Mensaje
   * @param error Error
   */
  error(error?: Error, message?: string) {
    Log.logger.error(`${this._prefix} ERROR: ${message || error.message}`);
    if (this.options.logErrorStack)
      Log.logger.error(`${this._prefix} ERROR STACK: ${error.stack}`);
  }
}

export default Log;

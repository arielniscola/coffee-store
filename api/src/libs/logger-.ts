/**
 * Clase para Loggear eventos
 * @class Log
 */
import "winston-daily-rotate-file";
import {
  createLogger,
  format,
  Logger,
  LoggerOptions,
  transports,
} from "winston";
import { ShifManagement } from "..";
import path from "path";
import fs from "fs";
import moment from "moment";
import { exec } from "child_process";
import { isMainThread } from "worker_threads";
// import { ALERT_INSUFFICIENT_DISK_SPACE } from "../constants/alerts";
// import alertCoreService from "../services/alert";
import { alertConfigService } from "../services/alertConfig";

interface LogOptions {
  /** Loggear stack de error */
  logErrorStack?: boolean;
}

/** Opciones por defecto */
const DEFAULT_OPTIONS: LogOptions = {
  logErrorStack: false, // No loggear stack por defecto. Solo en caso de que se especifique
};

/**
 * Formato de la lista:
 * {
 *  "YYYY": {
 *     "MM": {
 *          "DD": ["file1", "file2"]
 *      }
 * }
 */
export interface FolderList {
  [year: string]: {
    [month: string]: {
      [day: string]: string[];
    };
  };
}

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
   * Archivos de logs actuales
   */
  public static get files(): string[] {
    return this._files;
  }

  /**
   * Obtener archivo de log actual segun su nivel
   * @param level Nivel del log
   */
  public static getFile(level: string): string {
    return this._files.find((file) => file.includes(level));
  }

  /**
   * Reemplazar el archivo de log actual segun su nivel
   * @param level Nivel del log
   * @param file Archivo a reemplazar
   */
  public static setFile(level: string, file: string): void {
    const index = this._files.findIndex((f) => f.includes(level));
    if (index !== -1) {
      this._files[index] = file;
    } else {
      this._files.push(file);
    }
  }

  /**
   * Obtener listado de archivos desde el directorio de logs
   * @param startDate Fecha de inicio formato YYYY-MM-DD
   * @param endDate Fecha de fin formato YYYY-MM-DD
   * @returns Listado de archivos
   */
  public static async getFiles(
    startDate: string,
    endDate: string
  ): Promise<FolderList> {
    // Obtener listado de carpetas a partir del rango de fechas
    const folderList = this.getFolderList(startDate, endDate);
    // Path de Logs
    const LOG_PATH = ShifManagement.get("logs.path") as string;
    // En base a las fechas proveidas, generar listado de carpetas que deberia leerse
    let folders: FolderList = {};
    for (const folderPath of folderList) {
      let files: string[] = [];
      // Si la carpeta existe, leerla y obtener listado de archivos
      if (fs.existsSync(path.join(LOG_PATH, folderPath))) {
        files = await fs.promises.readdir(path.join(LOG_PATH, folderPath));
        // Quitarle el .log a los archivos
        files = files.map((file) => file.replace(".log", ""));
      }
      // Si recibimos la fecha de hoy, vamos a incorporar el archivo de log actual
      if (moment().format("YYYY/MM/DD") === folderPath) {
        // Obtener archivos actuales
        let currentFiles = this.files;
        // Cambiamos el nombre de los archivos para que coincidan con el formato que enviamos a la consola
        currentFiles = currentFiles.map((file) => {
          // Formato actual: LOGS_PATH\__PREFIX__LEVEL__DATE
          // Donde DATE = YYYYMMDDHHmm
          // Formato objetivo: HH_mm_LEVEL_PREFIX.log
          file = path.basename(file);
          const [_, prefix, level, date] = file.split("__");
          return `${date.substr(8, 2)}_${date.substr(
            10,
            2
          )}_${level}_${prefix}`;
        });
        // Si por alguna razon, el archivo que estamos por agregar ya se encuentra en files,
        // no duplicarlo
        currentFiles = currentFiles.filter((file) => !files.includes(file));
        // Agregar archivos actuales al listado de archivos
        files = files.concat(currentFiles);
      }
      // Si por alguna razon el files esta vacio a esta altura, continuar con la prox. iteracion
      if (!files || !files.length) continue;
      // Formar objeto que contenga el nombre de la carpeta y los archivos que contiene
      const [year, month, day] = folderPath.split("/");
      // Verificar que exista la carpeta del año
      if (!folders[year]) folders[year] = {};
      // Verificar que exista la carpeta del mes
      if (!folders[year][month]) folders[year][month] = {};
      // Agregar el dia
      folders[year][month][day] = files;
    }
    return folders;
  }

  /**
   * Obtener listado de fechas a partir de un rango de fechas
   * @param startDate Fecha de inicio formato YYYY-MM-DD
   * @param endDate Fecha de fin formato YYYY-MM-DD
   * @returns Listado de fechas
   */
  private static getFolderList(startDate: string, endDate: string): string[] {
    const parsedStartDate = moment(startDate, "YYYY-MM-DD");
    const parsedEndDate = moment(endDate, "YYYY-MM-DD");
    let processedDate = parsedStartDate;
    // Por cada fecha desde el inicio al fin, vamos a generar la estructura:
    // YYYY/MM/DD
    let folderList = [];
    while (
      processedDate.isBefore(parsedEndDate) ||
      processedDate.isSame(parsedEndDate)
    ) {
      // Procesar fecha
      const formatedDate = processedDate.format("YYYY/MM/DD");
      // Agregar a lista de carpetas a leer
      folderList.push(formatedDate);
      // Agregar un dia a la fecha procesada
      processedDate.add(1, "day");
    }
    return folderList;
  }

  /**
   * Obtener listado de todas las carpetas y subcarpetas dentro de logs
   * @param folders array donde vamos a agregar la lista
   * @param path Path donde vamos a obtener ese listado
   * @returns Listado carpetas y subcarpetas
   */
  public static async getAllFoldersInLogsDirectory(
    path: string,
    folders: string[]
  ): Promise<string[]> {
    try {
      /** Leemos directorio de logs */
      const files = await fs.promises.readdir(path);
      /** Recorremos archivos y carpetas */
      for (const file of files) {
        const filePath = `${path}/${file}`;
        /** Obtenemos atributos sobre el path actual */
        const stat = await fs.promises.stat(filePath);
        /** Verificamos si es carpeta y si es llamamos recursivamente a la funcion para leer subcarpetas */
        if (stat.isDirectory()) {
          folders.push(filePath);
          await this.getAllFoldersInLogsDirectory(filePath, folders);
        }
      }
      return folders;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener path de archivo de log
   * @param filePath Path absoluto o relativo del archivo
   * @returns Path absoluto del archivo
   */
  public static getFilePath(filePath: string): string {
    // Verificar si existe el path absoluto
    if (fs.existsSync(filePath)) {
      // Si existe el absoluto, retornarlo
      return filePath;
    }
    // Path de Logs
    const LOG_PATH = ShifManagement.get("logs.path") as string;
    // Si no, tanteamos con el relativo y el LOG_PATH
    filePath = path.join(LOG_PATH, `${filePath}.log`);
    // Verificar si existe
    if (!fs.existsSync(filePath)) {
      // Vamos a comprobar si el archivo no se encuentra en el path base
      // de los logs, por lo que vamos a intentar buscarlo en la carpeta
      // de logs del dia actual
      const today = moment().format("YYYYMMDD");
      // Formar el path posible del archivo extrayendo la ruta base
      // y el nombre del archivo
      let file = path.basename(filePath);
      // Extraemos la hora, minutos y nivel del archivo de formato: HH_mm_level
      const [hour, minute, level] = file.split("_");
      // Formamos el nombre del archivo en formato: __LEVEL__DATE
      file = `__${level}__${today}${hour}${minute}`;
      // Fijarse si esta en los archivos actuales
      file = this.files.find((f) => f.match(new RegExp(file)));
      // Si existe, retornarlo
      if (file) return file;
      // Si no existe, retornar error
      throw new Error(`El archivo de log no existe: ${filePath}`);
    }
    return filePath;
  }

  /**
   * Buscar cadena de texto dentro de los archivos de logs
   * en un rango de fechas especificado
   * @param startDate Fecha de inicio formato YYYY-MM-DD
   * @param endDate Fecha de fin formato YYYY-MM-DD
   * @param text Texto a buscar
   */
  public static async search(
    startDate: string,
    endDate: string,
    text: string
  ): Promise<any> {
    // Obtener listado de carpetas a partir del rango de fechas
    const folderList = this.getFolderList(startDate, endDate);
    // Path de Logs
    let LOG_PATH = ShifManagement.get("logs.path") as string;
    // En base a las fechas proveidas, generar listado de carpetas que deberia leerse
    let pathsToSearch: string[] = [];
    for (const folderPath of folderList) {
      // Si la carpeta no existe, descartarla.
      const absoluteFolderPath = path.join(LOG_PATH, folderPath);
      if (!fs.existsSync(absoluteFolderPath)) {
        continue;
      }
      // Si existe agregar a la cadena de carpetas a seleccionar para la busqueda
      pathsToSearch.push(absoluteFolderPath);
    }
    // Ejecutar comando grep para buscar en las carpetas seleccionadas
    // la cadena de texto proveida
    // comando -n para obtener numeros de lineas
    // comando -r para buscar recursivamente
    // comando -e para buscar texto de manera regex
    // comando -i para ignorar mayusculas y minusculas
    // usar head para obtener los primeros 100 resultados
    const grepCommand = `grep -r -n -i -e "${text}" ${pathsToSearch.join(
      " "
    )} | head -100`;
    // Ejecutar comando
    const grepResult = await this.exec(grepCommand);
    // Formatear resultado:
    let results: any = [];
    // Primero separamos por saltos de linea
    let lines = grepResult.split("\n");
    // Quitar el . del LOG_PATH si existe
    LOG_PATH = LOG_PATH.replace(".", "");
    for (const line of lines) {
      // Borrar los \r si hay
      line.replace("\r", "");
      // Si la linea esta vacia, ignorar
      if (line === "") continue;
      // Separamos por :
      const [filePath, lineNumber] = line.split(":");
      // La linea de texto es el resto de la cadena
      const lineText = line.replace(`${filePath}:${lineNumber}:`, "");
      // Extraemos la fecha y hora del texto
      const [date, text] = lineText.split(" | ");
      // Quitamos el LOG_PATH del path del archivo
      // y reemplazamos las barras invertidas por barras normales
      const file = filePath.replace(/\\/g, "/");
      // Agregamos el resultado
      results.push({
        file,
        line: parseInt(lineNumber),
        date: moment(date).format("YYYY/MM/DD HH:mm:ss"),
        text,
      });
    }
    return results;
  }

  /**
   * Ejecutar comando
   * @param command Comando a ejecutar
   * @returns Resultado de comando
   */
  private static async exec(command: string): Promise<any> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          resolve(stderr);
        }
        resolve(stdout);
      });
    });
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
     * Path de Logs
     */
    const LOG_PATH = ShifManagement.get("logs.path") as string;

    /**
     * Frecuencia de Logs
     */
    const LOG_FREQUENCY = ShifManagement.get("logs.frequency") as string;

    /**
     * Prefijo de Logs
     */
    const LOG_PREFIX = ShifManagement.get("logs.prefix") as string;

    /**
     * Opciones de Transporte de logger: Archivo de .info
     */
    const TRANSPORT_FILE_INFO = new transports.DailyRotateFile({
      frequency: LOG_FREQUENCY,
      filename: path.join(LOG_PATH, `__${LOG_PREFIX}__info__%DATE%`),
      extension: ".log",
      level: "info",
      handleExceptions: true,
      json: true,
      datePattern: "YYYYMMDDHHmm",
    });

    /**
     * Opciones de Transporte de logger: Archivo de .error
     */
    const TRANSPORT_FILE_ERROR = new transports.DailyRotateFile({
      frequency: LOG_FREQUENCY,
      filename: path.join(LOG_PATH, `__${LOG_PREFIX}__error__%DATE%`),
      extension: ".log",
      level: "error",
      handleExceptions: true,
      json: true,
      datePattern: "YYYYMMDDHHmm",
    });

    /**
     * Funcion para mover el archivo de log
     * a la carpeta correspondiente,
     * con el formato YYYY/MM/DD/HH_mm_level_nodo
     * @param oldPath Path del archivo
     * @param newPath Path de destino
     */
    const moveFile = (
      oldFilename: string,
      newFilename: string,
      isLost?: boolean
    ) => {
      try {
        // Extraer datos del oldFilename
        const oldFilenameParts = oldFilename.split("__");
        // Prefijo
        const prefix = oldFilenameParts[1];
        // Nivel
        const level = oldFilenameParts[2];
        // Por alguna razon, la funcion para mover el archivo
        // solo se invoca para el nivel "info" desde el evento del winston,
        // por lo que, vamos a tener que invocar manualmente para mover el nivel "error"
        // Solo hacerlo en caso de que no venga de los "perdidos"
        if (level == "info" && !isLost) {
          const errorFilename = oldFilename.replace("info", "error");
          // Verificar si el archivo existe antes de moverlo
          if (fs.existsSync(errorFilename)) {
            moveFile(errorFilename, errorFilename);
          }
        }
        // Fecha
        const date = moment(oldFilenameParts[3].split(".")[0], "YYYYMMDDHHmm");
        const year = String(date.year());
        const month = String(date.month() + 1).padStart(2, "0"); // Padear con 0s el mes
        const day = String(date.date()).padStart(2, "0"); // Padear con 0s el dia
        const hour = String(date.hour()).padStart(2, "0"); // Padear con 0s la hora
        const minute = String(date.minute()).padStart(2, "0"); // Padear con 0s el minuto
        // Path al que se movera el archivo
        const newFolderPath = path.join(LOG_PATH, year, month, day);
        // Si no existe el path, crearlo
        if (!fs.existsSync(newFolderPath)) {
          fs.mkdirSync(newFolderPath, { recursive: true });
        }
        // Nombre del archivo nuevo
        newFilename = path.join(
          newFolderPath,
          `${hour}_${minute}_${level}_${prefix}.log`
        );
        // Si el archivo de destino ya existe, entonces debemos concatenar el contenido de este
        // con el archivo de destino
        if (fs.existsSync(newFilename)) {
          console.log(
            `El archivo de logs ${newFilename} ya existe, concatenando contenido...`
          );
          // Leer el contenido del archivo de destino
          const newFilenameContent = fs.readFileSync(newFilename, "utf8");
          // Leer el contenido del archivo a mover
          const oldFilenameContent = fs.readFileSync(oldFilename, "utf8");
          // Concatenar el contenido del archivo a mover con el archivo de destino
          const newContent = newFilenameContent + oldFilenameContent;
          // Escribir el contenido concatenado en el archivo de destino
          fs.writeFileSync(newFilename, newContent);
          // Eliminar el archivo a mover
          fs.unlinkSync(oldFilename);
          // Terminar
          return;
        }
        // Mover archivo a la carpeta correspondiente
        fs.rename(oldFilename, newFilename, (err) => {
          if (err) throw err;
          console.log(`Logs movidos de ${oldFilename} a ${newFilename}`);
        });
      } catch (error) {
        console.log(
          `Error al mover el archivo de logs ${oldFilename} a ${newFilename}: ${error.message}`
        );
      }
    };

    /**
     * Cuando se termine de logear un archivo, moverlo a su carpeta
     */
    TRANSPORT_FILE_INFO.on("rotate", moveFile);

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
    const moveLooseFiles = (level: string, newFilename: string) => {
      try {
        // Quitar el path del nombre del archivo
        newFilename = path.basename(newFilename);
        // Leer archivos de la carpeta raiz de logs (ignorar directorios)
        fs.readdir(LOG_PATH, (err, files) => {
          if (err) throw err;
          // Filtrar directorios, el archivo actual y el nivel del archivo actual
          files = files.filter(
            (file) => file != newFilename && file.includes(level)
          );
          // Si no hay archivos para mover, salir
          if (files.length == 0) {
            return;
          }
          console.log(
            `Moviendo archivos de logs sueltos de nivel ${level} (excepto ${newFilename})`
          );
          // Recorrer los archivos
          files.forEach((file) => {
            console.log(`Moviendo archivo extraviado ${file}`);
            const filePath = path.join(LOG_PATH, file);
            moveFile(filePath, filePath, true);
          });
        });
      } catch (error) {
        console.log(`Error al mover los archivos sueltos: ${error.message}`);
      }
    };

    /**
     * Metodo para ejecutar al crear un nuevo archivo
     */
    const onNewFile = (newFilename: string) => {
      try {
        console.log(`Nuevo archivo de logs creado: ${newFilename}`);
        // Extraer datos del newFilename
        const newFilenameParts = newFilename.split("__");
        // Nivel
        const level = newFilenameParts[2];
        // Marcar el archivo como el actual
        Log.setFile(level, newFilename);
        // Marcar que se creo el primer archivo
        if (!firstInfoFileCreated || !firstErrorFileCreated) {
          // Marcar que ya se creo el primer archivo segun el nivel
          if (level == "info") {
            firstInfoFileCreated = true;
          } else if (level == "error") {
            firstErrorFileCreated = true;
          }
          // Mover los archivos de info que quedaron sueltos
          moveLooseFiles(level, newFilename);
        }
      } catch (error) {
        console.log(`Error al crear archivo ${newFilename}: ${error.message}`);
      }
    };

    /**
     * Cuando se cree un nuevo archivo, guardamos el nombre
     */
    TRANSPORT_FILE_INFO.on("new", onNewFile);

    TRANSPORT_FILE_ERROR.on("new", onNewFile);

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
      transports: [
        TRANSPORT_CONSOLE,
        TRANSPORT_FILE_INFO,
        TRANSPORT_FILE_ERROR,
      ],
      exitOnError: false, // No salir en caso de error
    };
    const logger = createLogger(options);
    let alertAlreadySent = false;
    let alertOnTheWay = false;

    process.on(
      "uncaughtException",
      async (error: Error & { code?: string }) => {
        console.log("*".repeat(20));
        console.log(`ERROR NO MANEJADO: ${error.message}`);
        if (!isMainThread) return; // solo el main thread puede enviar alertas
        // Catchear codigos de errores relacionados a escritura en disco
        if (error.code && ["ENOSPC"].includes(error.code)) {
          // Si el error es 'ENOSPC', significa que no hay mas espacio en disco
          console.log(
            `Espacio en disco insuficiente. Verifique la carpeta de logs: ${LOG_PATH}`
          );
          // Crear alerta de espacio en disco
          // if (!alertAlreadySent && !alertOnTheWay) {
          //     try {
          //         alertOnTheWay = true // estamos enviando
          //         const info = `Espacio en disco insuficiente en el nodo ${LOG_PREFIX}. Verifique la carpeta de logs: ${LOG_PATH}`
          //         const companyCode = "napse"
          //         const channelCode = "napse.default"
          //         let alertConfig = await alertConfigCoreService.findOne({ companyCode, code: ALERT_INSUFFICIENT_DISK_SPACE.code })
          //         if(!alertConfig) alertConfig = ALERT_INSUFFICIENT_DISK_SPACE
          //         await alertCoreService.insertOne({
          //             type: ALERT_INSUFFICIENT_DISK_SPACE.code,
          //             info,
          //             originator: ALERT_INSUFFICIENT_DISK_SPACE.name,
          //             addresses: alertConfig.value,
          //             done: false,
          //             companyCode,
          //             channelCode
          //         })
          //         alertAlreadySent = true;
          //         console.log(`Alerta de falta espacio en disco creada.`)
          //     } catch (error) {
          //         console.log(`Error al crear alerta de espacio en disco: ${error.message}`)
          //     } finally {
          //         alertOnTheWay = false // ya no estamos enviando
          //     }
          // }
        }
        console.log("*".repeat(20));
        //throw error;
      }
    );
    return logger;
  }

  /**
   * Loggear mensaje de info
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
  error(error: Error, message?: string) {
    Log.logger.error(`${this._prefix} ERROR: ${message || error.message}`);
    if (this.options.logErrorStack)
      Log.logger.error(`${this._prefix} ERROR STACK: ${error.stack}`);
  }

  /**
   * Opciones de configuracion
   */
  get options(): LogOptions {
    return this._options;
  }

  /**
   * Servicio que lo invoca
   */
  get service(): string {
    return this._service;
  }

  /**
   * Id de la peticion
   */
  get requestId(): string {
    return this._requestId;
  }
}

export default Log;

import EventEmitter from "events";
import Log from "./logger";
import cron from "node-cron";
import configService from "../services/config";
import processStatusService from "../services/processStatus";

export type IProcessStatus =
  | "loaded"
  | "ready"
  | "running"
  | "stopped"
  | "error";

const log = new Log("Process");

interface IProcessInfo {
  /** Codigo del proceso */
  code: string;
  /** Nombre del proceso */
  name: string;
  /** Descripcion */
  description: string;
  /** Variable de tiempo de cron */
  cronVar: string;
}

export class Process extends EventEmitter {
  private _info: IProcessInfo;
  private _process: Function;
  private _task: cron.ScheduledTask;
  private _cronTime: string;
  /** Estado del proceso */
  private _status: IProcessStatus;
  /** Tiempo Ultima ejecucion */
  private _lastRun?: Date;
  /** Salida de Ultima ejecucion */
  private _lastOutput?: string;
  /** Tiempo Ultimo Error */
  private _lastError?: Date;
  /** Salida de Ultimo error */
  private _lastErrorOutput?: string;

  /**
   * Definir un nuevo proceso
   * @param info Informacion del proceso
   * @param process Funcion a ejecutar
   */
  constructor(info: IProcessInfo, process: Function) {
    super();
    this._info = info;
    this._process = process;
    /** Estado inicial: loaded */
    this._status = "loaded";
  }
  /**
   * Obtener informacion del proceso
   */
  get info(): IProcessInfo {
    return this._info;
  }

  /**
   * Obtener estado del proceso
   */
  get status(): IProcessStatus {
    return this._status;
  }

  /**
   * Obtener datos de ultima corrida
   */
  get lastRun(): {
    date: Date;
    output: string;
    lastError: Date;
    lastErrorOutput: string;
  } {
    return {
      date: this._lastRun,
      output: this._lastOutput,
      lastError: this._lastError,
      lastErrorOutput: this._lastErrorOutput,
    };
  }

  /** Iniciar proceso */

  async start() {
    /** En caso de no tener cronTime, leerlo desde la variable */
    if (!this._cronTime) {
      const cronTime = await configService.findOne({
        code: this.info.cronVar,
      });
      if (!cronTime)
        throw new Error(
          `No se encontro la variable de cron ${this._info.cronVar}`
        );
      this._cronTime = cronTime.value as string;
    }
    /** Ejecutar tarea */
    log.info(
      `process.start() Iniciando proceso ${this._info.name} con cronTime ${this._cronTime}`
    );
    this._task = cron.schedule(this._cronTime, () => this.run());
    /** Cambiar estado a 'ready' */
    await this.changeStatus("ready");
  }
  /**
   * Cambiar estado de proceso
   * @param status Nuevo estado
   */
  async changeStatus(status: IProcessStatus) {
    const processUpdate = await processStatusService.updateOne(
      { code: this._info.code },
      { ...this._info, status }
    );
    this._status = status;
    /** Emitir evento de cambio de estado */
    this.emit("status-change", status);

    return processUpdate;
  }
  /**
   * Cambiar tiempo de cron
   * @param cronTime Nuevo tiempo de cron
   */
  changeCronTime(cronTime: string) {
    log.info(
      `process.changeCronTime() Cambiar tiempo de cron de ${this._info.name} a ${cronTime}`
    );
    this._cronTime = cronTime;
    this._task.stop();
    this.start();
  }
  /** Registrar ejecucion
   * @param notes Resultado de la ejecucion
   * @param error Error de la ejecucion?
   */
  async registerRun(notes: string, error?: boolean) {}
  /**
   * Ejecutar proceso
   * @param args Argumentos a pasar a la funcion
   */
  async run(args?: any): Promise<{ result: boolean; output: string }> {
    try {
      /** Ejecutar si se encuentra en ready o loaded */
      if (!["ready", "loaded"].includes(this.status))
        return { result: false, output: "Proceso no esta listo" };
      log.info(
        `process.run() Ejecutando proceso ${this._info.name} (args: ${
          args ? JSON.stringify(args) : "Sin argumentos"
        })`
      );
      /** Cambiar estado a running */
      await this.changeStatus("running");
      this._lastRun = new Date();
      /** Ejecutar la funcion */
      this._lastOutput = await this._process(args);
      /** Cambiar estado a ready y registrar ejecucion */
      const notes = this._lastOutput || "Sin salida";
      log.info(
        `process.run() Proceso ${this._info.name} finalizado con exito: ${notes}`
      );
      await this.changeStatus("ready");
      await this.registerRun(notes);
      return { result: true, output: this._lastOutput };
    } catch (error) {
      /** Cambiar estado a error y registrar ejecucion */
      this._lastError = new Date();
      this._lastErrorOutput = error.message;
      const notes = this._lastErrorOutput || "Sin Salida";
      log.info(
        `process.run() Proceso ${this._info.name} finalizado con error: ${notes}`
      );
      await this.registerRun(notes, true);
      await this.changeStatus("error");
      return { result: false, output: this._lastErrorOutput };
    }
  }
  /**
   * Detener proceso y cambiar a estado stopped
   */
  async stop() {
    /** Si el procesos esta en estado running esperamos que termine de ejecutarse antes de cambiar el estados*/
    if (this._status === "running") {
      log.info(
        `process.stop() Proceso ${this._info.name} se encuentra en estado running, esperando que termine de ejecutarse`
      );

      await new Promise((resolve) => {
        // Esperamos que se ejecute el cambio del status de la tarea
        this.on("status-change", () => {
          log.info(
            `process.stop() Proceso ${this._info.name} cambio de estado a ${this._status}`
          );
          resolve(true);
        });
        // Esperamos al evento 'task-finished' o 'task-error'
        this._task.on("task-finished", () => {
          log.info(
            `process.stop() Proceso ${this._info.name} finalizado con exito`
          );
          resolve(true);
        });
        this._task.on("task-error", () => {
          log.info(
            `process.stop() Proceso ${this._info.name} finalizado con error`
          );
          resolve(true);
        });
        // Si no recibimos este evento en 1 minuto, entonces forzamos la resolucion
        setTimeout(() => {
          log.info(
            `process.stop() Proceso ${this._info.name} forzando resolucion por timeout`
          );
          resolve(true);
        }, 60000);
      });
    }
    log.info(`Intentando detener proceso ${this._info.name}`);
    if (this._task) this._task.stop();
    await this.changeStatus("stopped");
    log.info(`process.stop() Proceso ${this._info.name} detenido`);
  }
}

export default Process;

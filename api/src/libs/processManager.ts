import Log from "./logger";
import { Process } from "./process";
import path from "path";
import fs from "fs";

const log = new Log("ProcessManager");

class ProcessManagerLib {
  private _processes: Process[] = [];
  /**
   * Inicializar gestor de procesos cargando los procesos existentes
   */

  constructor() {
    /** Leer procesos a ejecutar */
    const processPath = path.join(__dirname, "../processes");
    this.loadProcesses(processPath);
  }

  /**
   * Cargar procesos desde un path dado
   * @param processesPath Path de procesos
   */
  loadProcesses(processesPath: string = path.join(process.cwd(), "processes")) {
    /** Solo cargar procesos en caso de que el path exista */
    if (!fs.existsSync(processesPath)) return;
    /** Leer los archivos del path */
    const processesFiles = fs
      .readdirSync(processesPath)
      .map((file) => {
        const split = file.split(".");
        return [split[0], file];
      })
      .filter(
        (file) =>
          file[0] !== "index" &&
          !file[1].endsWith(".map") &&
          !file[1].endsWith(".gitkeep") &&
          !file[1].endsWith(".d.ts")
      );
    /** Cargarlos en el array de procesos*/
    for (const [name, file] of processesFiles) {
      const processFunction = require(path.join(processesPath, file)).default;
      if (processFunction instanceof Process) {
        this._processes.push(processFunction);
      }
    }
  }
  /**
   * Obtener proceso por codigo de cron
   */
  getProcessByCronCode(cronCode: string) {
    return this._processes.find((p) => p.info.cronVar === cronCode);
  }
  /**
   * Obtener proceso por codigo
   */
  getProcessByCode(code: string) {
    return this._processes.find((p) => p.info.code === code);
  }
  /**
   * Ejecutar proceso por codigo de proceso
   * @param code Codigo de proceso
   */
  async runProcessByCode(code: string) {
    const process = this.getProcessByCode(code);
    if (process) {
      return process.run();
    }
    throw new Error("No se encontro el proceso");
  }
}

export const ProcessManager = new ProcessManagerLib();
export default ProcessManager;

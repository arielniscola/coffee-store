import mongoose from "mongoose";
import Log from "./logger";

const log = new Log("DB");
/**
 * Clase que inicializa la conexion a la Base de Datos
 * @class DB
 * @param {string} uri URI de conexion a la Base de Datos
 * @returns Instancia de conexion a la Base de Datos
 * @example
 * const db = new DB('mongodb://localhost:27017/shiftmanagement');
 * await db.connect();
 */

export class DB {
  /** Instancia de mongoose */
  private static _db: mongoose.Connection;

  /** Conectar a la BD */
  static async connect(uri: string): Promise<void> {
    if (!this._db) {
      const db = mongoose.connection;
      this._db = db;
      return new Promise((resolve, reject) => {
        mongoose.connect(uri, {
          ignoreUndefined: true,
        });

        this._db.on("error", (err) => {
          console.error(`db.connect() error: ${err}`);
          reject(err);
        });
        this._db.once("open", () => {
          log.info(`db.connect() conectado a: ${this._db.name}`);
          resolve();
        });
      });
    }
  }

  static async close(): Promise<void> {
    if (this._db) {
      return new Promise((resolve, reject) => {
        this._db.close();
        log.info(`db.close() cerrado`);
      });
    }
  }
}

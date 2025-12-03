import EventEmitter from "events";
import { Filter, Options, Service, Update, Document } from ".";
import Log from "../libs/logger";
import { ConfigModel, IConfig } from "../models/config";
import { Coffeshop } from "..";
import { DEFAULT_GLOBAL_SETTINGS } from "../constants/globalConfigs";
import {
  FilterQuery,
  Types,
  UpdateQuery,
  UpdateWithAggregationPipeline,
} from "mongoose";
import { DEFAULT_COMPANY } from "../constants/defaults";
import processManager from "../libs/processManager";

const log = new Log("ConfigService");

/**
 * Crear parametro de configuracion
 */
export const ConfigParam = (data: IConfig) => {
  return data;
};

/**
 * @class Config
 * @extends {Service}
 */
export class ConfigService extends Service<IConfig> {
  private _event: EventEmitter;

  constructor() {
    super(ConfigModel);
    this._event = new EventEmitter();
  }

  /**
   * Escuchar cambios de configuracion
   * @param code Nombre de la configuracion a escuchar
   * @param listener Funcion a ejecutar
   */
  on(code: string, listener: (config: IConfig) => void) {
    this._event.on(code, listener);
  }

  async createDefaultGlobalConfigs() {
    try {
      const USER_GLOBAL_SETTINGS: IConfig[] =
        Coffeshop.get("globalConfigs") || [];
      for (const value of DEFAULT_GLOBAL_SETTINGS.concat(
        USER_GLOBAL_SETTINGS
      )) {
        const c = await ConfigModel.findOne({
          code: value.code,
          companyCode: value.companyCode,
        }).lean();

        if (!c) {
          const newConfig = new ConfigModel({
            ...value,
          });
          await newConfig.save();
        }
      }
    } catch (e) {
      throw e;
    }
  }
  /**
   * Obtener configuracion desde el archivo de constantes
   * @param code Codigo de la configuracion
   * @returns Configuracion
   */
  getFromConstants(code: string) {
    const USER_GLOBAL_SETTINGS: IConfig[] =
      Coffeshop.get("globalConfigs") || [];
    return DEFAULT_GLOBAL_SETTINGS.concat(USER_GLOBAL_SETTINGS).find(
      (c) => c.code === code
    );
  }
  /** Obtener valor de un parametro de configuracion mediante su codigo
   * @param code Codigo del parametro de configuracion
   * @returns Valor del parametro de configuracion
   */
  async getValue(code: string, companyCode: string = DEFAULT_COMPANY.code) {
    let config = await this.findOne({ code, companyCode });
    if (!config) {
      /** Si no encuentra la configuracion, tratamos de obtenerla desde el archivo de constantes */
      const getFromConstants = this.getFromConstants(code);
      if (getFromConstants)
        config = {
          _id: new Types.ObjectId(),
          ...getFromConstants,
        };
    }
    /** Si no la encuentra tampoco, devolver error */
    if (!config) {
      throw new Error(
        `configService.getValue() configuracion no encontrada: ${code}`
      );
    }
    /** Si la encuentra, devolver formateada */
    if (config.dataType === "boolean") return config.value === "true";
    if (config.dataType === "number") return Number(config.value);
    return config.value;
  }
  /**
   * Emitir evento de actualizacion de configuracion
   * @param config Configuracion actualizada
   */
  emitUpdate(config: IConfig) {
    // Emitir evento de cambio de configuracion
    this._event.emit(config.code, config);
    // Si es de tipo cron, reiniciamos el cron
    if (config.type === "cron") {
      const cron = processManager.getProcessByCronCode(config.code);
      if (cron) {
        cron.changeCronTime(config.value as string);
      }
    }
  }

  async updateOne(
    filter: FilterQuery<IConfig> & { _id?: string },
    data: UpdateQuery<IConfig> | UpdateWithAggregationPipeline
  ) {
    // Actualizar la configuracion
    const config = await super.updateOne(filter, data);
    this.emitUpdate(config);
    return config;
  }

  async findOneAndUpdate(
    filter: Filter<IConfig>,
    update: Update<IConfig>,
    options?: Options
  ): Promise<Document<IConfig>> {
    // Actualizar la configuracion
    const config = await super.findOneAndUpdate(filter, update, options);
    this.emitUpdate(config);
    return config;
  }
}
export const configService = new ConfigService();
export default configService;

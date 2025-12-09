import { ClientSession } from "mongoose";
import { insertManyOptions, Service } from ".";
import ShifManagement from "..";
import { DEFAULT_COMPANY_SETTINGS } from "../constants/companyConfig";
import Log from "../libs/logger";
import { CompanyModel, ICompany } from "../models/company";
import configService from "./config";
import { IAlertConfig } from "../models/alertConfigs";
import { AlertConfigService } from "./alertConfig";

export class CompanyService extends Service<ICompany> {
  constructor() {
    super(CompanyModel);
  }

  async createAlerts(companyCode: string, session?: ClientSession) {
    const logger = new Log("company.createAlerts");
    try {
      const alertConf = ShifManagement.get("alerts") as IAlertConfig[];
      for (const alert of alertConf) {
        const alertConfig = await AlertConfigService.getInstance().findOne({
          companyCode: companyCode,
          code: alert.code,
        });
        if (!alertConfig) {
          logger.info(
            `Creando alerta ${alert.code} para la compañia ${companyCode}`
          );
          await AlertConfigService.getInstance().insertOne(
            {
              ...alert,
              companyCode: companyCode,
            },
            { session }
          );
        }
      }
    } catch (error) {
      logger.error(
        error,
        `Error al crear alertas para la compañia ${companyCode}: ${error.message}`
      );
    }
  }

  /**
   * Crear una compania
   * @param data Datos de la compania
   * @returns Compania creada
   */
  async insertOne(data: Partial<ICompany>, options?: insertManyOptions) {
    const log = new Log("CompanyCoreService.insertOne");
    try {
      let company;
      console.log("Creating company:", data);
      // Insertamos la compania con el metodo de la clase padre
      company = await super.insertOne(data, {
        ...options,
      });
      // Creamos las configuraciones por defecto para la compania
      await this.createDefaultSettings(company.code);
      // Crear las alertas
      await this.createAlerts(company.code);
      return company;
    } catch (e) {
      log.error(e);
      throw e;
    }
  }

  /**
   * Crear las configuraciones por defecto para una compania
   * @param companyCode Codigo de compania
   * @returns Configuraciones creadas
   */
  private async createDefaultSettings(
    companyCode: string,
    session?: ClientSession
  ) {
    const log = new Log("CompanyCoreService.createDefaultSettings");
    try {
      // Obtenemos las configuraciones existentes para la compania
      const settings = await configService.find({ companyCode }, null, {
        session,
      });
      // Recorremos las configuraciones por defecto
      const USER_COMPANY_SETTINGS = ShifManagement.get("companyConfigs");
      for (const config of DEFAULT_COMPANY_SETTINGS.concat(
        USER_COMPANY_SETTINGS
      )) {
        try {
          // Verificamos si la configuracion ya existe
          if (!settings.find((s) => s.code === config.code)) {
            // Si no, la creamos
            await configService.insertOne(
              {
                ...config,
                companyCode,
              },
              { session }
            );
          }
        } catch (error) {
          // Este error no deberia romper el ciclo
          log.error(
            error,
            `Error al crear configuracion ${config.code}: ${error.message}`
          );
        }
      }
    } catch (e) {
      log.error(e);
      throw e;
    }
  }

  /**
   * Verificar que todas las companias tengan las configuraciones
   * por defecto
   */
  async checkCompaniesConfigs() {
    // Obtenemos todas las companias
    const companies = await this.find({});
    // Recorremos las companias
    for (const company of companies) {
      // Creamos las configuraciones por defecto para la compania
      await this.createDefaultSettings(company.code);
    }
  }

  /**
   * Verificar que todas las companias tengan las alertas
   */
  async checkCompaniesAlerts() {
    const logger = new Log("company.checkCompaniesAlerts");
    try {
      logger.info("ENTER");
      // Obtenemos todas las companias
      const companies = await this.find({});
      // Recorremos las companias
      for (const company of companies) {
        // Creamos las configuraciones por defecto para la compania
        await this.createAlerts(company.code);
      }
      logger.info("EXIT");
    } catch (error) {
      logger.error(error, `Error al verificar alertas: ${error.message}`);
    }
  }
}

export const companyService = new CompanyService();

import Log from "../libs/logger";
import { DEFAULT_COMPANY_SETTINGS } from "../constants/companyConfig";
import { companyService } from "./company";
import configService from "./config";

const log = new Log("ConfigBootstrap");

/**
 * Por cada compañía activa, garantiza que existan en la BD todos los configs
 * declarados en DEFAULT_COMPANY_SETTINGS. Solo crea los faltantes — no
 * sobrescribe valores ya configurados por el usuario.
 *
 * Pensado para correr en cada arranque del servidor: cada vez que sumamos
 * un config nuevo al código, aparece automáticamente en prod sin necesidad
 * de re-ejecutar el seed manual.
 */
export async function ensureDefaultConfigs() {
  try {
    const companies = await companyService.find({});
    if (!companies.length) {
      log.info("No hay compañías cargadas; se omite bootstrap de configs.");
      return;
    }

    let totalCreated = 0;
    for (const company of companies) {
      const code = company.code;
      if (!code) continue;
      for (const cfg of DEFAULT_COMPANY_SETTINGS) {
        const exists = await configService.findOne({
          code: cfg.code,
          companyCode: code,
        });
        if (!exists) {
          await configService.insertOne({
            ...cfg,
            companyCode: code,
          } as any);
          totalCreated++;
        }
      }
    }

    if (totalCreated > 0) {
      log.info(
        `Bootstrap de configs: ${totalCreated} configs creadas en ${companies.length} compañía(s).`,
      );
    }
  } catch (e) {
    log.error(e, "Error ejecutando bootstrap de configs");
  }
}

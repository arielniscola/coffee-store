import moment from "moment";
import Log from "../libs/logger";
import { IRouteController } from "../routes/index";
import { IWorkshop } from "../models/workshop";
import { workshopService } from "../services/workshop";

/**
 * Normaliza y valida el payload de un taller. Devuelve los campos listos
 * para persistir o lanza un Error descriptivo. Las imágenes de talleres son
 * generales y se manejan aparte (ver `workshopGallery`).
 */
function parseWorkshopBody(body: Partial<IWorkshop> & { date?: string }) {
  const dateStr = String(body.date || "").split("T")[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error("Fecha inválida. Formato esperado yyyy-MM-dd.");
  }
  const title = String(body.title || "").trim();
  if (!title) {
    throw new Error("El título del taller es requerido.");
  }
  const priceChild = Number(body.priceChild);
  if (Number.isNaN(priceChild) || priceChild < 0) {
    throw new Error("El precio por niño debe ser un número mayor o igual a 0.");
  }
  return {
    dateStr,
    title,
    priceChild,
    description: String(body.description || "").trim(),
    active: body.active !== false,
  };
}

export class WorkshopController {
  /** Listado completo para el dashboard (incluye pasados e inactivos). */
  static find: IRouteController = async (req, res) => {
    const logger = new Log(res.locals.requestId, "WorkshopController.find");
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const data = await workshopService.find(
        { companyCode },
        {},
        { sort: { date: -1 } }
      );
      return res.status(200).json({ ack: 0, data });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  /**
   * Endpoint público: talleres activos de hoy en adelante. Lo usan la landing
   * (sección de talleres con imágenes) y el modal de reserva (precio por niño
   * del día seleccionado).
   */
  static findUpcoming: IRouteController = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "WorkshopController.findUpcoming"
    );
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const data = await workshopService.findUpcoming(companyCode);
      return res.status(200).json({ ack: 0, data });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static create: IRouteController = async (req, res) => {
    const logger = new Log(res.locals.requestId, "WorkshopController.create");
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const parsed = parseWorkshopBody(req.body);

      // Un solo taller activo por fecha: el precio del día debe ser único.
      if (parsed.active) {
        const existing = await workshopService.findActiveByDate(
          companyCode,
          parsed.dateStr
        );
        if (existing) {
          throw new Error(
            `Ya hay un taller activo el ${parsed.dateStr} ("${existing.title}").`
          );
        }
      }

      const created = await workshopService.insertOne({
        companyCode,
        title: parsed.title,
        description: parsed.description,
        priceChild: parsed.priceChild,
        active: parsed.active,
        date: moment(parsed.dateStr, "YYYY-MM-DD")
          .utc(true)
          .startOf("day")
          .toDate(),
      });
      return res
        .status(200)
        .json({ ack: 0, message: "Taller creado", data: created });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static update: IRouteController = async (req, res) => {
    const logger = new Log(res.locals.requestId, "WorkshopController.update");
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const id = String(req.body._id || "");
      if (!workshopService.validateId(id)) throw new Error("ID no válido");
      const parsed = parseWorkshopBody(req.body);

      if (parsed.active) {
        const existing = await workshopService.findActiveByDate(
          companyCode,
          parsed.dateStr
        );
        if (existing && String(existing._id) !== id) {
          throw new Error(
            `Ya hay un taller activo el ${parsed.dateStr} ("${existing.title}").`
          );
        }
      }

      const updated = await workshopService.findOneAndUpdate(
        { _id: id, companyCode },
        {
          title: parsed.title,
          description: parsed.description,
          priceChild: parsed.priceChild,
          active: parsed.active,
          date: moment(parsed.dateStr, "YYYY-MM-DD")
            .utc(true)
            .startOf("day")
            .toDate(),
        }
      );
      if (!updated) throw new Error("Taller no encontrado");
      return res
        .status(200)
        .json({ ack: 0, message: "Taller actualizado", data: updated });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static delete: IRouteController<{ id: string }> = async (req, res) => {
    const logger = new Log(res.locals.requestId, "WorkshopController.delete");
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const id = req.params.id;
      if (!workshopService.validateId(id)) throw new Error("ID no válido");
      const deleted = await workshopService.deleteOne({ _id: id, companyCode });
      if (!deleted.deletedCount) throw new Error("Taller no encontrado");
      return res
        .status(200)
        .json({ ack: 0, message: "Taller eliminado correctamente" });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };
}

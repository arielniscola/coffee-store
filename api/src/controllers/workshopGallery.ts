import Log from "../libs/logger";
import { IRouteController } from "../routes/index";
import { workshopGalleryService } from "../services/workshopGallery";

/** Límites de la galería general (imágenes como data-URL en el documento). */
const MAX_IMAGES = 12;
const MAX_IMAGE_LENGTH = 2_000_000; // ~1.5MB de imagen ya comprimida

export class WorkshopGalleryController {
  /** Endpoint público: imágenes de la galería general de talleres. */
  static find: IRouteController = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "WorkshopGalleryController.find"
    );
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const images = await workshopGalleryService.getImages(companyCode);
      return res.status(200).json({ ack: 0, data: images });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static update: IRouteController = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "WorkshopGalleryController.update"
    );
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const raw = (req.body?.images ?? []) as unknown[];
      const images = Array.isArray(raw)
        ? raw.filter((i) => typeof i === "string" && i.length > 0)
        : [];
      if (images.length > MAX_IMAGES) {
        throw new Error(`Se permiten hasta ${MAX_IMAGES} imágenes.`);
      }
      if (images.some((i) => (i as string).length > MAX_IMAGE_LENGTH)) {
        throw new Error(
          "Una de las imágenes es demasiado pesada. Volvé a subirla (se comprime automáticamente)."
        );
      }
      const updated = await workshopGalleryService.setImages(
        companyCode,
        images as string[]
      );
      return res
        .status(200)
        .json({ ack: 0, message: "Galería actualizada", data: updated });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };
}

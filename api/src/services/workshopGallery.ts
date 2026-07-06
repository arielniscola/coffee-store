import { Service } from ".";
import {
  IWorkshopGallery,
  WorkshopGalleryModel,
} from "../models/workshopGallery";

export class WorkshopGalleryService extends Service<IWorkshopGallery> {
  constructor() {
    super(WorkshopGalleryModel);
  }

  /** Imágenes de la galería general de la empresa (array vacío si no hay). */
  async getImages(companyCode: string): Promise<string[]> {
    const doc = await this.findOne({ companyCode });
    return doc?.images || [];
  }

  /**
   * Reemplaza la galería de la empresa por el set de imágenes indicado
   * (upsert: crea el documento si no existía).
   */
  async setImages(
    companyCode: string,
    images: string[]
  ): Promise<IWorkshopGallery> {
    return await this.findOneAndUpdate(
      { companyCode },
      { $set: { images } },
      { upsert: true }
    );
  }
}

export const workshopGalleryService = new WorkshopGalleryService();
export default workshopGalleryService;

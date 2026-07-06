import { createModel, createSchema } from ".";

/**
 * Galería general de talleres (1 documento por empresa). Son imágenes
 * informativas sobre los talleres en general, no atadas a un taller puntual.
 * Se muestran como galería en la landing pública. Las imágenes se guardan como
 * data-URL (base64) comprimidas desde el dashboard.
 */
export interface IWorkshopGallery {
  _id?: string;
  companyCode: string;
  images: string[];
}

export const WorkshopGallerySchema = createSchema<IWorkshopGallery>(
  {
    companyCode: {
      type: String,
      required: true,
      unique: true,
    },
    images: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export const WorkshopGalleryModel = createModel(
  "workshopGallery",
  WorkshopGallerySchema
);

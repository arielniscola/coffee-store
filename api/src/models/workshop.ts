import { createModel, createSchema } from ".";

/**
 * Taller: día especial en el que las reservas de niños tienen un precio
 * propio (distinto del config `priceChild`). Se define para fechas puntuales.
 *
 * La fecha se guarda como Date a medianoche UTC (solo importa el día, igual
 * que el resto de turnos). Las imágenes de talleres son generales (no por
 * taller) y viven en `workshopGallery`.
 */
export interface IWorkshop {
  _id?: string;
  companyCode: string;
  date: Date;
  title: string;
  description?: string;
  /** Precio de la reserva por niño para ese día (reemplaza a `priceChild`). */
  priceChild: number;
  /** Un taller inactivo no cambia precios ni se muestra en la landing. */
  active: boolean;
}

export const WorkshopSchema = createSchema<IWorkshop>(
  {
    companyCode: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    priceChild: {
      type: Number,
      required: true,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const WorkshopModel = createModel("workshop", WorkshopSchema);

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
  /**
   * Cómo cobra la disponibilidad de ese día. El generador aplica estos valores
   * a los horarios del día del taller: si exige seña y con qué monto por niño
   * (en 0 se usa `priceChild`), y con qué capacidad.
   */
  requiresDeposit?: boolean;
  depositAmount?: number;
  /** Capacidad propia del taller. En null se usa la de la compañía. */
  capacityAdults?: number | null;
  capacityChildren?: number | null;
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
    requiresDeposit: {
      type: Boolean,
      default: true,
    },
    depositAmount: {
      type: Number,
      required: false,
      default: 0,
    },
    capacityAdults: {
      type: Number,
      required: false,
      default: null,
    },
    capacityChildren: {
      type: Number,
      required: false,
      default: null,
    },
  },
  { timestamps: true }
);

export const WorkshopModel = createModel("workshop", WorkshopSchema);

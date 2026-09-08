import { createModel, createSchema } from ".";

/** Turno normal o turno de taller. */
export type SlotKind = "reservation" | "workshop";
/** Un slot `closed` existe pero no se puede reservar. */
export type SlotStatus = "open" | "closed";
/** Qué produjo la disponibilidad. */
export type SlotSource = "generated" | "manual";

/**
 * Turno disponible materializado: la *oferta* de un día concreto.
 *
 * Importante: el slot NO guarda cupo restante. La ocupación se calcula en vivo
 * restando las reservas (`shift`) de `capacityAdults`/`capacityChildren`,
 * porque cambia minuto a minuto. El slot responde a "¿este turno existe,
 * cuánto dura, cobra seña, es taller, está abierto?".
 */
export interface ISlot {
  _id?: string;
  companyCode: string;
  /** "" cuando el turno no está atado a una unidad de negocio puntual. */
  unitBusiness: string;
  /** Día del turno, a medianoche UTC (igual que `shift.date`). */
  date: Date;
  timeStart: string;
  timeEnd: string;
  kind: SlotKind;
  source: SlotSource;
  /** Taller al que pertenece, cuando `kind` es "workshop". */
  workshopId?: string | null;
  requiresDeposit: boolean;
  /** Seña por niño para este turno. En 0 se usa el `priceChild` general. */
  depositAmount?: number;
  capacityAdults: number;
  capacityChildren: number;
  status: SlotStatus;
  /** Por qué quedó cerrado (excepción de horario, cierre manual, etc.). */
  closedReason?: string;
  /** Cuándo se generó esta disponibilidad. */
  generatedAt: Date;
}

export const SlotSchema = createSchema<ISlot>(
  {
    companyCode: { type: String, required: true },
    unitBusiness: { type: String, default: "" },
    date: { type: Date, required: true },
    timeStart: { type: String, required: true },
    timeEnd: { type: String, required: true },
    kind: { type: String, enum: ["reservation", "workshop"], default: "reservation" },
    source: {
      type: String,
      enum: ["generated", "manual"],
      default: "generated",
    },
    workshopId: { type: String, required: false, default: null },
    requiresDeposit: { type: Boolean, default: true },
    depositAmount: { type: Number, default: 0 },
    capacityAdults: { type: Number, default: 0 },
    capacityChildren: { type: Number, default: 0 },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    closedReason: { type: String, required: false },
    generatedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

/** Un solo turno por compañía + unidad + día + hora de inicio. */
SlotSchema.index(
  { companyCode: 1, unitBusiness: 1, date: 1, timeStart: 1 },
  { unique: true }
);
/** Consulta de disponibilidad del día. */
SlotSchema.index({ companyCode: 1, date: 1, status: 1 });

export const SlotModel = createModel("slot", SlotSchema);

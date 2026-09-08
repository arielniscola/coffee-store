/** Días de la semana, 0 = domingo, en el orden en que se muestran. */
export const WEEKDAYS: { value: number; label: string; short: string }[] = [
  { value: 1, label: "Lunes", short: "Lu" },
  { value: 2, label: "Martes", short: "Ma" },
  { value: 3, label: "Miércoles", short: "Mi" },
  { value: 4, label: "Jueves", short: "Ju" },
  { value: 5, label: "Viernes", short: "Vi" },
  { value: 6, label: "Sábado", short: "Sá" },
  { value: 0, label: "Domingo", short: "Do" },
];

/** Una franja horaria a ofrecer. Cada bloque es UN turno disponible. */
export interface IBlock {
  /** Id local, solo para React. */
  key: string;
  timeStart: string;
  timeEnd: string;
  /**
   * Si reservar ese horario exige seña. El monto no se define acá: sale del
   * precio por niño configurado en la empresa (o del taller, si ese día tiene).
   */
  requiresDeposit: boolean;
}

export type SlotKind = "reservation" | "workshop";
export type SlotStatus = "open" | "closed";
export type SlotSource = "generated" | "manual";

/** Una disponibilidad generada, con la ocupación ya calculada. */
export interface ISlot {
  _id?: string;
  companyCode?: string;
  unitBusiness: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  kind: SlotKind;
  source: SlotSource;
  workshopId?: string | null;
  requiresDeposit: boolean;
  depositAmount?: number;
  capacityAdults: number;
  capacityChildren: number;
  status: SlotStatus;
  closedReason?: string;
  occupiedAdults?: number;
  occupiedChildren?: number;
  availablesAdults?: number;
  availablesChildren?: number;
  availables?: number;
}

/** Qué va a pasar con una franja de un día puntual. */
export type PreviewStatus = "new" | "exists" | "overlap" | "closed";

export interface IPreviewItem {
  date: string;
  weekday: number;
  timeStart: string;
  timeEnd: string;
  status: PreviewStatus;
  requiresDeposit: boolean;
  depositAmount: number;
  capacityAdults: number;
  capacityChildren: number;
  isWorkshop: boolean;
  note?: string;
}

/** Resultado de una generación (o de su previsualización). */
export interface IGenerateResult {
  from: string;
  to: string;
  dryRun: boolean;
  /** Días del rango que caen en los días de semana elegidos. */
  days: number;
  created: number;
  existing: number;
  overlapping: number;
  closed: number;
  preview: IPreviewItem[];
}

/** Cómo está compuesto un día de la agenda publicada. */
export interface IDaySummary {
  date: string;
  total: number;
  workshop: number;
  withoutDeposit: number;
  closed: number;
}

/** Hasta dónde llega la disponibilidad publicada. */
export interface ISlotSummary {
  from: string;
  to: string;
  days: IDaySummary[];
  horizon: string | null;
  total: number;
}

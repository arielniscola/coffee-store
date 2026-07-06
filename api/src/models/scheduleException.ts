import { createModel, createSchema } from ".";

/**
 * Excepción de horario por rango de fechas (company-wide).
 *
 * Se aplica POR ENCIMA del horario semanal recurrente (`scheduleDay{Día}`):
 *  - type "open":  agrega una franja reservable [timeStart, timeEnd) en todas
 *                  las fechas del rango [dateFrom, dateTo], aunque ese día no la
 *                  tuviera en el horario semanal.
 *  - type "close": bloquea esa franja en todas las fechas del rango, sin cerrar
 *                  el día completo (a diferencia de `closedDates`).
 *
 * Las horas se guardan como string "HH:mm". Las fechas se guardan como Date a
 * medianoche UTC (solo importa el día, igual que el resto de turnos).
 */
export interface IScheduleException {
  _id?: string;
  companyCode: string;
  type: "open" | "close";
  dateFrom: Date;
  dateTo: Date;
  timeStart: string;
  timeEnd: string;
  /**
   * Cierre de día completo. Cuando es true, el rango horario se ignora y el día
   * queda totalmente cerrado (no se puede reservar). Reemplaza al viejo config
   * `closedDates`.
   */
  allDay?: boolean;
}

export const ScheduleExceptionSchema = createSchema<IScheduleException>(
  {
    companyCode: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["open", "close"],
      required: true,
    },
    dateFrom: {
      type: Date,
      required: true,
    },
    dateTo: {
      type: Date,
      required: true,
    },
    timeStart: {
      type: String,
      required: true,
    },
    timeEnd: {
      type: String,
      required: true,
    },
    allDay: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const ScheduleExceptionModel = createModel(
  "scheduleException",
  ScheduleExceptionSchema
);

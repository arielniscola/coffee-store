export interface IScheduleException {
  _id?: string;
  companyCode?: string;
  type: "open" | "close";
  /** Fecha de inicio del rango (ISO o yyyy-MM-dd). */
  dateFrom: string;
  /** Fecha de fin del rango (ISO o yyyy-MM-dd). */
  dateTo: string;
  /** Hora de inicio de la franja "HH:mm". */
  timeStart: string;
  /** Hora de fin de la franja "HH:mm". */
  timeEnd: string;
  /** Cierre de día completo (las horas se ignoran). Solo para type "close". */
  allDay?: boolean;
}

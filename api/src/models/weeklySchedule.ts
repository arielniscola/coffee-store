import { createModel, createSchema } from ".";

/** Franja horaria de un día: horas "HH:mm". */
export interface ITimeRangeDoc {
  start: string;
  end: string;
}

/**
 * Horario semanal estructurado por compañía. Reemplaza a los 7 configs string
 * `scheduleDay{Día}`. Las claves de día están en inglés y minúscula para
 * coincidir con `moment().format("dddd")` (lowercased).
 */
export interface IWeeklySchedule {
  _id?: string;
  companyCode: string;
  monday: ITimeRangeDoc[];
  tuesday: ITimeRangeDoc[];
  wednesday: ITimeRangeDoc[];
  thursday: ITimeRangeDoc[];
  friday: ITimeRangeDoc[];
  saturday: ITimeRangeDoc[];
  sunday: ITimeRangeDoc[];
}

/** Claves de día válidas, en orden. */
export const WEEKDAY_KEYS: (keyof Omit<
  IWeeklySchedule,
  "_id" | "companyCode"
>)[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const rangeDef = {
  start: { type: String, required: true },
  end: { type: String, required: true },
};

const WeeklyScheduleSchema = createSchema<IWeeklySchedule>(
  {
    companyCode: {
      type: String,
      required: true,
      unique: true,
    },
    monday: { type: [rangeDef], default: [] },
    tuesday: { type: [rangeDef], default: [] },
    wednesday: { type: [rangeDef], default: [] },
    thursday: { type: [rangeDef], default: [] },
    friday: { type: [rangeDef], default: [] },
    saturday: { type: [rangeDef], default: [] },
    sunday: { type: [rangeDef], default: [] },
  },
  { timestamps: true }
);

export const WeeklyScheduleModel = createModel(
  "weeklySchedule",
  WeeklyScheduleSchema
);

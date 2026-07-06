export interface ITimeRange {
  start: string;
  end: string;
}

export type WeekdayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface IWeeklySchedule {
  _id?: string;
  companyCode?: string;
  monday: ITimeRange[];
  tuesday: ITimeRange[];
  wednesday: ITimeRange[];
  thursday: ITimeRange[];
  friday: ITimeRange[];
  saturday: ITimeRange[];
  sunday: ITimeRange[];
}

export const WEEKDAYS: { key: WeekdayKey; label: string }[] = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

export const emptyWeeklySchedule = (): IWeeklySchedule => ({
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
});

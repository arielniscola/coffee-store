import { Service } from ".";
import {
  IWeeklySchedule,
  ITimeRangeDoc,
  WeeklyScheduleModel,
  WEEKDAY_KEYS,
} from "../models/weeklySchedule";
import configService from "./config";
import {
  TimeRange,
  timeToMinutes,
  minutesToTime,
  parseScheduleRanges,
} from "./scheduleException";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Capitaliza una clave de día ("monday" -> "Monday") para los configs legacy. */
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export class WeeklyScheduleService extends Service<IWeeklySchedule> {
  constructor() {
    super(WeeklyScheduleModel);
  }

  async getForCompany(companyCode: string): Promise<IWeeklySchedule | null> {
    return await this.findOne({ companyCode });
  }

  /**
   * Horario semanal "efectivo" para una compañía: si existe el doc estructurado
   * lo usa; si no, lo arma a partir de los configs legacy. Nunca devuelve null,
   * así el editor y la landing siempre reflejan el horario vigente.
   */
  async getEffective(companyCode: string): Promise<IWeeklySchedule> {
    const result: any = { companyCode };
    for (const key of WEEKDAY_KEYS) {
      const ranges = await this.getRangesForDay(companyCode, key);
      result[key] = ranges.map((r) => ({
        start: minutesToTime(r.start),
        end: minutesToTime(r.end),
      }));
    }
    return result as IWeeklySchedule;
  }

  /**
   * Rangos (en minutos) del día indicado para una compañía. `dayName` es el
   * nombre en inglés capitalizado ("Monday"). Si todavía no existe horario
   * estructurado, cae al viejo config `scheduleDay{Día}` (string).
   */
  async getRangesForDay(
    companyCode: string,
    dayName: string
  ): Promise<TimeRange[]> {
    const key = dayName.toLowerCase() as keyof IWeeklySchedule;
    const doc = await this.getForCompany(companyCode);
    if (doc && Array.isArray(doc[key])) {
      return (doc[key] as ITimeRangeDoc[])
        .map((r) => ({
          start: timeToMinutes(r.start),
          end: timeToMinutes(r.end),
        }))
        .filter((r) => !Number.isNaN(r.start) && !Number.isNaN(r.end) && r.end > r.start);
    }
    // Fallback legacy: leer el config string del día.
    try {
      const raw = String(
        (await configService.getValue(
          `scheduleDay${capitalize(dayName)}`,
          companyCode
        )) || ""
      );
      return parseScheduleRanges(raw);
    } catch (e) {
      return [];
    }
  }

  /**
   * Valida la estructura de horario completa. Devuelve un mensaje de error o
   * null si está OK.
   */
  validateSchedule(schedule: Partial<IWeeklySchedule>): string | null {
    for (const key of WEEKDAY_KEYS) {
      const ranges = (schedule[key] as ITimeRangeDoc[] | undefined) || [];
      if (!Array.isArray(ranges)) return `El día ${key} tiene un formato inválido.`;
      for (const r of ranges) {
        if (!TIME_RE.test(r?.start) || !TIME_RE.test(r?.end)) {
          return `Hora inválida en ${key}. Usá HH:mm (00:00 a 23:59).`;
        }
        if (timeToMinutes(r.end) <= timeToMinutes(r.start)) {
          return `En ${key}, la hora de fin debe ser posterior a la de inicio.`;
        }
      }
      // Rechazar franjas solapadas dentro del mismo día.
      const sorted = [...ranges].sort(
        (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
      );
      for (let i = 1; i < sorted.length; i++) {
        if (timeToMinutes(sorted[i].start) < timeToMinutes(sorted[i - 1].end)) {
          return `En ${key} hay franjas que se solapan.`;
        }
      }
    }
    return null;
  }

  /** Crea o actualiza el horario semanal de una compañía. */
  async upsert(
    companyCode: string,
    schedule: Partial<IWeeklySchedule>
  ): Promise<IWeeklySchedule> {
    const update: Partial<IWeeklySchedule> = { companyCode };
    for (const key of WEEKDAY_KEYS) {
      update[key] = ((schedule[key] as ITimeRangeDoc[]) || []).map((r) => ({
        start: r.start,
        end: r.end,
      }));
    }
    return await this.findOneAndUpdate({ companyCode }, update, {
      upsert: true,
      new: true,
    });
  }
}

export const weeklyScheduleService = new WeeklyScheduleService();
export default weeklyScheduleService;

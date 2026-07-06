import moment from "moment";
import { Service } from ".";
import {
  IScheduleException,
  ScheduleExceptionModel,
} from "../models/scheduleException";
import configService from "./config";

/** Rango horario en minutos desde la medianoche: [start, end). */
export interface TimeRange {
  start: number;
  end: number;
}

/** Convierte "HH:mm" a minutos desde la medianoche. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":");
  return parseInt(h, 10) * 60 + parseInt(m || "0", 10);
}

/** Convierte minutos desde la medianoche a "HH:mm". */
export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Valida un string de horario semanal ("09:00-12:00, 14:00-18:00").
 * Devuelve un mensaje de error si algún tramo es inválido, o null si está OK.
 * Acepta vacío o "-" (día sin horario). A diferencia de parseScheduleRanges
 * (que descarta tramos malformados en silencio), acá rechazamos para evitar
 * que se guarde data corrupta como "09:00" (sin hora de fin).
 */
export function validateScheduleString(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-") return null;
  for (const slot of raw.split(",")) {
    const part = slot.trim();
    if (!part) continue;
    const segments = part.split("-").map((s) => s.trim());
    if (segments.length !== 2 || !segments[0] || !segments[1]) {
      return `Franja inválida "${part}". Formato esperado HH:mm-HH:mm (ej. 09:00-18:00).`;
    }
    const [start, end] = segments;
    if (!TIME_RE.test(start) || !TIME_RE.test(end)) {
      return `Hora inválida en "${part}". Usá HH:mm entre 00:00 y 23:59.`;
    }
    if (timeToMinutes(end) <= timeToMinutes(start)) {
      return `En "${part}" la hora de fin debe ser posterior a la de inicio.`;
    }
  }
  return null;
}

/** Parsea un string de horario semanal ("09:00-12:00, 14:00-18:00") a rangos. */
export function parseScheduleRanges(schedule: string): TimeRange[] {
  if (!schedule) return [];
  const ranges: TimeRange[] = [];
  for (const slot of schedule.trim().split(",")) {
    const parts = slot.trim().split("-");
    if (parts.length < 2) continue;
    const start = timeToMinutes(parts[0].trim());
    const end = timeToMinutes(parts[1].trim());
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) continue;
    ranges.push({ start, end });
  }
  return ranges;
}

/** Une rangos solapados o adyacentes en una lista ordenada y normalizada. */
export function mergeRanges(ranges: TimeRange[]): TimeRange[] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: TimeRange[] = [];
  for (const r of sorted) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end);
    } else {
      merged.push({ ...r });
    }
  }
  return merged;
}

/** Resta la franja [cutStart, cutEnd) de una lista de rangos. */
export function subtractRange(
  ranges: TimeRange[],
  cutStart: number,
  cutEnd: number
): TimeRange[] {
  const result: TimeRange[] = [];
  for (const r of ranges) {
    // Sin solapamiento: el rango queda intacto.
    if (cutEnd <= r.start || cutStart >= r.end) {
      result.push({ ...r });
      continue;
    }
    // Queda un tramo a la izquierda del corte.
    if (cutStart > r.start) result.push({ start: r.start, end: cutStart });
    // Queda un tramo a la derecha del corte.
    if (cutEnd < r.end) result.push({ start: cutEnd, end: r.end });
  }
  return result;
}

/** Devuelve true si [aStart,aEnd) y [bStart,bEnd) se solapan. */
function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Nombre del día en inglés capitalizado (Monday, Tuesday, ...). */
function weekdayName(dateStr: string): string {
  const day = moment(dateStr, "YYYY-MM-DD").locale("en").format("dddd");
  return day.charAt(0).toUpperCase() + day.slice(1);
}

export class ScheduleExceptionService extends Service<IScheduleException> {
  constructor() {
    super(ScheduleExceptionModel);
  }

  /**
   * Aperturas especiales ("open") vigentes de hoy en adelante (su rango aún no
   * terminó). Son las "fechas especiales" públicas: se abre una franja horaria
   * desde una fecha hasta otra. Ordenadas por fecha de inicio y hora.
   */
  async findUpcomingOpen(
    companyCode: string
  ): Promise<IScheduleException[]> {
    const todayStart = moment().utc(true).startOf("day");
    return await this.find(
      {
        companyCode,
        type: "open",
        dateTo: { $gte: todayStart.toDate() },
      },
      {},
      { sort: { dateFrom: 1, timeStart: 1 } }
    );
  }

  /**
   * Excepciones cuyo rango [dateFrom, dateTo] incluye la fecha indicada
   * (yyyy-MM-dd). Compara por día, ignorando la hora.
   */
  async findActiveForDate(
    companyCode: string,
    dateStr: string
  ): Promise<IScheduleException[]> {
    const dayStart = moment(dateStr, "YYYY-MM-DD").utc(true).startOf("day");
    const dayEnd = moment(dateStr, "YYYY-MM-DD").utc(true).endOf("day");
    return await this.find({
      companyCode,
      dateFrom: { $lte: dayEnd.toDate() },
      dateTo: { $gte: dayStart.toDate() },
    });
  }

  /**
   * Aplica las excepciones sobre los rangos del horario semanal:
   * primero suma las franjas "open", luego resta las "close" (cerrar tiene
   * prioridad). Devuelve los rangos efectivos del día, ordenados y normalizados.
   */
  computeEffectiveRanges(
    weeklyRanges: TimeRange[],
    exceptions: IScheduleException[]
  ): TimeRange[] {
    // Un cierre de día completo gana sobre todo: el día queda sin slots.
    if (exceptions.some((e) => e.type === "close" && e.allDay)) {
      return [];
    }
    const opens = exceptions
      .filter((e) => e.type === "open")
      .map((e) => ({
        start: timeToMinutes(e.timeStart),
        end: timeToMinutes(e.timeEnd),
      }));
    let ranges = mergeRanges([...weeklyRanges, ...opens]);
    for (const e of exceptions) {
      if (e.type !== "close") continue;
      ranges = subtractRange(
        ranges,
        timeToMinutes(e.timeStart),
        timeToMinutes(e.timeEnd)
      );
    }
    return ranges;
  }

  /**
   * Determina si una fecha (yyyy-MM-dd) está totalmente cerrada para la
   * compañía: existe una excepción "close" de día completo activa, o (fallback)
   * la fecha figura en el viejo config `closedDates`.
   */
  async isDateClosed(companyCode: string, dateStr: string): Promise<boolean> {
    const active = await this.findActiveForDate(companyCode, dateStr);
    if (active.some((e) => e.type === "close" && e.allDay)) return true;
    // Fallback al config legacy mientras no se haya migrado.
    return (await this.getLegacyClosedDates(companyCode)).includes(dateStr);
  }

  /**
   * Lista de fechas (yyyy-MM-dd) totalmente cerradas para la compañía:
   * expande las excepciones "close" de día completo y suma las del config
   * legacy `closedDates`. Pensado para deshabilitar fechas en el front.
   */
  async getClosedDates(companyCode: string): Promise<string[]> {
    const set = new Set<string>(await this.getLegacyClosedDates(companyCode));
    const allDayCloses = await this.find({
      companyCode,
      type: "close",
      allDay: true,
    });
    for (const e of allDayCloses) {
      const cursor = moment(e.dateFrom).utc();
      const end = moment(e.dateTo).utc();
      while (cursor.isSameOrBefore(end, "day")) {
        set.add(cursor.format("YYYY-MM-DD"));
        cursor.add(1, "day");
      }
    }
    return Array.from(set).sort();
  }

  /** Lee y parsea el viejo config `closedDates` (lista yyyy-MM-dd). */
  private async getLegacyClosedDates(companyCode: string): Promise<string[]> {
    try {
      const raw = (await configService.getValue(
        "closedDates",
        companyCode
      )) as string;
      if (!raw) return [];
      return String(raw)
        .split(",")
        .map((d) => d.trim())
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
    } catch (e) {
      return [];
    }
  }

  /**
   * Para una excepción "open" candidata, devuelve las fechas del rango en las
   * que la franja se pisa con el horario semanal ya configurado o con otra
   * excepción "open" existente. Si está vacío, no hay conflictos.
   */
  async findOpenConflicts(
    companyCode: string,
    dateFrom: string,
    dateTo: string,
    timeStart: string,
    timeEnd: string
  ): Promise<string[]> {
    const newStart = timeToMinutes(timeStart);
    const newEnd = timeToMinutes(timeEnd);

    // Horario semanal de los 7 días, cacheado para no consultar de más.
    const weeklyByDay: Record<string, TimeRange[]> = {};
    const getWeekly = async (day: string): Promise<TimeRange[]> => {
      if (weeklyByDay[day]) return weeklyByDay[day];
      let raw = "";
      try {
        raw = String(
          (await configService.getValue(`scheduleDay${day}`, companyCode)) || ""
        );
      } catch (e) {
        raw = "";
      }
      weeklyByDay[day] = parseScheduleRanges(raw);
      return weeklyByDay[day];
    };

    const conflicts: string[] = [];
    const cursor = moment(dateFrom, "YYYY-MM-DD");
    const end = moment(dateTo, "YYYY-MM-DD");
    while (cursor.isSameOrBefore(end, "day")) {
      const dateStr = cursor.format("YYYY-MM-DD");
      const weekly = await getWeekly(weekdayName(dateStr));
      const existingOpens = (await this.findActiveForDate(companyCode, dateStr))
        .filter((e) => e.type === "open")
        .map((e) => ({
          start: timeToMinutes(e.timeStart),
          end: timeToMinutes(e.timeEnd),
        }));
      const blocking = [...weekly, ...existingOpens];
      if (blocking.some((r) => rangesOverlap(newStart, newEnd, r.start, r.end))) {
        conflicts.push(dateStr);
      }
      cursor.add(1, "day");
    }
    return conflicts;
  }
}

export const scheduleExceptionService = new ScheduleExceptionService();
export default scheduleExceptionService;

import moment from "moment";
import { ISlot } from "../models/slot";
import { IWorkshop } from "../models/workshop";
import scheduleExceptionService, { timeToMinutes } from "./scheduleException";
import { shiftService } from "./shift";
import slotService from "./slot";
import workshopService from "./workshop";
import { weeklyScheduleService } from "./weeklySchedule";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Tope de días por corrida, para que una fecha mal tipeada no funda la base. */
export const MAX_GENERATION_DAYS = 366;

/**
 * Una franja horaria a ofrecer. Cada bloque es UN turno disponible: si el
 * turno dura dos horas, el bloque va de 09:00 a 11:00. No se subdivide.
 */
export interface GenerateBlock {
  timeStart: string;
  timeEnd: string;
  /** Si la reserva de ese horario exige seña. */
  requiresDeposit: boolean;
  /** Seña por niño. En 0 se usa el precio general de la compañía. */
  depositAmount?: number;
  /** Capacidad propia. En null se usa la de la compañía (mesas o máximos). */
  capacityAdults?: number | null;
  capacityChildren?: number | null;
}

export interface GenerateOptions {
  companyCode: string;
  /** Rango de fechas a cubrir, yyyy-MM-dd inclusive. */
  from: string;
  to: string;
  /** Días de la semana dentro del rango. 0 = domingo … 6 = sábado. */
  weekdays: number[];
  /** Las franjas a ofrecer en cada uno de esos días. */
  blocks: GenerateBlock[];
  unitBusiness?: string;
  /** Con true solo se calcula la previsualización y no se escribe nada. */
  dryRun?: boolean;
}

/** Qué va a pasar con una franja de un día puntual. */
export type PreviewStatus = "new" | "exists" | "overlap" | "closed";

export interface PreviewItem {
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
  /** Por qué no se va a crear, cuando el status no es "new". */
  note?: string;
}

export interface GenerateResult {
  from: string;
  to: string;
  dryRun: boolean;
  /** Días del rango que caen en los días de semana elegidos. */
  days: number;
  created: number;
  /** Ya existía esa misma disponibilidad: no se duplica. */
  existing: number;
  /** Se pisa con una disponibilidad ya generada: no se crea. */
  overlapping: number;
  /** El día está cerrado: no se ofrece nada. */
  closed: number;
  preview: PreviewItem[];
}

/** Nombre de día en inglés capitalizado, que es lo que espera weeklySchedule. */
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Devuelve true si [aStart,aEnd) y [bStart,bEnd) se solapan. */
const overlaps = (
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
) => aStart < bEnd && bStart < aEnd;

export class SlotGeneratorService {
  /**
   * Genera la disponibilidad de reservas para un rango de fechas.
   *
   * Ojo con el nombre: esto NO crea reservas. Crea los huecos reservables
   * (`slot`); las reservas de la gente (`shift`) son otra cosa y el generador
   * nunca las toca.
   *
   * Es puramente aditivo: crea las franjas que faltan y deja en paz todo lo
   * demás. Nunca borra ni modifica una disponibilidad existente — para eso
   * está el borrado individual, que además se niega si ya tiene reservas.
   */
  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const {
      companyCode,
      from,
      to,
      weekdays,
      blocks,
      unitBusiness = "",
      dryRun = false,
    } = options;

    this.validate(options);

    const defaultCapacity = await shiftService.getCapacity(
      companyCode,
      unitBusiness || undefined
    );
    // Toda la disponibilidad ya generada del rango, para detectar duplicados
    // y superposiciones sin ir a la base día por día.
    const existing = await slotService.findInRange(
      companyCode,
      from,
      to,
      unitBusiness || undefined
    );
    const existingByDate = new Map<string, ISlot[]>();
    for (const slot of existing) {
      const key = moment(slot.date).utc().format("YYYY-MM-DD");
      existingByDate.set(key, [...(existingByDate.get(key) || []), slot]);
    }

    // Cierres y talleres se traen UNA vez para todo el rango: la
    // previsualización se recalcula sola mientras el usuario configura, y
    // consultar por día convertía cada cambio en cientos de queries.
    const closedDates = new Set(
      await this.getClosedDates(companyCode)
    );
    const workshopsByDate = new Map<string, IWorkshop>();
    for (const workshop of await workshopService.findActiveInRange(
      companyCode,
      from,
      to
    )) {
      workshopsByDate.set(
        moment(workshop.date).utc().format("YYYY-MM-DD"),
        workshop
      );
    }

    // Franjas marcadas "sin seña" en el horario semanal, por día de semana.
    // Es la regla del negocio para ese rango horario y le gana al default del
    // formulario: sin esto, publicar disponibilidad sobre una franja libre la
    // dejaba igual con seña y el checkout mandaba al cliente a Mercado Pago.
    const freeRangesByWeekday = await this.getFreeRanges(
      companyCode,
      weekdays,
    );

    const preview: PreviewItem[] = [];
    const toCreate: Partial<ISlot>[] = [];
    let days = 0;
    const generatedAt = new Date();

    const cursor = moment(from, "YYYY-MM-DD");
    const end = moment(to, "YYYY-MM-DD");
    while (cursor.isSameOrBefore(end, "day")) {
      const dateStr = cursor.format("YYYY-MM-DD");
      const weekday = cursor.day();
      if (!weekdays.includes(weekday)) {
        cursor.add(1, "day");
        continue;
      }
      days++;

      const closed = closedDates.has(dateStr);
      // Un taller activo le pone su precio y su condición de seña a la
      // disponibilidad de ese día.
      const workshop = closed ? null : workshopsByDate.get(dateStr) || null;
      const dayExisting = existingByDate.get(dateStr) || [];

      for (const block of blocks) {
        const freeInSchedule = this.isFreeInRanges(
          freeRangesByWeekday.get(weekday) || [],
          block,
        );
        const item = this.buildPreviewItem({
          dateStr,
          weekday,
          block,
          workshop,
          defaultCapacity,
          closed,
          dayExisting,
          freeInSchedule,
        });
        preview.push(item);
        if (item.status !== "new") continue;

        const slot: Partial<ISlot> = {
          companyCode,
          unitBusiness,
          date: moment(dateStr, "YYYY-MM-DD").utc(true).startOf("day").toDate(),
          timeStart: item.timeStart,
          timeEnd: item.timeEnd,
          // El taller NO se copia acá: se resuelve al leer la disponibilidad
          // (slotService.applyWorkshops), así uno creado después de publicar
          // igual le aplica su precio a este día. Lo que se guarda es lo que
          // eligió el usuario en el formulario.
          kind: "reservation",
          source: "generated",
          workshopId: null,
          // El horario semanal manda sobre el formulario: si la franja está
          // marcada sin seña, se guarda sin seña. Lo del taller NO se copia
          // acá a propósito (ver el comentario de `workshopId` arriba): se
          // resuelve al leer la disponibilidad.
          requiresDeposit: freeInSchedule ? false : block.requiresDeposit,
          depositAmount: freeInSchedule ? 0 : block.depositAmount || 0,
          capacityAdults: block.capacityAdults ?? defaultCapacity.adults,
          capacityChildren: block.capacityChildren ?? defaultCapacity.children,
          status: "open",
          generatedAt,
        };
        toCreate.push(slot);
        // Las franjas que se van creando también cuentan como ocupadas para
        // los bloques siguientes del mismo día.
        dayExisting.push(slot as ISlot);
      }
      existingByDate.set(dateStr, dayExisting);
      cursor.add(1, "day");
    }

    if (!dryRun && toCreate.length) {
      await slotService.insertMany(toCreate);
    }

    return {
      from,
      to,
      dryRun,
      days,
      created: toCreate.length,
      existing: preview.filter((p) => p.status === "exists").length,
      overlapping: preview.filter((p) => p.status === "overlap").length,
      closed: preview.filter((p) => p.status === "closed").length,
      preview,
    };
  }

  /**
   * Rangos "sin seña" del horario semanal, indexados por día de semana
   * (0 = domingo). Se leen una sola vez por corrida: la previsualización se
   * recalcula mientras el usuario configura y esto son 7 consultas como mucho.
   *
   * Si la compañía todavía no tiene horario estructurado guardado, el servicio
   * cae a los configs viejos, que no soportan `free`: en ese caso no hay
   * franjas libres y el generador se comporta como antes.
   */
  private async getFreeRanges(
    companyCode: string,
    weekdays: number[],
  ): Promise<Map<number, { start: number; end: number }[]>> {
    const result = new Map<number, { start: number; end: number }[]>();
    for (const weekday of new Set(weekdays)) {
      const name = WEEKDAY_NAMES[weekday];
      if (!name) continue;
      try {
        const ranges = await weeklyScheduleService.getRangesForDay(
          companyCode,
          name,
        );
        result.set(
          weekday,
          ranges
            .filter((r) => r.free)
            .map((r) => ({ start: r.start, end: r.end })),
        );
      } catch (e) {
        // Sin horario semanal legible no se fuerza nada: manda el formulario.
        result.set(weekday, []);
      }
    }
    return result;
  }

  /**
   * ¿El bloque queda dentro de una franja sin seña? Se pide que entre entero:
   * un bloque que arranca en la franja libre y sigue fuera de ella se cobra,
   * que es el criterio conservador (nunca deja de cobrar por las dudas).
   */
  private isFreeInRanges(
    ranges: { start: number; end: number }[],
    block: GenerateBlock,
  ): boolean {
    if (!ranges.length) return false;
    const start = timeToMinutes(block.timeStart);
    const end = timeToMinutes(block.timeEnd);
    if (Number.isNaN(start) || Number.isNaN(end)) return false;
    return ranges.some((r) => start >= r.start && end <= r.end);
  }

  /** Decide qué pasa con una franja en un día concreto. */
  private buildPreviewItem(ctx: {
    dateStr: string;
    weekday: number;
    block: GenerateBlock;
    workshop: IWorkshop | null;
    defaultCapacity: { adults: number; children: number };
    closed: boolean;
    dayExisting: ISlot[];
    /** La franja cae dentro de un rango "sin seña" del horario semanal. */
    freeInSchedule: boolean;
  }): PreviewItem {
    const {
      dateStr,
      weekday,
      block,
      workshop,
      defaultCapacity,
      closed,
      freeInSchedule,
    } = ctx;
    const start = timeToMinutes(block.timeStart);
    const finish = timeToMinutes(block.timeEnd);

    const base: PreviewItem = {
      date: dateStr,
      weekday,
      timeStart: block.timeStart,
      timeEnd: block.timeEnd,
      status: "new",
      // Precedencia de la seña: un taller siempre cobra lo suyo; después manda
      // el horario semanal, donde se marcan las franjas sin seña; y recién
      // ahí lo elegido en el formulario.
      requiresDeposit: workshop
        ? workshop.requiresDeposit !== false
        : freeInSchedule
          ? false
          : block.requiresDeposit,
      depositAmount: workshop
        ? workshop.depositAmount || workshop.priceChild || 0
        : freeInSchedule
          ? 0
          : block.depositAmount || 0,
      capacityAdults:
        block.capacityAdults ?? workshop?.capacityAdults ?? defaultCapacity.adults,
      capacityChildren:
        block.capacityChildren ??
        workshop?.capacityChildren ??
        defaultCapacity.children,
      isWorkshop: !!workshop,
    };

    if (closed) {
      return { ...base, status: "closed", note: "El local está cerrado" };
    }

    const duplicate = ctx.dayExisting.find(
      (slot) => slot.timeStart === block.timeStart
    );
    if (duplicate) {
      return {
        ...base,
        status: "exists",
        note: `Ya existe la disponibilidad de ${duplicate.timeStart} a ${duplicate.timeEnd}`,
      };
    }

    const collision = ctx.dayExisting.find((slot) =>
      overlaps(start, finish, timeToMinutes(slot.timeStart), timeToMinutes(slot.timeEnd))
    );
    if (collision) {
      return {
        ...base,
        status: "overlap",
        note: `Se superpone con ${collision.timeStart}-${collision.timeEnd}`,
      };
    }

    return base;
  }

  /**
   * Valida la configuración antes de tocar nada. Corta con un error entendible
   * en vez de generar disponibilidad rota a medias.
   */
  private validate(options: GenerateOptions) {
    const { from, to, weekdays, blocks } = options;

    if (!moment(from, "YYYY-MM-DD", true).isValid()) {
      throw new Error("Fecha de inicio inválida. Formato esperado yyyy-MM-dd.");
    }
    if (!moment(to, "YYYY-MM-DD", true).isValid()) {
      throw new Error("Fecha de fin inválida. Formato esperado yyyy-MM-dd.");
    }
    const days = moment(to, "YYYY-MM-DD").diff(moment(from, "YYYY-MM-DD"), "days");
    if (days < 0) {
      throw new Error("La fecha de fin no puede ser anterior a la de inicio.");
    }
    if (days > MAX_GENERATION_DAYS) {
      throw new Error(
        `El rango es de ${days} días. El máximo por corrida es ${MAX_GENERATION_DAYS}.`
      );
    }

    if (!Array.isArray(weekdays) || !weekdays.length) {
      throw new Error("Elegí al menos un día de la semana.");
    }
    if (weekdays.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
      throw new Error("Días de la semana inválidos.");
    }

    if (!Array.isArray(blocks) || !blocks.length) {
      throw new Error("Agregá al menos un horario.");
    }
    for (const block of blocks) {
      if (!TIME_RE.test(block?.timeStart) || !TIME_RE.test(block?.timeEnd)) {
        throw new Error(
          `Horario inválido "${block?.timeStart}-${block?.timeEnd}". Usá HH:mm.`
        );
      }
      if (timeToMinutes(block.timeEnd) <= timeToMinutes(block.timeStart)) {
        throw new Error(
          `En el horario ${block.timeStart}-${block.timeEnd}, el fin debe ser posterior al inicio.`
        );
      }
      if (Number(block.depositAmount ?? 0) < 0) {
        throw new Error("El monto de la seña no puede ser negativo.");
      }
    }

    // Los horarios elegidos no pueden pisarse entre sí: si lo hicieran, el
    // mismo cupo se ofrecería dos veces.
    const sorted = [...blocks].sort(
      (a, b) => timeToMinutes(a.timeStart) - timeToMinutes(b.timeStart)
    );
    for (let i = 1; i < sorted.length; i++) {
      const previous = sorted[i - 1];
      const current = sorted[i];
      if (timeToMinutes(current.timeStart) < timeToMinutes(previous.timeEnd)) {
        throw new Error(
          `Los horarios ${previous.timeStart}-${previous.timeEnd} y ${current.timeStart}-${current.timeEnd} se superponen.`
        );
      }
    }
  }

  /**
   * Fechas totalmente cerradas de la compañía (excepciones de día completo y
   * el config legacy `closedDates`), en una sola consulta.
   */
  private async getClosedDates(companyCode: string): Promise<string[]> {
    try {
      return await scheduleExceptionService.getClosedDates(companyCode);
    } catch (e) {
      // Ante una falla de lectura no bloqueamos la generación.
      return [];
    }
  }
}

export const slotGeneratorService = new SlotGeneratorService();
export default slotGeneratorService;

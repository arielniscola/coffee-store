import moment from "moment";
import Log from "../libs/logger";
import { IRouteController } from "../routes/index";
import { ISlot } from "../models/slot";
import slotService from "../services/slot";
import slotGeneratorService, {
  GenerateBlock,
} from "../services/slotGenerator";
import { timeToMinutes } from "../services/scheduleException";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Normaliza los horarios que manda el formulario. */
function parseBlocks(raw: any): GenerateBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((block: any) => ({
    timeStart: String(block?.timeStart || ""),
    timeEnd: String(block?.timeEnd || ""),
    requiresDeposit: block?.requiresDeposit !== false,
    depositAmount: Number(block?.depositAmount || 0),
    capacityAdults:
      block?.capacityAdults === "" || block?.capacityAdults == null
        ? null
        : Number(block.capacityAdults),
    capacityChildren:
      block?.capacityChildren === "" || block?.capacityChildren == null
        ? null
        : Number(block.capacityChildren),
  }));
}

export class SlotController {
  /**
   * Genera la disponibilidad para reservar: días de la semana + rango de
   * fechas + los horarios de cada día. No crea reservas.
   *
   * Con `dryRun=true` devuelve la previsualización (qué se va a crear, qué ya
   * existe, qué se superpone y qué días están cerrados) sin escribir nada.
   */
  static generate: IRouteController = async (req, res) => {
    const logger = new Log(res.locals.requestId, "SlotController.generate");
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const result = await slotGeneratorService.generate({
        companyCode,
        from: String(req.body.from || moment().format("YYYY-MM-DD")),
        to: String(req.body.to || ""),
        weekdays: (Array.isArray(req.body.weekdays)
          ? req.body.weekdays
          : []
        ).map(Number),
        blocks: parseBlocks(req.body.blocks),
        unitBusiness: String(req.body.unitBusiness || ""),
        dryRun: req.body.dryRun === true,
      });
      return res.status(200).json({
        ack: 0,
        message: result.dryRun
          ? "Previsualización lista"
          : `Se generaron ${result.created} disponibilidades.`,
        data: result,
      });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  /**
   * Disponibilidad de un día con la ocupación calculada en vivo. Es la vista
   * de gestión: incluye las cerradas, para poder reabrirlas.
   */
  static findByDate: IRouteController<
    {},
    {},
    {},
    { date: string; unitBusiness: string }
  > = async (req, res) => {
    const logger = new Log(res.locals.requestId, "SlotController.findByDate");
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const date = req.query.date || moment().format("YYYY-MM-DD");
      const unitBusiness = req.query.unitBusiness || undefined;
      const slots = await slotService.applyWorkshops(
        companyCode,
        await slotService.findByDate(companyCode, date, unitBusiness)
      );
      const occupancy = await slotService.getOccupancyMap(
        companyCode,
        date,
        date,
        unitBusiness
      );
      return res.status(200).json({
        ack: 0,
        data: slotService.withAvailability(slots, occupancy),
      });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  /**
   * Resumen por día de un rango: cuántas disponibilidades hay, cuántas son de
   * taller, sin seña o cerradas. Sirve para saber hasta dónde llega la agenda.
   */
  static summary: IRouteController<
    {},
    {},
    {},
    { from: string; to: string; unitBusiness: string }
  > = async (req, res) => {
    const logger = new Log(res.locals.requestId, "SlotController.summary");
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const from = req.query.from || moment().format("YYYY-MM-DD");
      const to = req.query.to || moment().add(60, "days").format("YYYY-MM-DD");
      const slots = await slotService.applyWorkshops(
        companyCode,
        await slotService.findInRange(
          companyCode,
          from,
          to,
          req.query.unitBusiness || undefined
        )
      );
      const byDate = new Map<string, any>();
      for (const slot of slots) {
        const key = moment(slot.date).utc().format("YYYY-MM-DD");
        const entry = byDate.get(key) || {
          date: key,
          total: 0,
          workshop: 0,
          withoutDeposit: 0,
          closed: 0,
        };
        entry.total++;
        if (slot.kind === "workshop") entry.workshop++;
        if (!slot.requiresDeposit) entry.withoutDeposit++;
        if (slot.status === "closed") entry.closed++;
        byDate.set(key, entry);
      }
      const days = Array.from(byDate.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      return res.status(200).json({
        ack: 0,
        data: {
          from,
          to,
          days,
          /** Último día con disponibilidad: hasta acá se puede reservar. */
          horizon: days.length ? days[days.length - 1].date : null,
          total: slots.length,
        },
      });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  /**
   * Endpoint público: las fechas del rango que todavía tienen lugar para
   * reservar. Lo usa el calendario del modal de reservas para no dejar elegir
   * un día sin horarios.
   *
   * Una fecha entra solo si tiene al menos un horario abierto con lugares
   * libres: un día enteramente vendido no es una fecha reservable.
   *
   * `enforced` es la clave para no romper a quien todavía no generó su agenda:
   * si en todo el rango no hay ni un horario publicado, la compañía sigue
   * resolviendo la disponibilidad con el horario semanal y el front no debe
   * bloquear ninguna fecha.
   */
  static availableDates: IRouteController<
    {},
    {},
    {},
    { from: string; to: string; unitBusiness: string }
  > = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "SlotController.availableDates"
    );
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const from = req.query.from || moment().format("YYYY-MM-DD");
      const to = req.query.to || moment().add(120, "days").format("YYYY-MM-DD");
      const unitBusiness = req.query.unitBusiness || undefined;

      const slots = await slotService.findInRange(
        companyCode,
        from,
        to,
        unitBusiness
      );
      if (!slots.length) {
        return res
          .status(200)
          .json({ ack: 0, data: { enforced: false, dates: [] } });
      }

      const occupancy = await slotService.getOccupancyMap(
        companyCode,
        from,
        to,
        unitBusiness
      );
      const dates = new Set<string>();
      for (const slot of slotService.withAvailability(slots, occupancy)) {
        if (slot.status !== "open" || slot.availables <= 0) continue;
        dates.add(moment(slot.date).utc().format("YYYY-MM-DD"));
      }

      return res.status(200).json({
        ack: 0,
        data: { enforced: true, dates: Array.from(dates).sort() },
      });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  /**
   * Edita una disponibilidad puntual (horario de fin, seña, capacidad).
   * No permite dejar la capacidad por debajo de lo ya reservado.
   */
  static update: IRouteController<{ id: string }> = async (req, res) => {
    const logger = new Log(res.locals.requestId, "SlotController.update");
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const id = req.params.id;
      if (!slotService.validateId(id)) throw new Error("ID no válido");
      const slot = await slotService.findOne({ _id: id, companyCode });
      if (!slot) throw new Error("Disponibilidad no encontrada");

      const changes: Partial<ISlot> = { source: "manual" };

      if (req.body.timeEnd != null) {
        if (!TIME_RE.test(String(req.body.timeEnd))) {
          throw new Error("Hora de fin inválida. Usá HH:mm.");
        }
        if (timeToMinutes(req.body.timeEnd) <= timeToMinutes(slot.timeStart)) {
          throw new Error("La hora de fin debe ser posterior a la de inicio.");
        }
        changes.timeEnd = String(req.body.timeEnd);
      }
      if (req.body.requiresDeposit != null) {
        changes.requiresDeposit = req.body.requiresDeposit === true;
      }
      if (req.body.depositAmount != null) {
        const amount = Number(req.body.depositAmount);
        if (Number.isNaN(amount) || amount < 0) {
          throw new Error("El monto de la seña debe ser mayor o igual a 0.");
        }
        changes.depositAmount = amount;
      }

      const taken = await this.getOccupancy(companyCode, slot);
      if (req.body.capacityAdults != null) {
        const value = Number(req.body.capacityAdults);
        if (Number.isNaN(value) || value < 0) {
          throw new Error("La capacidad de adultos debe ser un número válido.");
        }
        if (value < taken.adults) {
          throw new Error(
            `No se puede bajar a ${value}: ya hay ${taken.adults} adultos reservados en ese horario.`
          );
        }
        changes.capacityAdults = value;
      }
      if (req.body.capacityChildren != null) {
        const value = Number(req.body.capacityChildren);
        if (Number.isNaN(value) || value < 0) {
          throw new Error("La capacidad de niños debe ser un número válido.");
        }
        if (value < taken.children) {
          throw new Error(
            `No se puede bajar a ${value}: ya hay ${taken.children} niños reservados en ese horario.`
          );
        }
        changes.capacityChildren = value;
      }

      const updated = await slotService.findOneAndUpdate(
        { _id: id, companyCode },
        changes
      );
      return res
        .status(200)
        .json({ ack: 0, message: "Disponibilidad actualizada", data: updated });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  /**
   * Abre o cierra una disponibilidad. Cerrar no cancela las reservas que ya
   * tenga: solo impide que entren nuevas, así se puede cerrar un horario ya
   * vendido y avisarle a la gente aparte.
   */
  static setStatus: IRouteController<{ id: string }> = async (req, res) => {
    const logger = new Log(res.locals.requestId, "SlotController.setStatus");
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const id = req.params.id;
      if (!slotService.validateId(id)) throw new Error("ID no válido");
      const status = String(req.body.status || "");
      if (status !== "open" && status !== "closed") {
        throw new Error('El estado debe ser "open" o "closed".');
      }
      const updated = await slotService.findOneAndUpdate(
        { _id: id, companyCode },
        {
          status,
          closedReason:
            status === "closed"
              ? String(req.body.reason || "Cerrada manualmente")
              : "",
          source: "manual",
        }
      );
      if (!updated) throw new Error("Disponibilidad no encontrada");
      return res.status(200).json({
        ack: 0,
        message:
          status === "closed"
            ? "Disponibilidad cerrada"
            : "Disponibilidad reabierta",
        data: updated,
      });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  /** Alta manual de una disponibilidad suelta, fuera de una generación. */
  static create: IRouteController = async (req, res) => {
    const logger = new Log(res.locals.requestId, "SlotController.create");
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const dateStr = String(req.body.date || "").split("T")[0];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        throw new Error("Fecha inválida. Formato esperado yyyy-MM-dd.");
      }
      const timeStart = String(req.body.timeStart || "");
      const timeEnd = String(req.body.timeEnd || "");
      if (!TIME_RE.test(timeStart) || !TIME_RE.test(timeEnd)) {
        throw new Error("Horario inválido. Usá HH:mm.");
      }
      if (timeToMinutes(timeEnd) <= timeToMinutes(timeStart)) {
        throw new Error("La hora de fin debe ser posterior a la de inicio.");
      }
      const unitBusiness = String(req.body.unitBusiness || "");

      // Misma validación de superposición que aplica el generador.
      const sameDay = await slotService.findByDate(
        companyCode,
        dateStr,
        unitBusiness || undefined
      );
      const start = timeToMinutes(timeStart);
      const finish = timeToMinutes(timeEnd);
      const collision = sameDay.find(
        (slot) =>
          start < timeToMinutes(slot.timeEnd) &&
          timeToMinutes(slot.timeStart) < finish
      );
      if (collision) {
        throw new Error(
          `Se superpone con la disponibilidad de ${collision.timeStart} a ${collision.timeEnd}.`
        );
      }

      const depositAmount = Number(req.body.depositAmount || 0);
      if (depositAmount < 0) {
        throw new Error("El monto de la seña no puede ser negativo.");
      }

      const created = await slotService.insertOne({
        companyCode,
        unitBusiness,
        date: moment(dateStr, "YYYY-MM-DD").utc(true).startOf("day").toDate(),
        timeStart,
        timeEnd,
        kind: "reservation",
        source: "manual",
        requiresDeposit: req.body.requiresDeposit !== false,
        depositAmount,
        capacityAdults: Number(req.body.capacityAdults || 0),
        capacityChildren: Number(req.body.capacityChildren || 0),
        status: "open",
        generatedAt: new Date(),
      });
      return res
        .status(200)
        .json({ ack: 0, message: "Disponibilidad creada", data: created });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  /** Elimina una disponibilidad. Se niega si ya tiene reservas vigentes. */
  static delete: IRouteController<{ id: string }> = async (req, res) => {
    const logger = new Log(res.locals.requestId, "SlotController.delete");
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const id = req.params.id;
      if (!slotService.validateId(id)) throw new Error("ID no válido");
      const slot = await slotService.findOne({ _id: id, companyCode });
      if (!slot) throw new Error("Disponibilidad no encontrada");

      const taken = await this.getOccupancy(companyCode, slot);
      if (taken.adults > 0 || taken.children > 0) {
        throw new Error(
          "Ese horario ya tiene reservas: cerralo en vez de eliminarlo."
        );
      }

      await slotService.deleteOne({ _id: id, companyCode });
      return res
        .status(200)
        .json({ ack: 0, message: "Disponibilidad eliminada" });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  /**
   * Elimina varias disponibilidades seleccionadas. Las que tienen reservas no
   * se borran y vuelven en `blocked` con el motivo, para poder mostrar qué
   * quedó afuera en vez de fallar toda la operación.
   */
  static deleteMany: IRouteController = async (req, res) => {
    const logger = new Log(res.locals.requestId, "SlotController.deleteMany");
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const ids: string[] = (Array.isArray(req.body.ids) ? req.body.ids : [])
        .map(String)
        .filter((id: string) => slotService.validateId(id));
      if (!ids.length) {
        throw new Error("No se seleccionó ninguna disponibilidad.");
      }

      const slots = await slotService.find({ _id: { $in: ids }, companyCode });
      const deletable: string[] = [];
      const blocked: { timeStart: string; reason: string }[] = [];
      for (const slot of slots) {
        const taken = await this.getOccupancy(companyCode, slot);
        if (taken.adults > 0 || taken.children > 0) {
          blocked.push({
            timeStart: slot.timeStart,
            reason: `tiene ${taken.adults + taken.children} lugar(es) reservado(s)`,
          });
          continue;
        }
        deletable.push(String(slot._id));
      }
      if (deletable.length) {
        await slotService.deleteMany({ _id: { $in: deletable }, companyCode });
      }
      return res.status(200).json({
        ack: 0,
        message: blocked.length
          ? `Se eliminaron ${deletable.length}. ${blocked.length} con reservas no se tocaron.`
          : `Se eliminaron ${deletable.length} disponibilidades.`,
        data: { deleted: deletable.length, blocked },
      });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  /** Lugares ya reservados en el horario de una disponibilidad. */
  private static async getOccupancy(companyCode: string, slot: ISlot) {
    const dateStr = moment(slot.date).utc().format("YYYY-MM-DD");
    const occupancy = await slotService.getOccupancyMap(
      companyCode,
      dateStr,
      dateStr,
      slot.unitBusiness || undefined
    );
    return (
      occupancy.get(
        `${slot.unitBusiness || ""}|${dateStr}|${slot.timeStart}`
      ) || { adults: 0, children: 0 }
    );
  }
}

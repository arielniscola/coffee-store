import moment from "moment";
import { Service } from ".";
import { ISlot, SlotModel } from "../models/slot";
import { IShift } from "../models/shift";
import { shiftService } from "./shift";
import workshopService from "./workshop";

/** Ocupación de un turno: cuántos lugares ya están tomados. */
export interface SlotOccupancy {
  adults: number;
  children: number;
}

/** Slot + disponibilidad calculada en vivo contra las reservas. */
export interface SlotAvailability extends ISlot {
  occupiedAdults: number;
  occupiedChildren: number;
  availablesAdults: number;
  availablesChildren: number;
  availables: number;
}

/** Clave de identidad de un slot dentro de una compañía. */
export const slotKey = (
  unitBusiness: string,
  dateStr: string,
  timeStart: string
) => `${unitBusiness || ""}|${dateStr}|${timeStart}`;

export class SlotService extends Service<ISlot> {
  constructor() {
    super(SlotModel);
  }

  /** Slots de un día (yyyy-MM-dd), ordenados por hora. */
  async findByDate(
    companyCode: string,
    dateStr: string,
    unitBusiness?: string
  ) {
    const dayStart = moment(dateStr, "YYYY-MM-DD").utc(true).startOf("day");
    const dayEnd = moment(dateStr, "YYYY-MM-DD").utc(true).endOf("day");
    return await this.find(
      {
        companyCode,
        date: { $gte: dayStart.toDate(), $lte: dayEnd.toDate() },
        ...(unitBusiness ? { unitBusiness } : {}),
      },
      {},
      { sort: { timeStart: 1 } }
    );
  }

  /** Slots de un rango de días [from, to] (yyyy-MM-dd). */
  async findInRange(
    companyCode: string,
    from: string,
    to: string,
    unitBusiness?: string
  ) {
    const rangeStart = moment(from, "YYYY-MM-DD").utc(true).startOf("day");
    const rangeEnd = moment(to, "YYYY-MM-DD").utc(true).endOf("day");
    return await this.find(
      {
        companyCode,
        date: { $gte: rangeStart.toDate(), $lte: rangeEnd.toDate() },
        ...(unitBusiness ? { unitBusiness } : {}),
      },
      {},
      { sort: { date: 1, timeStart: 1 } }
    );
  }

  /**
   * Reservas vigentes de un rango de días, indexadas por clave de slot. Se
   * excluyen las canceladas y las pendientes de pago ya vencidas, igual que
   * hace el endpoint de disponibilidad.
   */
  async getOccupancyMap(
    companyCode: string,
    from: string,
    to: string,
    unitBusiness?: string
  ): Promise<Map<string, SlotOccupancy>> {
    const rangeStart = moment(from, "YYYY-MM-DD").utc(true).startOf("day");
    const rangeEnd = moment(to, "YYYY-MM-DD").utc(true).endOf("day");
    const shifts = await shiftService.find({
      companyCode,
      status: { $ne: "cancelled" },
      $nor: [
        { status: "pendingPayment", paymentExpiresAt: { $lt: new Date() } },
      ],
      date: { $gte: rangeStart.toDate(), $lte: rangeEnd.toDate() },
      ...(unitBusiness ? { unitBusiness } : {}),
    });

    const map = new Map<string, SlotOccupancy>();
    for (const shift of shifts as IShift[]) {
      const key = slotKey(
        shift.unitBusiness || "",
        moment(shift.date).utc().format("YYYY-MM-DD"),
        shift.timeStart
      );
      const current = map.get(key) || { adults: 0, children: 0 };
      const adults = shift.adultsQty || 0;
      const children = shift.childrenQty || 0;
      // Las reservas viejas (y las cargadas por API sin desglosar) traen solo
      // `peopleQty`. Sin este respaldo daban ocupación cero: el horario se
      // veía libre y se podía borrar con la reserva adentro. Se cuentan como
      // adultos, la misma convención que usa el calendario de turnos.
      const undetailed = adults + children === 0 ? shift.peopleQty || 0 : 0;
      current.adults += adults + undetailed;
      current.children += children;
      map.set(key, current);
    }
    return map;
  }

  /**
   * Aplica los talleres vigentes sobre la disponibilidad leída.
   *
   * El taller es la fuente de verdad de su día y NO se copia dentro del slot
   * al generarlo: un taller creado, editado o desactivado después de publicar
   * la agenda dejaría esa copia desactualizada, y como el generador es
   * aditivo, regenerar el rango tampoco la corregiría. Por eso se resuelve en
   * cada lectura, igual que la ocupación.
   */
  async applyWorkshops<T extends ISlot>(
    companyCode: string,
    slots: T[]
  ): Promise<T[]> {
    if (!slots.length) return slots;
    const dates = slots
      .map((slot) => moment(slot.date).utc().format("YYYY-MM-DD"))
      .sort();
    const workshops = await workshopService.findActiveInRange(
      companyCode,
      dates[0],
      dates[dates.length - 1]
    );
    if (!workshops.length) return slots;

    const byDate = new Map(
      workshops.map((workshop) => [
        moment(workshop.date).utc().format("YYYY-MM-DD"),
        workshop,
      ])
    );
    return slots.map((slot) => {
      const workshop = byDate.get(
        moment(slot.date).utc().format("YYYY-MM-DD")
      );
      if (!workshop) return slot;
      return {
        ...slot,
        kind: "workshop",
        workshopId: String(workshop._id),
        requiresDeposit: workshop.requiresDeposit !== false,
        depositAmount: workshop.depositAmount || workshop.priceChild || 0,
        capacityAdults: workshop.capacityAdults ?? slot.capacityAdults,
        capacityChildren: workshop.capacityChildren ?? slot.capacityChildren,
      };
    });
  }

  /**
   * Combina slots con su ocupación. Los slots cerrados se devuelven con cero
   * disponibilidad para que el front pueda mostrarlos igual (deshabilitados)
   * en vez de hacerlos desaparecer.
   */
  withAvailability(
    slots: ISlot[],
    occupancy: Map<string, SlotOccupancy>
  ): SlotAvailability[] {
    return slots.map((slot) => {
      const key = slotKey(
        slot.unitBusiness || "",
        moment(slot.date).utc().format("YYYY-MM-DD"),
        slot.timeStart
      );
      const taken = occupancy.get(key) || { adults: 0, children: 0 };
      const closed = slot.status === "closed";
      const availablesAdults = closed
        ? 0
        : Math.max(0, slot.capacityAdults - taken.adults);
      const availablesChildren = closed
        ? 0
        : Math.max(0, slot.capacityChildren - taken.children);
      return {
        ...slot,
        occupiedAdults: taken.adults,
        occupiedChildren: taken.children,
        availablesAdults,
        availablesChildren,
        availables: availablesAdults + availablesChildren,
      };
    });
  }
}

export const slotService = new SlotService();
export default slotService;

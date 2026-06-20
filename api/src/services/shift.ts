import { Document, Filter, insertManyOptions, Service, Update } from ".";
import { IShift, ShiftModel } from "../models/shift";
import { tableService } from "./table";
import configService from "./config";

export interface SlotCapacity {
  adults: number;
  children: number;
}

export class ShiftService extends Service<IShift> {
  constructor() {
    super(ShiftModel);
  }

  /**
   * Calcula la capacidad de adultos y niños por turno para una compañía.
   * Según el config `capacityMode`:
   *  - "manual": usa los máximos `maxAdults` y `maxChildren`.
   *  - "tables" (por defecto): suma la capacidad de adultos y de niños de las
   *    mesas activas. Para mesas viejas sin capacidad diferenciada, se usa el
   *    campo legacy `capacity` como capacidad de adultos.
   */
  async getCapacity(
    companyCode: string,
    unitBusiness?: string
  ): Promise<SlotCapacity> {
    let mode = "tables";
    try {
      mode = String(
        (await configService.getValue("capacityMode", companyCode)) || "tables"
      );
    } catch (e) {
      mode = "tables";
    }

    if (mode === "manual") {
      let adults = 0;
      let children = 0;
      try {
        adults = Number(await configService.getValue("maxAdults", companyCode)) || 0;
      } catch (e) {}
      try {
        children =
          Number(await configService.getValue("maxChildren", companyCode)) || 0;
      } catch (e) {}
      return { adults, children };
    }

    const tables = await tableService.find({
      companyCode,
      ...(unitBusiness ? { unitBusiness } : {}),
      active: true,
    });
    let adults = 0;
    let children = 0;
    for (const t of tables) {
      const a = t.adultCapacity ?? 0;
      const c = t.childrenCapacity ?? 0;
      // Compatibilidad: mesa vieja sin capacidad diferenciada → capacity = adultos.
      if (a === 0 && c === 0 && (t.capacity || 0) > 0) {
        adults += t.capacity;
      } else {
        adults += a;
        children += c;
      }
    }
    return { adults, children };
  }
  async insertOne(
    data: Partial<IShift>,
    options?: insertManyOptions
  ): Promise<Document<IShift>> {
    try {
      const isValid = await this.validatedShift(data);
      if (!isValid) throw new Error("Turno no disponible");
      return await super.insertOne(data);
    } catch (e) {
      throw e;
    }
  }
  async updateOne(
    filterOrData: IShift | Filter<IShift>,
    update?: Update<IShift>,
    options?: insertManyOptions
  ): Promise<Document<IShift>> {
    try {
      // Si el segundo argumento existe, es la firma (filter, update) — actualización parcial sin validación de cupo
      if (update !== undefined) {
        return (await ShiftModel.updateOne(
          filterOrData as Filter<IShift>,
          update as any
        )) as unknown as Document<IShift>;
      }
      // Firma legacy: (data) → toma _id como filtro y revalida cupo
      const data = filterOrData as IShift;
      const isValid = await this.validatedShift(data);
      if (!isValid) throw new Error("Turno no disponible");
      return await super.updateOne({ _id: data._id }, data);
    } catch (e) {
      throw e;
    }
  }

  /**
   * Devuelve los shifts en pendingPayment de una compañía (no vencidos).
   */
  async findPendingPayments(companyCode: string) {
    return await super.find({
      companyCode,
      status: "pendingPayment",
    });
  }

  /**
   * Libera reservas en estado pendingPayment cuyo paymentExpiresAt ya pasó.
   * Las marca como cancelled para que su cupo vuelva a estar disponible.
   */
  async releaseExpiredPending(companyCode: string) {
    const now = new Date();
    return ShiftModel.updateMany(
      {
        companyCode,
        status: "pendingPayment",
        paymentExpiresAt: { $lt: now },
      },
      { status: "cancelled" },
    );
  }

  async validatedShift(shift: Partial<IShift>) {
    try {
      const shiftsFounded = await super.find(
        {
          date: shift.date,
          unitBusiness: shift.unitBusiness,
          companyCode: shift.companyCode,
          timeStart: shift.timeStart,
          status: { $ne: "cancelled" },
        },
        {},
        { lean: true }
      );
      /** Capacidad diferenciada de adultos y niños según el modo configurado */
      const capacity = await this.getCapacity(
        shift.companyCode,
        shift.unitBusiness
      );
      /** Ocupación actual del turno, excluyendo la propia reserva si es update */
      let occupiedAdults = 0;
      let occupiedChildren = 0;
      for (const s of shiftsFounded) {
        if (shift._id && String(s._id) === String(shift._id)) continue;
        occupiedAdults += s.adultsQty || 0;
        occupiedChildren += s.childrenQty || 0;
      }
      const newAdults = shift.adultsQty || 0;
      const newChildren = shift.childrenQty || 0;
      /** Los límites de adultos y niños son independientes */
      if (occupiedAdults + newAdults > capacity.adults) return false;
      if (occupiedChildren + newChildren > capacity.children) return false;
      return true;
    } catch (e) {
      throw e;
    }
  }
}

export const shiftService = new ShiftService();

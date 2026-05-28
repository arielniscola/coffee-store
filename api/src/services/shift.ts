import { Document, Filter, insertManyOptions, Service, Update } from ".";
import { IShift, ShiftModel } from "../models/shift";
import { tableService } from "./table";

export class ShiftService extends Service<IShift> {
  constructor() {
    super(ShiftModel);
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
      /** Validar que queden lugares disponibles */
      const tables = await tableService.find({
        companyCode: shift.companyCode,
        unitBusiness: shift.unitBusiness,
        active: true,
      });
      /** Si es un turno que esta dentro del horario devolver true */
      const isUpdate = shiftsFounded.find((s) => s._id == shift._id);
      if (isUpdate) return true;
      let availablePlaces = 0;
      tables.map((t) => (availablePlaces += t.capacity));
      let ocupationsPlaces = 0;
      shiftsFounded.map((s) => (ocupationsPlaces += s.peopleQty));
      if (availablePlaces <= ocupationsPlaces) return false;
      return true;
    } catch (e) {
      throw e;
    }
  }
}

export const shiftService = new ShiftService();

import { ObjectId } from "mongoose";
import { Document, insertManyOptions, Service } from ".";
import { IShift, ShiftModel } from "../models/shift";

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
    data: IShift,
    options?: insertManyOptions
  ): Promise<Document<IShift>> {
    try {
      const isValid = await this.validatedShift(data);
      if (!isValid) throw new Error("Turno no disponible");
      return await super.updateOne({ _id: data._id }, data);
    } catch (e) {
      throw e;
    }
  }

  private async validatedShift(shift: Partial<IShift>) {
    try {
      /** Validar si el turno ya se encuentra ocupado */
      const shiftFounded = await super.findOne(
        {
          date: shift.date,
          unitBusiness: shift.unitBusiness,
          tableNumber: shift.tableNumber,
          companyCode: shift.companyCode,
          $or: [
            {
              // Caso 1: El nuevo turno comienza dentro de un turno existente
              timeStart: { $lt: shift.timeEnd },
              timeEnd: { $gt: shift.timeStart },
            },
            {
              // Caso 2: El nuevo turno contiene completamente un turno existente
              timeStart: { $gte: shift.timeStart },
              timeEnd: { $lte: shift.timeEnd },
            },
            {
              // Caso 3: El nuevo turno es contenido por un turno existente
              timeStart: { $lte: shift.timeStart },
              timeEnd: { $gte: shift.timeEnd },
            },
          ],
        },
        {},
        { lean: true }
      );
      /** Si el turno que encuentra es el que se esta mofificando devolver true */
      if (shift._id && shiftFounded?._id.toString() === shift._id) return true;
      if (shiftFounded) return false;
      return true;
    } catch (e) {
      throw e;
    }
  }
}

export const shiftService = new ShiftService();

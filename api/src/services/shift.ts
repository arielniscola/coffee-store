import { ObjectId } from "mongoose";
import { Document, insertManyOptions, Service } from ".";
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
      const shiftsFounded = await super.find(
        {
          date: shift.date,
          unitBusiness: shift.unitBusiness,
          companyCode: shift.companyCode,
          timeStart: shift.timeStart,
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

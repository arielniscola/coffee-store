import { Service } from ".";
import { IUnitBusiness, UnitBusinessModel } from "../models/unitBusiness";

export class UnitBusinessService extends Service<IUnitBusiness> {
  constructor() {
    super(UnitBusinessModel);
  }
}

export const unitBusinessService = new UnitBusinessService();

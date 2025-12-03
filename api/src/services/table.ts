import { Service } from ".";
import { ITable, TableModel } from "../models/table";

export class ShiftService extends Service<ITable> {
  constructor() {
    super(TableModel);
  }
}

export const tableService = new ShiftService();

import { createModel, createSchema } from ".";

export interface ITable {
  _id?: string;
  number: number;
  /** Capacidad total (adultos + niños). Se mantiene por compatibilidad. */
  capacity: number;
  /** Capacidad de adultos de la mesa */
  adultCapacity?: number;
  /** Capacidad de niños de la mesa */
  childrenCapacity?: number;
  description?: string;
  unitBusiness: string;
  companyCode: string;
  active?: boolean;
}

export const TableSchema = createSchema<ITable>({
  number: {
    type: Number,
    required: true,
  },
  capacity: {
    type: Number,
    required: false,
    default: 0,
  },
  adultCapacity: {
    type: Number,
    required: false,
    default: 0,
  },
  childrenCapacity: {
    type: Number,
    required: false,
    default: 0,
  },
  description: {
    type: String,
    required: false,
  },
  unitBusiness: {
    type: String,
    required: true,
  },
  companyCode: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    required: false,
    default: true,
  },
});

export const TableModel = createModel("table", TableSchema);

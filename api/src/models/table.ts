import { Table } from "lucide-react";
import { createModel, createSchema } from ".";

export interface ITable {
  _id?: string;
  number: number;
  capacity: number;
  description?: string;
  unitBusiness: string;
  companyCode: string;
}

export const TableSchema = createSchema<ITable>({
  number: {
    type: Number,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
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
});

export const TableModel = createModel("table", TableSchema);

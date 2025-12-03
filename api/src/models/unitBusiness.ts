import { createModel, createSchema } from ".";

export interface IUnitBusiness {
  _id?: string;
  companyCode: string;
  description: string;
  code: string;
  name: string;
  active: boolean;
}

export const UnitBusinessSchema = createSchema<IUnitBusiness>({
  code: {
    type: String,
    required: true,
  },
  companyCode: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  active: {
    type: Boolean,
    required: true,
    default: true,
  },
});

export const UnitBusinessModel = createModel(
  "unitBusiness",
  UnitBusinessSchema
);

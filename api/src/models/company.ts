import { createModel, createSchema } from ".";

export interface ICompany {
  code: string;
  companyName: string;
  direction: string;
  companyNumber: string;
  type: string;
  cellphone: string;
  active: boolean;
}

const CompanySchema = createSchema<ICompany>({
  code: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  direction: {
    type: String,
    required: false,
  },
  companyNumber: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  cellphone: {
    type: String,
    required: false,
  },
  active: {
    type: Boolean,
    required: true,
    default: true,
  },
});

export const CompanyModel = createModel("company", CompanySchema);

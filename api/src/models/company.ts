import { createModel, createSchema } from ".";

export interface ICompany {
  code: string;
  companyName: string;
  address: string;
  email: string;
  companyNumber: string;
  type: string;
  cellphone: string;
  active: boolean;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  alias?: string;
  cuit?: string;
  accountName?: string;
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
  address: {
    type: String,
    required: false,
  },
  email: {
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
  instagram: {
    type: String,
    required: false,
  },
  facebook: {
    type: String,
    required: false,
  },
  twitter: {
    type: String,
    required: false,
  },
  alias: {
    type: String,
    required: false,
  },
  accountName: {
    type: String,
    required: false,
  },
  cuit: {
    type: String,
    required: false,
  },
});

export const CompanyModel = createModel("company", CompanySchema);

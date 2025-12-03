import { createModel, createSchema } from ".";

export interface IPaymentMethod {
  _id: string;
  companyCode: string;
  name: string;
  description: string;
  identificationNumber: string;
  alias: string;
  colorBanner: string;
}

export const PaymentMethodSchema = createSchema<IPaymentMethod>(
  {
    companyCode: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    identificationNumber: {
      type: String,
      required: false,
    },
    alias: {
      type: String,
      required: false,
    },
    colorBanner: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: false,
  }
);

export const PaymentMethodModel = createModel(
  "paymentMethod",
  PaymentMethodSchema
);

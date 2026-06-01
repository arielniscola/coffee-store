import { createModel, createSchema } from ".";

export interface IShift {
  _id?: string;
  companyCode: string;
  date: Date;
  timeStart: string;
  timeEnd: string;
  status: string;
  notificated: boolean;
  description: string;
  client: string;
  unitBusiness: string;
  tableNumber?: string;
  peopleQty?: number;
  adultsQty?: number;
  childrenQty?: number;
  email: string;
  phoneNumber: string;
  price?: number;
  paymentId?: string;
  preferenceId?: string;
  paymentStatus?: string;
  paymentLink?: string;
  paidAt?: Date;
  paymentExpiresAt?: Date;
  confirmationEmailSentAt?: string;
}

export const ShiftSchema = createSchema<IShift>({
  companyCode: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  timeStart: {
    type: String,
    required: true,
  },
  timeEnd: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  notificated: {
    type: Boolean,
    required: true,
    default: false,
  },
  client: {
    type: String,
    required: false,
  },
  unitBusiness: {
    type: String,
    required: true,
  },
  tableNumber: {
    type: String,
    required: false,
  },
  peopleQty: {
    type: Number,
    required: false,
  },
  adultsQty: {
    type: Number,
    required: false,
  },
  childrenQty: {
    type: Number,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: false,
    default: 0,
  },
  paymentId: { type: String, required: false },
  preferenceId: { type: String, required: false },
  paymentStatus: { type: String, required: false },
  paymentLink: { type: String, required: false },
  paidAt: { type: Date, required: false },
  paymentExpiresAt: { type: Date, required: false },
  confirmationEmailSentAt: { type: String, required: false },
});

export const ShiftModel = createModel("shift", ShiftSchema);

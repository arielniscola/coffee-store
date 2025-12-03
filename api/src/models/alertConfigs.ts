import { createSchema } from ".";

export interface IAlertConfigBase {
  code: string;
  name: string;
  value: string;
  priority: string;
  isGroup: boolean;
}
export interface IAlertConfig extends IAlertConfigBase {
  companyCode: string;
  active: boolean;
}

export const AlertConfigSchema = createSchema<IAlertConfig>(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    companyCode: { type: String, required: true },
    active: { type: Boolean, default: true },
    value: { type: String, required: true },
    priority: {
      type: String,
      enum: ["now", "scheduled"],
      required: true,
    },
    isGroup: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

AlertConfigSchema.index({ companyCode: 1, code: 1 }, { unique: true });

import { createModel, createSchema } from ".";

export interface IProcessStatus {
  code: string;
  name: string;
  status: string;
}
export const ProcessStatusSchema = createSchema<IProcessStatus>(
  {
    code: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ProcessStatusSchema.index({ code: 1 }, { unique: true });

export const ProcessStatusModel = createModel<IProcessStatus>(
  "ProcessStatus",
  ProcessStatusSchema
);

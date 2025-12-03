import { createModel, createSchema } from ".";

export interface ICoreProcessRun {
  code: string;
  name: string;
  status: string;
  notes: string;
}

export const ProcessRunSchema = createSchema<ICoreProcessRun>(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: String, enum: ["ok", "error"] },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

export const ProcessRunModel = createModel<ICoreProcessRun>(
  "ProcessRun",
  ProcessRunSchema
);

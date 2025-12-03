import { createModel, createSchema } from ".";

export interface IConfig {
  code: string;
  type: string;
  name: string;
  description?: string;
  dataType: string;
  value: string | number | boolean;
  companyCode: string;
}

/** Esquema del Modelo Configuracion */
const ConfigSchema = createSchema<IConfig>(
  {
    code: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    dataType: {
      type: String,
      enum: ["string", "number", "boolean"],
      default: "string",
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    value: {
      type: String || Number || Boolean,
      required: true,
    },
    companyCode: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

/** Solo permitir una configuracion por compania */
ConfigSchema.index({ code: 1, companyCode: 1 }, { unique: true });

export const ConfigModel = createModel("config", ConfigSchema);

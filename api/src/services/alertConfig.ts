import { Schema, SchemaDefinition, model } from "mongoose";
import { Service } from ".";
import {
  AlertConfigSchema,
  IAlertConfig,
  IAlertConfigBase,
} from "../models/alertConfigs";

export class AlertConfigService<T = any> extends Service<T> {
  static _instance: AlertConfigService;

  constructor(schema?: SchemaDefinition<T>) {
    const ModelSchema = new Schema<T>(schema);
    ModelSchema.add(AlertConfigSchema);
    const storeModel = model<T>("AlertConfig", ModelSchema);
    super(storeModel);
    AlertConfigService._instance = this;
  }

  public static getInstance() {
    if (!this._instance) {
      this._instance = new AlertConfigService<IAlertConfig>();
    }
    return this._instance;
  }
}

export const alertConfigService = new AlertConfigService();

export class AlertConfig implements IAlertConfigBase {
  public code: string;
  public name: string;
  public value: string;
  public priority: string;
  public isGroup: boolean;
  constructor(data: IAlertConfigBase) {
    Object.assign(this, data);
  }
}

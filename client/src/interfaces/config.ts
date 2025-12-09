export interface IConfig {
  code: string;
  type: "server" | "client";
  dataType: "string" | "number" | "boolean" | "object";
  name: string;
  value: string | number | boolean | object;
  description?: string;
}

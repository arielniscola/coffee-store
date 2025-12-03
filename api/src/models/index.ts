import { Model, Schema, SchemaDefinition, Types, model } from "mongoose";

interface SchemaOptions {
  // Opciones del esquema
  // ...
  timestamps?: boolean;
  versionKey?: boolean;
  // Otras propiedades y opciones del esquema
  // ...
}

/**
 * Crear esquema de Mongoose
 * @param schemaDefinition Definicion de esquema
 * @returns Esquema de Mongoose
 */
export function createSchema<T>(
  schemaDefinition: SchemaDefinition<T>,
  schemaOptions?: SchemaOptions
) {
  return new Schema<T>(schemaDefinition, schemaOptions);
}

/**
 * Extender un esquema con propiedades adicionales
 * @param originalSchema Esquema a extender
 * @param schemaDefinition Definicion de esquema
 * @returns Esquema de Mongoose
 */
export function extendSchema<K, T extends Partial<K>>(
  originalSchema: Schema<K>,
  schemaDefinition: SchemaDefinition<T>,
  schemaOptions?: SchemaOptions
) {
  return new Schema<T>(
    { ...originalSchema.obj, ...schemaDefinition },
    schemaOptions
  );
}
/**
 * Crear modelo de Mongoose
 * @param modelName Nombre del modelo
 * @param schema Esquema
 * @returns Modelo de Mongoose
 */
export function createModel<T>(modelName: string, schema: Schema<T>): Model<T> {
  return model<T>(modelName, schema);
}

/**
 * Tipo ObjectID
 */
export type ObjectId = Types.ObjectId;

import {
  AggregateOptions,
  Cursor,
  FilterQuery,
  HydratedDocument,
  InsertManyOptions,
  Model,
  QueryOptions,
  SchemaDefinition,
  Types,
  UpdateQuery,
  UpdateWithAggregationPipeline,
} from "mongoose";

/**
 * Definicion de esquema heredado de mongoose
 */
export type ServiceSchemaDefinition<T> = SchemaDefinition<T>;

/**
 * Filtro de busqueda
 */
export type Filter<T> = FilterQuery<T>;

/**
 * Opciones de consulta
 */
export type Options = QueryOptions;
/**
 * Opciones de insertMany
 */
export type insertManyOptions = InsertManyOptions;

/**
 * Tipo de Operacion para actualizar
 */
export type Update<T> = UpdateQuery<T> | UpdateWithAggregationPipeline;

/**
 * Documento de tipo T (incluye el _id de Mongo)
 */
export type Document<T> = T & { _id: Types.ObjectId };

/**
 * Tipado para la funcion insertOne
 */
export type InsertOne<T> = (
  data: Partial<T>,
  options?: Options
) => Promise<Document<T>>;
/**
 * Opciones de configuracion del Servicio
 */
export interface IServiceOptions {
  /**
   * Implementa Cache para guardar datos
   * consultados por el metodo .findOne
   * @defaultValue false
   */
  cached?: boolean;
}

export class Service<T> {
  private _model: Model<T>;
  private _options: IServiceOptions;

  constructor(model: Model<T>, options: IServiceOptions = {}) {
    this._model = model;
    this._options = options;
  }

  get name(): string {
    return this._model.collection.name;
  }
  /**
   * Crear nuevo documento
   * @param doc Documento
   */
  new(doc?: Partial<T>): Document<T> {
    const obj = new this._model(doc);
    return obj.toObject() as Document<T>;
  }

  async validate(data: T): Promise<{
    message: string;
    errors: { kind: string; path: string }[];
  } | null> {
    const obj = new this._model(data);
    try {
      const result = await obj.validate();
      return null;
    } catch (error: any) {
      let message = "";
      let errors: { kind: string; path: string }[] = [];
      let i = 0;
      /** En caso de error, vamos a recorrer las claves y concatenar los errores en un solo mensaje */
      for (const key of Object.keys(error.errors)) {
        if (i > 0) message += ", ";
        const { kind, path } = error.errors[key];
        errors.push({ kind, path });
        switch (kind) {
          // Es un error en el objeto, escarvar para encontrar donde
          case "embedded":
            const reason = error.reason;
            if (reason) {
              const { kind, path, value } = reason;
              message += `${key}.${path} tiene un valor incorrecto (${value} se esperaba que sea ${kind})`;
            } else {
              message += `${key} tiene un valor incorrecto`;
            }
          case "required":
            message += `${key} es requerido`;
            break;
          case "minlength":
            message += `${key} debe tener al menos ${error.errors[key].properties.minlength} caracteres`;
            break;
          case "maxlength":
            message += `${path} debe tener como maximo ${error.errors[key].properties.maxlength} caracteres`;
            break;
          case "enum":
            message += `${key} debe ser uno de los siguientes valores: ${error.errors[
              key
            ].properties.enumValues.join(", ")}`;
            break;
          case "unique":
            message += `${key} debe ser unico`;
            break;
          default:
            message += `${key} es invalido (debe ser ${kind})`;
            break;
        }
        i++;
      }
      return { message, errors };
    }
  }
  /**
   * Validar _id
   * @param _id Id a validar
   */
  validateId(_id: Types.ObjectId | string) {
    return Types.ObjectId.isValid(_id);
  }

  /**
   * Transformar string a ObjectId
   * @param _id Id a transformar
   */
  toObjectId(_id: string): Types.ObjectId {
    return new Types.ObjectId(_id);
  }

  /**
   * Obtener datos de a uno
   * @param filter Filtro de datos a obtener
   * @returns Datos obtenidos
   */
  async findOne(
    filter: Filter<T>,
    projection?: any,
    options?: Options
  ): Promise<Document<T>> {
    // Buscar en base de datos
    const result = (await this._model
      .findOne(filter, projection, options)
      .lean()) as Document<T>;
    return result;
  }

  /**
   * Actualizar datos de a uno
   * y obtener el documento actualizado
   * @param filter Filtro de datos a obtener
   * @param update Datos a actualizar
   * @returns Datos actualizados
   */
  async findOneAndUpdate(
    filter: Filter<T>,
    update: Update<T>,
    options?: Options
  ): Promise<Document<T>> {
    const result = (await this._model
      .findOneAndUpdate(filter, update, { new: true, ...options })
      .lean()) as Document<T>;
    return result;
  }

  /**
   * Obtener datos en lote
   * @param filter Filtro de datos a obtener
   * @param projections Proyeccion de datos a obtener
   * @param options Opciones de consulta
   * @returns Datos obtenidos
   */
  async find(
    filter: Filter<T>,
    projections?: any,
    options?: Options
  ): Promise<Document<T>[]> {
    const result = (await this._model
      .find(filter, projections, options)
      .lean()) as Document<T>[];
    return result;
  }

  /**
   * Obtener datos usando cursor (paginacion)
   * @param filter Filtro de datos a obtener
   * @param projections Proyeccion de datos a obtener
   * @param options Opciones de consulta
   * @returns Cursor
   */
  findCursor(
    filter: Filter<T>,
    projections?: any,
    options?: Options
  ): Cursor<
    HydratedDocument<T, {}, {}>,
    QueryOptions<HydratedDocument<T, {}, {}>>
  > {
    return this._model.find(filter, projections, options).lean().cursor();
  }

  /**
   * Insertar Datos de a uno
   * @param data Datos a insertar
   * @returns Datos insertados
   */
  async insertOne(
    data: Partial<T>,
    options?: insertManyOptions
  ): Promise<Document<T>> {
    const result = await this._model.insertMany([data], options);
    return result[0].toObject<Document<T>>();
  }

  /**
   * Insertar datos en lote
   * @param data Datos a insertar
   */
  async insertMany(
    data: Partial<T>[],
    options?: insertManyOptions
  ): Promise<Document<T>[]> {
    const result = await this._model.insertMany(data, options);
    return result.map((doc) => doc.toObject()) as Document<T>[];
  }

  /**
   * Actualizar Datos de a uno
   * @param filter Filtro de datos a actualizar
   * @param data Datos a actualizar
   * @returns Datos actualizados
   */
  async updateOne(
    filter: Filter<T>,
    data: Update<T>,
    options?: UpdateQuery<T>
  ) {
    const result = await this._model
      .updateOne(filter, data, { new: true, ...options })
      .lean();
    // Guardar en cache (si esta habilitado)
    return result as unknown as Document<T>;
  }

  /**
   * Actualizar datos en lote
   * @param filter Filtro de datos a actualizar
   * @param data Datos a actualizar
   * @returns Datos actualizados
   */
  async updateMany(
    filter: Filter<T>,
    data: Update<T>,
    options?: UpdateQuery<T>
  ) {
    const result = await this._model.updateMany(filter, data, options);
    return result;
  }

  /**
   * Obtener datos de la entidad y eliminarla
   * @param filter Filtro de datos a obtener
   * @returns Datos obtenidos
   */
  async findOneAndDelete(
    filter: Filter<T>,
    options?: Options
  ): Promise<Document<T>> {
    const result = (await this._model
      .findOneAndDelete(filter, options)
      .lean()) as Document<T>;
    return result;
  }

  /**
   * Eliminar Datos de a uno
   * @param filter Filtro de datos a eliminar
   * @returns Datos eliminados
   */
  async deleteOne(filter: Filter<T>, options?: UpdateQuery<T>) {
    const result = await this._model.deleteOne(filter, options);
    return result;
  }

  /**
   * Eliminar datos en lote
   * @param filter Filtro de datos a eliminar
   * @returns Datos eliminados
   */
  async deleteMany(filter: Filter<T>, options?: any) {
    const result = await this._model.deleteMany(filter, options);
    return result;
  }

  /**
   * Verifica si existe un documento mediante los parametros de filtro
   * @param filter Filtros de datos a verificar
   * @returns Verdadero si existe, falso si no existe
   */
  async exists(filter: Filter<T>, options?: any) {
    const result = await this._model.countDocuments(filter, options);
    return result > 0;
  }

  /**
   * Realizar agregacion de datos
   * @param pipeline Pipeline de agregacion
   * @returns Datos obtenidos
   */
  async aggregate(pipeline: any[], options?: AggregateOptions) {
    const result = await this._model.aggregate(pipeline, options);
    return result;
  }

  /**
   * Contar documentos
   * @param filter Filtro de datos a contar
   * @returns Cantidad de documentos
   */
  async count(filter: Filter<T>, options?: any) {
    const result = await this._model.countDocuments(filter, options);
    return result;
  }
}

/**
 * Servicio de Compania
 * @class Company
 * @extends {Service}
 */

import { Filter, Service } from ".";
import { IProcessStatus, ProcessStatusModel } from "../models/processStatus";

export class ProcessStatusService extends Service<IProcessStatus> {
  constructor() {
    super(ProcessStatusModel);
  }

  /**
   * Al actualizar el estado de un proceso, si no existe, lo creamos
   */
  async updateOne(filter: Filter<IProcessStatus>, data: IProcessStatus) {
    const exists = await this.exists(filter);
    if (!exists) {
      // Si no existe el estado del proceso, lo creamos
      await this.insertOne(data);
    }
    const result = await super.updateOne(filter, data);
    return result;
  }
}

const processStatusService = new ProcessStatusService();
export default processStatusService;

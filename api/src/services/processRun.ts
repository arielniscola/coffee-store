/**
 * Servicio de Compania
 * @class Company
 * @extends {Service}
 */

import { Service } from ".";
import { ICoreProcessRun, ProcessRunModel } from "../models/processRun";

export class ProcessRunCoreService extends Service<ICoreProcessRun> {
  constructor() {
    super(ProcessRunModel);
  }
}

const processRunCoreService = new ProcessRunCoreService();
export default processRunCoreService;

import moment from "moment";
import { Service } from ".";
import { IWorkshop, WorkshopModel } from "../models/workshop";

export class WorkshopService extends Service<IWorkshop> {
  constructor() {
    super(WorkshopModel);
  }

  /**
   * Taller activo para una fecha puntual (yyyy-MM-dd). Compara por día,
   * ignorando la hora. Devuelve null si ese día no hay taller.
   */
  async findActiveByDate(
    companyCode: string,
    dateStr: string
  ): Promise<IWorkshop | null> {
    const dayStart = moment(dateStr, "YYYY-MM-DD").utc(true).startOf("day");
    const dayEnd = moment(dateStr, "YYYY-MM-DD").utc(true).endOf("day");
    const result = await this.findOne({
      companyCode,
      active: true,
      date: { $gte: dayStart.toDate(), $lte: dayEnd.toDate() },
    });
    return result || null;
  }

  /**
   * Talleres activos de hoy en adelante, ordenados por fecha. Es lo que
   * consume la landing pública y el flujo de reserva.
   */
  async findUpcoming(companyCode: string): Promise<IWorkshop[]> {
    const todayStart = moment().utc(true).startOf("day");
    return await this.find(
      {
        companyCode,
        active: true,
        date: { $gte: todayStart.toDate() },
      },
      {},
      { sort: { date: 1 } }
    );
  }
}

export const workshopService = new WorkshopService();
export default workshopService;

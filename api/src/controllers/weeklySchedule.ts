import Log from "../libs/logger";
import { IRouteController } from "../routes/index";
import { IWeeklySchedule } from "../models/weeklySchedule";
import { weeklyScheduleService } from "../services/weeklySchedule";

export class WeeklyScheduleController {
  static find: IRouteController = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "WeeklyScheduleController.find"
    );
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const data = await weeklyScheduleService.getEffective(companyCode);
      return res.status(200).json({ ack: 0, data });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static update: IRouteController = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "WeeklyScheduleController.update"
    );
    try {
      const companyCode = res.locals.companyCode || "wichiwi";
      const schedule: Partial<IWeeklySchedule> = req.body;
      const error = weeklyScheduleService.validateSchedule(schedule);
      if (error) throw new Error(error);
      const data = await weeklyScheduleService.upsert(companyCode, schedule);
      return res
        .status(200)
        .json({ ack: 0, message: "Horario actualizado", data });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };
}

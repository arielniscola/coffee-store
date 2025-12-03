import Log from "../libs/logger";
import { IRouteController } from "../routes/index";
import { ITable } from "../models/table";
import { tableService } from "../services/table";

export class TableController {
  static find: IRouteController<{}, {}, {}, {}> = async (req, res) => {
    const logger = new Log(res.locals.requestId, "TableController.find");
    try {
      const companyCode = res.locals.companyCode;
      const data: ITable[] = await tableService.find(
        {
          companyCode: companyCode,
        },
        {}
      );

      return res.status(200).json({ ack: 0, data: data });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static create: IRouteController = async (req, res) => {
    const logger = new Log(res.locals.requestId, "TableController.create");
    try {
      const companyCode = res.locals.companyCode;
      const table: ITable = req.body;
      table.companyCode = companyCode;
      delete table._id;
      const created = await tableService.insertOne(table);
      if (!created) throw new Error("No se creo el la mesa");
      return res
        .status(200)
        .json({ ack: 0, message: "Se creo mesa correctamente" });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static update: IRouteController = async (req, res) => {
    const logger = new Log(res.locals.requestId, "TableController.update");
    try {
      const tableUpdate: ITable = req.body;
      /** Verificar si existe */
      const exist = await tableService.findOne({
        _id: tableUpdate._id,
      });
      if (!exist) throw new Error("Table no encontrado");
      const response = await tableService.updateOne(
        { _id: tableUpdate._id },
        tableUpdate
      );
      if (!response) throw new Error("Table no se actualizo");
      return res.status(200).json({ ack: 0, message: "Table actualizado" });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static delete: IRouteController<{ id: string }> = async (req, res) => {
    const logger = new Log(res.locals.requestId, "TableController.delete");
    try {
      const id = req.params.id;
      if (!tableService.validateId(id)) throw new Error("ID no valido");

      const deleted = await tableService.deleteOne({ _id: id });
      if (!deleted) throw new Error("No se pude eliminar mesa");
      res.status(200).json({ ack: 0, message: "Mesa eliminada correctamente" });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };
}

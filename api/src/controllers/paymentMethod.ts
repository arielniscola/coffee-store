import Log from "../libs/logger";
import { IPaymentMethod } from "../models/paymentMethod";
import { IRouteController } from "../routes/index";
import { paymentMethodService } from "../services/paymentMethod";

export class PaymentMethodController {
  static find: IRouteController<{}, {}, {}, { id: string }> = async (
    req,
    res
  ) => {
    const logger = new Log(
      res.locals.requestId,
      "PaymentMethodController.find"
    );
    try {
      const companyCode = res.locals.companyCode;
      const filter = {
        ...{ companyCode: companyCode },
        ...(req.query.id ? { _id: req.query.id } : {}),
      };
      const data: IPaymentMethod[] = await paymentMethodService.find(filter);

      return res.status(200).json({ ack: 0, data: data });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static create: IRouteController = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "PaymentMethodController.create"
    );
    try {
      const companyCode = res.locals.companyCode;
      const paymentMethod: IPaymentMethod = req.body;
      delete paymentMethod._id;
      /** Validar existencia y datos */
      const exist = await paymentMethodService.findOne({
        companyCode: companyCode,
        identificationNumber: paymentMethod.identificationNumber,
      });
      if (exist) throw new Error("Ya existe metodo de pago con mismo CBU");
      paymentMethod.companyCode = companyCode;

      const create = await paymentMethodService.insertOne(paymentMethod);
      if (!create)
        throw new Error("Metodo de pago no se pudo crear correctamente");

      return res.status(200).json({ ack: 0, message: "Metodo de pago creado" });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static update: IRouteController = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "PaymentMethodController.update"
    );
    try {
      const companyCode = res.locals.companyCode;
      const paymentMethod: IPaymentMethod = req.body;
      /** Verificar si ya se encuentra creado dentro de la compañia */
      const exist = await paymentMethodService.findOne({
        companyCode: paymentMethod.companyCode,
        _id: paymentMethod._id,
      });
      if (!exist) throw new Error("Metodo de pago no encontrado");

      const updated = await paymentMethodService.updateOne(
        {
          _id: paymentMethod._id,
          companyCode: companyCode,
        },
        paymentMethod
      );
      if (!updated) throw new Error("Metodo de pago no se actualizo");

      return res
        .status(200)
        .json({ ack: 0, message: "Metodo de pago actualizado" });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };

  static delete: IRouteController = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "PaymentMethodController.delete"
    );
    try {
      const companyCode = res.locals.companyCode;
      const id = req.params.id;
      const deleted = await paymentMethodService.deleteOne({
        _id: id,
        companyCode: companyCode,
      });
      if (!deleted) throw new Error("Metodo de pago no eliminado");
      return res
        .status(200)
        .json({ ack: 0, message: "Metodo de pago eliminado correctamente" });
    } catch (e) {
      logger.error(e);
      return res.status(400).json({ ack: 1, message: e.message });
    }
  };
}

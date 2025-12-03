import { Service } from ".";
import { IPaymentMethod, PaymentMethodModel } from "../models/paymentMethod";

export class PaymentMethodService extends Service<IPaymentMethod> {
  constructor() {
    super(PaymentMethodModel);
  }
}

export const paymentMethodService = new PaymentMethodService();

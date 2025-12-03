import { useRef, useEffect, useState } from "react";
import Transition from "../utils/transitions";
import { IPaymentMethod } from "../interfaces/paymentMethod";
import { getPaymentMethods } from "../services/paymentMethodService";
import { CreditCard, X } from "lucide-react";
import { createPayment } from "../services/payment";
import toast, { Toaster } from "react-hot-toast";
import { IPayment } from "../interfaces/payment";
import { IMovement } from "../interfaces/movement";
import { IClient } from "../interfaces/client";

const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);
interface ModalPaymentMethodProps {
  id: string;
  modalOpen: boolean;
  setModalOpen: (modalOpen: boolean) => void;
  setResearch: (research: boolean) => void;
  research: boolean;
  client?: IClient;
  movement?: IMovement;
}

const ModalPaymentMethod: React.FC<ModalPaymentMethodProps> = ({
  id,
  modalOpen,
  setModalOpen,
  setResearch,
  research,
  client,
  movement,
}) => {
  const modalContent = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [selectedMethod, setSelectedMethod] = useState<IPaymentMethod | null>(
    null
  );
  const [total, setTotal] = useState<number>(0);
  const [paymentMethods, setPaymentMethods] = useState<IPaymentMethod[]>();
  const [payment, setPayment] = useState<IPayment>({
    amount: 0,
    client: client?._id || "",
    date: new Date(),
    paymentMenthod: {} as IPaymentMethod,
    movementsNumber: [],
  });
  // close on click outside
  useEffect(() => {
    const clickHandler = (event: MouseEvent) => {
      const { target } = event;
      if (!modalOpen || modalContent.current?.contains(target as Node)) return;
      setModalOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  useEffect(() => {
    if (movement) {
      setTotal(movement.totalAmount - (movement.amountPaid || 0));
      setPayment({
        ...payment,
        movementsNumber: [movement.identifacationNumber || ""],
        client:
          typeof movement.client === "string"
            ? movement.client
            : movement.client?._id || "",
      });
    } else {
      setTotal(0);
    }
  }, [movement]);

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      const { keyCode } = event;
      if (!modalOpen || keyCode !== 27) return;
      setModalOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  useEffect(() => {
    modalOpen && searchInput.current?.focus();
  }, [modalOpen]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const paymentMethodsData =
          (await getPaymentMethods()) as IPaymentMethod[];
        setPaymentMethods(paymentMethodsData);
      } catch (error) {
        console.error("Error fetching paymentMethod:", error);
      }
    };
    fetchPaymentMethods();
  }, []);

  // Guardar pago
  const submitPayment = async (mov: IPayment) => {
    mov.amount = total;
    mov.paymentMenthod = selectedMethod || ({} as IPaymentMethod);
    if (!mov.client) {
      mov.client = client?._id || "";
    }
    try {
      const res = await createPayment(mov);
      if (res.ack) {
        notifyError(res.message ? res.message : "error");
      } else {
        notify(res.message ? res.message : "ok");
      }
    } catch (error) {
      notifyError(error ? error.toString() : "Error");
    } finally {
      setResearch(!research);
      setModalOpen(false);
      setSelectedMethod(null);
      setTotal(0);
      setPayment({
        amount: 0,
        client: client?._id || "",
        date: new Date(),
        paymentMenthod: {} as IPaymentMethod,
        movementsNumber: [],
      });
    }
  };

  return (
    <>
      {/* Modal backdrop */}
      <Transition
        className="fixed inset-0 bg-slate-900 bg-opacity-30 z-50 transition-opacity"
        show={modalOpen}
        enter="transition ease-out duration-200"
        enterStart="opacity-0"
        enterEnd="opacity-100"
        leave="transition ease-out duration-100"
        leaveStart="opacity-100"
        leaveEnd="opacity-0"
        aria-hidden="true"
      />
      {/* Modal dialog */}
      <Transition
        id={id}
        className="fixed inset-0 z-50 overflow-hidden flex items-start top-20 mb-4 justify-center px-4 sm:px-6"
        role="dialog"
        aria-modal="true"
        show={modalOpen}
        enter="transition ease-in-out duration-200"
        enterStart="opacity-0 translate-y-4"
        enterEnd="opacity-100 translate-y-0"
        leave="transition ease-in-out duration-200"
        leaveStart="opacity-100 translate-y-0"
        leaveEnd="opacity-0 translate-y-4"
      >
        <div
          ref={modalContent}
          className="bg-white dark:bg-slate-800 border border-transparent dark:border-slate-700 overflow-auto max-w-2xl w-full max-h-full rounded shadow-lg"
        >
          <div className="relative p-4 w-full  max-h-full">
            <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Procesar Pago</h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total a pagar
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    step="1"
                    value={total}
                    onChange={(e) => setTotal(parseFloat(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-3">
                {paymentMethods &&
                  paymentMethods.map((method) => (
                    <div
                      key={method._id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedMethod?._id === method._id
                          ? `border-indigo-500 bg-[${method.colorBanner}]`
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedMethod(method)}
                    >
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-gray-800" />
                        <span className="font-medium">{method.name}</span>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={!selectedMethod}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    submitPayment(payment);
                  }}
                >
                  Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
      <Toaster position="bottom-right" />
    </>
  );
};

export default ModalPaymentMethod;

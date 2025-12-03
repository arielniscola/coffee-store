import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Sidebar } from "../../partials/sidebar";
import Header from "../../partials/headers";
import { IPaymentMethod } from "../../interfaces/paymentMethod";
import {
  createPaymentMethod,
  getPaymentMethods,
  updatePaymentMethod,
} from "../../services/paymentMethodService";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);

const PaymentMethodForm = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const [paymentMethod, setpaymentMethod] = useState<IPaymentMethod>({
    companyCode: "",
    name: "",
    description: "",
    identificationNumber: "",
    alias: "",
    colorBanner: "",
  });

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const paymentMethodData = (await getPaymentMethods(
          id
        )) as IPaymentMethod[];
        if (paymentMethodData.length) {
          setpaymentMethod(paymentMethodData[0]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    if (id) fetchMethods();
  }, []);

  const handleChangeMethod = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    switch (id) {
      default:
        setpaymentMethod({
          ...paymentMethod,
          [id]: value,
        });
        break;
    }
  };
  const onChangeColor = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setpaymentMethod({
      ...paymentMethod,
      colorBanner: value,
    });
  };
  const submitHandlerMethod = async (e: FormEvent) => {
    e.preventDefault();
    let res;
    if (paymentMethod.companyCode) {
      res = await updatePaymentMethod(paymentMethod);
    } else {
      res = await createPaymentMethod(paymentMethod);
    }
    if (res.ack) {
      notifyError(res.message ? res.message : "ok");
    } else {
      notify(res.message ? res.message : "ok");
      setTimeout(() => navigate(`/payment-methods`), 1000);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/*  Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main>
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            <div className="w-full p-6 bg-white border border-gray-200 rounded-lg shadow sm:p-6 md:p-8 dark:bg-gray-800 dark:border-gray-700">
              <form className="max-w-sm mx-auto">
                <div className="mb-5">
                  <label
                    htmlFor="name"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={paymentMethod.name}
                    id="name"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    required
                    onChange={handleChangeMethod}
                  />
                </div>
                <div className="mb-5">
                  <label
                    htmlFor="identificationNumber"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    CBU
                  </label>
                  <input
                    type="text"
                    id="identificationNumber"
                    value={paymentMethod.identificationNumber}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    required
                    onChange={handleChangeMethod}
                  />
                </div>
                <div className="mb-5">
                  <label
                    htmlFor="description"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Descripción
                  </label>
                  <input
                    type="text"
                    id="description"
                    value={paymentMethod.description}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    onChange={handleChangeMethod}
                  />
                </div>
                <div className="mb-5">
                  <label
                    htmlFor="alias"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Alias
                  </label>
                  <input
                    type="text"
                    id="alias"
                    value={paymentMethod.alias}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    required
                    onChange={handleChangeMethod}
                  />
                </div>
                <div className="mb-5">
                  <label
                    htmlFor="colorBanner"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Color Descriptivo
                  </label>
                  <select
                    id="colorBanner"
                    style={{ backgroundColor: paymentMethod.colorBanner }}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    value={paymentMethod.colorBanner}
                    onChange={onChangeColor}
                  >
                    <option value="#3730a3" className="bg-[#3730a3]"></option>
                    <option value="#6366f1" className="bg-[#6366f1]"></option>
                    <option value="#38bdf8" className="bg-[#38bdf8]"></option>
                    <option value="#4ade80" className="bg-[#4ade80]"></option>
                    <option value="#e2e8f0" className="bg-[#e2e8f0]"></option>
                  </select>
                </div>
                <button
                  type="button"
                  className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  onClick={submitHandlerMethod}
                >
                  Guardar
                </button>
              </form>
            </div>
          </div>
          <Toaster position="bottom-right" />
        </main>
      </div>
    </div>
  );
};

export default PaymentMethodForm;

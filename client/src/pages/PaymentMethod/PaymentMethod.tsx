import { ChangeEvent, useEffect, useState } from "react";
import { Sidebar } from "../../partials/sidebar";
import Header from "../../partials/headers";
import {
  createPaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
  updatePaymentMethod,
} from "../../services/paymentMethodService";
import { IPaymentMethod } from "../../interfaces/paymentMethod";
import toast, { Toaster } from "react-hot-toast";
import ModalDelete from "../../components/DeleteModal";
import { CreditCard, Pencil, Search, Trash2 } from "lucide-react";

const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);

const PaymentMethod = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState<IPaymentMethod[]>([]);
  const [filter, setFilter] = useState("");
  const [filterData, setFilterData] = useState<IPaymentMethod[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<IPaymentMethod>({
    _id: "",
    name: "",
    identificationNumber: "",
    alias: "",
    description: "",
    colorBanner: "",
  });
  const [research, setResearch] = useState<boolean>(true);

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
  }, [research]);

  useEffect(() => {
    if (showModal === false) {
      setFormData({
        _id: "",
        alias: "",
        identificationNumber: "",
        name: "",
        description: "",
      });
    }
  }, [showModal]);

  const handleUpdate = (id?: string) => {
    const unit = paymentMethods.find((u) => u._id === id);
    if (unit) {
      setFormData(unit);
      setShowModal(true);
    }
  };

  const filterHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilter(value);
    const newProdArray = paymentMethods.filter((met) =>
      met.name?.toLocaleLowerCase().includes(value)
    );
    setFilterData(newProdArray);
  };

  const handleAddPaymentMethod = async () => {
    try {
      let res;
      if (!formData.companyCode) {
        res = await createPaymentMethod(formData);
      } else {
        res = await updatePaymentMethod(formData);
      }
      if (!res.ack) {
        notify(res.message ? res.message : "ok");
      } else {
        notifyError(res.message ? res.message : "Error");
      }
    } catch (error) {
      notifyError(error ? error.toString() : "Error");
    } finally {
      setResearch(!research);
      setShowModal(false);
    }
  };

  const deleteHandler = async () => {
    try {
      const res = await deletePaymentMethod(deleteId);
      if (res.ack) {
        notifyError(res.message ? res.message : "error");
      } else {
        notify(res.message ? res.message : "ok");
      }
      setDeleteModalOpen(false);
      setResearch(!research);
    } catch (error) {
      notifyError(error ? error.toString() : "error");
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
          <div className="min-h-screen bg-gray-100 p-8">
            <div className="mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  Métodos de Pago
                </h1>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                  <CreditCard className="h-5 w-5" />
                  Nuevo
                </button>
              </div>

              <div className="mb-4 flex gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Filtrar metodos de pago..."
                    value={filter}
                    onChange={(e) => filterHandler(e)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CBU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alias
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filter.length === 0
                      ? paymentMethods.map((met) => (
                          <tr key={met._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-500">
                                {met.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {met.identificationNumber}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {met.alias}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleUpdate(met._id)}
                                  className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                >
                                  <Pencil className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteId(met._id ? met._id : "");
                                    setDeleteModalOpen(true);
                                  }}
                                  className="text-red-600 hover:text-red-900 transition-colors"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      : filterData.map((met) => (
                          <tr key={met._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-500">
                                {met.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {met.identificationNumber}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {met.alias}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleUpdate(met._id)}
                                  className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                >
                                  <Pencil className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteId(met._id ? met._id : "");
                                    setDeleteModalOpen(true);
                                  }}
                                  className="text-red-600 hover:text-red-900 transition-colors"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

              {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-white rounded-lg p-8 max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-4">
                      Agregar Metodo de Pago
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Nombre
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          CBU
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.identificationNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              identificationNumber: e.target.value,
                            })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Alias
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.alias}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              alias: e.target.value,
                            })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Descripcion
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                        />
                      </div>
                      <div className="mb-5">
                        <label
                          htmlFor="colorBanner"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Color Descriptivo
                        </label>
                        <select
                          id="colorBanner"
                          style={{
                            backgroundColor: formData.colorBanner,
                          }}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          value={formData.colorBanner}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              colorBanner: e.target.value,
                            });
                          }}
                        >
                          <option
                            value="#3730a3"
                            className="bg-[#3730a3]"
                          ></option>
                          <option
                            value="#6366f1"
                            className="bg-[#6366f1]"
                          ></option>
                          <option
                            value="#38bdf8"
                            className="bg-[#38bdf8]"
                          ></option>
                          <option
                            value="#4ade80"
                            className="bg-[#4ade80]"
                          ></option>
                          <option
                            value="#e2e8f0"
                            className="bg-[#e2e8f0]"
                          ></option>
                        </select>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowModal(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                          onClick={handleAddPaymentMethod}
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <ModalDelete
            id="delete-modal"
            modalOpen={deleteModalOpen}
            setModalOpen={setDeleteModalOpen}
            deleteFn={deleteHandler}
          />
        </main>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default PaymentMethod;

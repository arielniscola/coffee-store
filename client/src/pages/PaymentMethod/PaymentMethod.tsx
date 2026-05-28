import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Sidebar } from "../../partials/sidebar";
import Header from "../../partials/headers";
import {
  createPaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
  updatePaymentMethod,
} from "../../services/paymentMethodService";
import { IPaymentMethod } from "../../interfaces/paymentMethod";
import toast from "react-hot-toast";
import ModalDelete from "../../components/DeleteModal";
import { CreditCard, Pencil, Plus, Search, Trash2, X } from "lucide-react";

const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);

const emptyForm: IPaymentMethod = {
  _id: "",
  name: "",
  identificationNumber: "",
  alias: "",
  description: "",
  colorBanner: "",
};

const PaymentMethod = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState<IPaymentMethod[]>([]);
  const [filter, setFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<IPaymentMethod>(emptyForm);
  const [research, setResearch] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = (await getPaymentMethods()) as IPaymentMethod[];
        setPaymentMethods(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error fetching paymentMethod:", e);
      }
    };
    fetch();
  }, [research]);

  useEffect(() => {
    if (!showModal) setFormData(emptyForm);
  }, [showModal]);

  const filtered = useMemo(() => {
    if (!filter) return paymentMethods;
    const q = filter.toLowerCase();
    return paymentMethods.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.alias?.toLowerCase().includes(q) ||
        m.identificationNumber?.includes(q),
    );
  }, [paymentMethods, filter]);

  const filterHandler = (e: ChangeEvent<HTMLInputElement>) =>
    setFilter(e.target.value);

  const handleEdit = (id?: string) => {
    const m = paymentMethods.find((u) => u._id === id);
    if (m) {
      setFormData(m);
      setShowModal(true);
    }
  };

  const handleSave = async () => {
    try {
      const res = !formData.companyCode
        ? await createPaymentMethod(formData)
        : await updatePaymentMethod(formData);
      if (!res.ack) notify(res.message || "Guardado correctamente");
      else notifyError(res.message || "Error");
    } catch (e) {
      notifyError(e?.toString() || "Error");
    } finally {
      setResearch(!research);
      setShowModal(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deletePaymentMethod(deleteId);
      if (res.ack) notifyError(res.message || "Error");
      else notify(res.message || "Eliminado");
      setDeleteModalOpen(false);
      setResearch(!research);
    } catch (e) {
      notifyError(e?.toString() || "Error");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="bg-gray-50 min-h-full">
          <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Métodos de Pago
                </h1>
                <p className="text-gray-500 text-sm">
                  Gestioná las cuentas y formas de pago disponibles
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-400 to-blue-400 text-white px-4 py-2 rounded-lg font-semibold hover:from-pink-300 hover:to-blue-300 transition-all shadow-md"
              >
                <Plus className="h-5 w-5" />
                Nuevo método
              </button>
            </div>

            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filtrar por nombre, alias o CBU..."
                value={filter}
                onChange={filterHandler}
                className="pl-10 w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay métodos de pago</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        CBU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Alias
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filtered.map((m) => (
                      <tr key={m._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-blue-100 items-center justify-center text-pink-500">
                              <CreditCard className="w-4 h-4" />
                            </span>
                            <span className="text-sm font-medium text-gray-800">
                              {m.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {m.identificationNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {m.alias}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => handleEdit(m._id)}
                              className="p-2 text-pink-500 hover:bg-pink-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteId(m._id || "");
                                setDeleteModalOpen(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {showModal && (
              <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setShowModal(false)}
              >
                <div
                  className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-gradient-to-r from-pink-300 to-blue-300 text-white p-5 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                      </span>
                      <div>
                        <h2 className="text-xl font-bold leading-tight">
                          {formData.companyCode ? "Editar" : "Nuevo"} método de pago
                        </h2>
                        <p className="text-xs text-white/80">
                          Datos para mostrar al cliente al momento de pagar
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="hover:bg-white/20 rounded-full p-1.5 transition-colors"
                      aria-label="Cerrar"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSave();
                    }}
                    className="p-6 space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Transferencia Banco Galicia"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CBU / CVU
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={22}
                          placeholder="22 dígitos"
                          value={formData.identificationNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              identificationNumber: e.target.value.replace(
                                /\D/g,
                                "",
                              ),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300 font-mono text-sm"
                        />
                        {formData.identificationNumber &&
                          formData.identificationNumber.length !== 22 && (
                            <p className="text-xs text-amber-600 mt-1">
                              {formData.identificationNumber.length}/22 dígitos
                            </p>
                          )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alias
                        </label>
                        <input
                          type="text"
                          placeholder="mi.alias.mp"
                          value={formData.alias}
                          onChange={(e) =>
                            setFormData({ ...formData, alias: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Información adicional que verá el cliente (titular, banco, etc.)"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300 resize-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-gradient-to-r from-pink-400 to-blue-400 text-white rounded-lg font-semibold hover:from-pink-300 hover:to-blue-300 transition-all shadow-md"
                      >
                        Guardar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
          <ModalDelete
            id="delete-modal"
            modalOpen={deleteModalOpen}
            setModalOpen={setDeleteModalOpen}
            deleteFn={handleDelete}
          />
        </main>
      </div>
    </div>
  );
};

export default PaymentMethod;

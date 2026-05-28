import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Search, Store, Plus, X } from "lucide-react";
import { Sidebar } from "../../partials/sidebar";
import Header from "../../partials/headers";
import { IUnitBusiness } from "../../interfaces/unitBusiness";
import {
  createUnitBusiness,
  deleteUnitBusiness,
  getUnitBusiness,
  updateUnitBusiness,
} from "../../services/unitBusinessService";
import ModalDelete from "../../components/DeleteModal";
import toast from "react-hot-toast";

const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);

const emptyForm: IUnitBusiness = {
  _id: "",
  code: "",
  name: "",
  description: "",
  active: true,
};

const UnitBusiness = () => {
  const [unitBusiness, setUnitBusiness] = useState<IUnitBusiness[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [research, setResearch] = useState(true);
  const [formData, setFormData] = useState<IUnitBusiness>(emptyForm);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = (await getUnitBusiness(false)) as IUnitBusiness[];
        setUnitBusiness(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error fetching unit business:", e);
      }
    };
    fetch();
  }, [research]);

  useEffect(() => {
    if (!showModal) setFormData(emptyForm);
  }, [showModal]);

  const filtered = useMemo(() => {
    if (!filter) return unitBusiness;
    const q = filter.toLowerCase();
    return unitBusiness.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) || u.code?.toLowerCase().includes(q),
    );
  }, [unitBusiness, filter]);

  const filterHandler = (e: ChangeEvent<HTMLInputElement>) =>
    setFilter(e.target.value);

  const handleEdit = (id?: string) => {
    const u = unitBusiness.find((x) => x._id === id);
    if (u) {
      setFormData(u);
      setShowModal(true);
    }
  };

  const handleSave = async () => {
    try {
      const res = !formData._id
        ? await createUnitBusiness(formData)
        : await updateUnitBusiness(formData);
      if (!res.ack) notify(res.message || "Guardado");
      else notifyError(res.message || "Error");
    } catch (e) {
      notifyError(e?.toString() || "Error");
    } finally {
      setShowModal(false);
      setResearch(!research);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deleteUnitBusiness(deleteId);
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
                  Unidades de Negocio
                </h1>
                <p className="text-gray-500 text-sm">
                  Gestioná las sucursales o locales
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-400 to-blue-400 text-white px-4 py-2 rounded-lg font-semibold hover:from-pink-300 hover:to-blue-300 transition-all shadow-md"
              >
                <Plus className="h-5 w-5" />
                Nueva unidad
              </button>
            </div>

            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filtrar por nombre o código..."
                value={filter}
                onChange={filterHandler}
                className="pl-10 w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  No hay unidades de negocio registradas
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filtered.map((unit) => (
                      <tr key={unit._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                          {unit.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {unit.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                              unit.active
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {unit.active ? "Activa" : "Inactiva"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {unit.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => handleEdit(unit._id)}
                              className="p-2 text-pink-500 hover:bg-pink-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteId(unit._id || "");
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
                        <Store className="w-5 h-5" />
                      </span>
                      <div>
                        <h2 className="text-xl font-bold leading-tight">
                          {formData._id ? "Editar" : "Nueva"} unidad de negocio
                        </h2>
                        <p className="text-xs text-white/80">
                          Sucursal, local o punto de venta
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Sucursal Centro"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Código <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: SUC01"
                          value={formData.code}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              code: e.target.value.toUpperCase(),
                            })
                          }
                          disabled={!!formData._id}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300 font-mono text-sm disabled:bg-gray-50 disabled:text-gray-500"
                        />
                        {formData._id && (
                          <p className="text-xs text-gray-400 mt-1">
                            No editable
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Dirección, referencias u observaciones internas"
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
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          Unidad activa
                        </p>
                        <p className="text-xs text-gray-500">
                          Las inactivas no aparecen como opción al reservar
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, active: !formData.active })
                        }
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
                          formData.active
                            ? "bg-gradient-to-r from-pink-400 to-blue-400"
                            : "bg-gray-300"
                        }`}
                        aria-label="Toggle activa"
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                            formData.active ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
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

export default UnitBusiness;

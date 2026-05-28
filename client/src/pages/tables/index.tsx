import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Search, Coffee, Plus, X } from "lucide-react";
import { Sidebar } from "../../partials/sidebar";
import Header from "../../partials/headers";
import ModalDelete from "../../components/DeleteModal";
import toast from "react-hot-toast";
import { ITable } from "../../interfaces/tables";
import {
  createTable,
  deleteTable,
  getPTables,
  updateTable,
} from "../../services/tables";
import { IUnitBusiness } from "../../interfaces/unitBusiness";
import { getUnitBusiness } from "../../services/unitBusinessService";

const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);

const emptyForm: ITable = {
  _id: "",
  number: 0,
  capacity: 0,
  description: "",
  unitBusiness: "",
  companyCode: "",
  active: true,
};

const Tables = () => {
  const [tables, setTables] = useState<ITable[]>([]);
  const [unitBusinesses, setUnitBusinesses] = useState<IUnitBusiness[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [research, setResearch] = useState(true);
  const [formData, setFormData] = useState<ITable>(emptyForm);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const [data, ubs] = await Promise.all([
          getPTables(),
          getUnitBusiness(true),
        ]);
        setTables(Array.isArray(data) ? (data as ITable[]) : []);
        setUnitBusinesses(Array.isArray(ubs) ? (ubs as IUnitBusiness[]) : []);
      } catch (e) {
        console.error("Error fetching tables:", e);
      }
    };
    fetch();
  }, [research]);

  useEffect(() => {
    if (!showModal) {
      setFormData({
        ...emptyForm,
        unitBusiness: unitBusinesses[0]?.code || "",
      });
    }
  }, [showModal, unitBusinesses]);

  const filtered = useMemo(() => {
    if (!filter) return tables;
    const q = filter.toLowerCase();
    return tables.filter(
      (t) =>
        t.number.toString().includes(q) ||
        t.description?.toLowerCase().includes(q),
    );
  }, [tables, filter]);

  const filterHandler = (e: ChangeEvent<HTMLInputElement>) =>
    setFilter(e.target.value);

  const handleEdit = (id?: string) => {
    const t = tables.find((u) => u._id === id);
    if (t) {
      setFormData(t);
      setShowModal(true);
    }
  };

  const handleSave = async () => {
    try {
      const res = !formData._id
        ? await createTable(formData)
        : await updateTable(formData);
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
      const res = await deleteTable(deleteId);
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
                  Mesas
                </h1>
                <p className="text-gray-500 text-sm">
                  Gestioná las mesas y su capacidad
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-400 to-blue-400 text-white px-4 py-2 rounded-lg font-semibold hover:from-pink-300 hover:to-blue-300 transition-all shadow-md"
              >
                <Plus className="h-5 w-5" />
                Nueva mesa
              </button>
            </div>

            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filtrar por número o descripción..."
                value={filter}
                onChange={filterHandler}
                className="pl-10 w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <Coffee className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay mesas registradas</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.map((tab) => (
                  <div
                    key={tab._id}
                    className={`bg-white rounded-xl border-2 p-4 hover:shadow-md transition-all relative ${
                      tab.active ? "border-gray-200" : "border-red-200 opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-300 to-blue-300 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {tab.number}
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          tab.active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {tab.active ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Capacidad:{" "}
                      <span className="font-semibold text-gray-800">
                        {tab.capacity}
                      </span>
                    </p>
                    {tab.description && (
                      <p
                        className="text-xs text-gray-500 mt-1 truncate"
                        title={tab.description}
                      >
                        {tab.description}
                      </p>
                    )}
                    <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleEdit(tab._id)}
                        className="p-1.5 text-pink-500 hover:bg-pink-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(tab._id || "");
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                  <div className="bg-gradient-to-r from-pink-300 to-blue-300 text-white p-5 rounded-t-2xl flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                      {formData._id ? "Editar mesa" : "Nueva mesa"}
                    </h2>
                    <button
                      onClick={() => setShowModal(false)}
                      className="hover:bg-white/20 rounded-full p-1.5 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          N° de mesa
                        </label>
                        <input
                          type="number"
                          step={1}
                          min={1}
                          value={formData.number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              number: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Capacidad
                        </label>
                        <input
                          type="number"
                          step={1}
                          min={1}
                          value={formData.capacity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              capacity: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unidad de negocio
                      </label>
                      <select
                        value={formData.unitBusiness}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            unitBusiness: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                      >
                        {unitBusinesses.length === 0 && (
                          <option value="">— sin unidades —</option>
                        )}
                        {unitBusinesses.map((u) => (
                          <option key={u._id} value={u.code}>
                            {u.name} ({u.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <select
                        value={formData.active.toString()}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            active: e.target.value === "true",
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                      >
                        <option value="true">Activa</option>
                        <option value="false">Inactiva</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        className="px-4 py-2 bg-gradient-to-r from-pink-400 to-blue-400 text-white rounded-lg font-semibold hover:from-pink-300 hover:to-blue-300 transition-all shadow-md"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
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

export default Tables;

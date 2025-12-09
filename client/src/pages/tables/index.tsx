import { ChangeEvent, useEffect, useState } from "react";
import { Pencil, Trash2, Search, Coffee } from "lucide-react";
import { Sidebar } from "../../partials/sidebar";
import Header from "../../partials/headers";
import ModalDelete from "../../components/DeleteModal";
import toast, { Toaster } from "react-hot-toast";
import { ITable } from "../../interfaces/tables";
import {
  createTable,
  deleteTable,
  getPTables,
  updateTable,
} from "../../services/tables";

const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);

const Tables = () => {
  const [tables, setTables] = useState<ITable[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [filterData, setFilterData] = useState<ITable[]>([]);
  const [research, setResearch] = useState<boolean>(true);
  const [formData, setFormData] = useState<ITable>({
    _id: "",
    number: 0,
    capacity: 0,
    description: "",
    unitBusiness: "LOC1",
    companyCode: "",
    active: true,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const data = (await getPTables()) as ITable[];
        setTables(data);
      } catch (error) {
        console.error("Error fetching unit business:", error);
      }
    };
    fetchTables();
  }, [research]);

  useEffect(() => {
    if (showModal === false) {
      setFormData({
        _id: "",
        number: 0,
        capacity: 0,
        description: "",
        unitBusiness: "LOC1",
        companyCode: "",
        active: true,
      });
    }
  }, [showModal]);

  const handleUpdate = (id?: string) => {
    const unit = tables.find((u) => u._id === id);
    if (unit) {
      setFormData(unit);
      setShowModal(true);
    }
  };

  const handleAddUnitBusiness = async () => {
    try {
      let res;
      !formData._id
        ? (res = await createTable(formData))
        : (res = await updateTable(formData));

      if (!res.ack) {
        notify(res.message ? res.message : "ok");
      } else {
        notifyError(res.message ? res.message : "Error");
      }
    } catch (error) {
      notifyError(error ? error.toString() : "Error");
    } finally {
      setShowModal(false);
      setResearch(!research);
    }
  };

  const deleteHandler = async () => {
    try {
      const res = await deleteTable(deleteId);
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

  const filterHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilter(value);
    const newUNArray = tables.filter((met) =>
      met.number.toString().toLocaleLowerCase().includes(value)
    );
    setFilterData(newUNArray);
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
                <h1 className="text-3xl font-bold text-gray-900">Mesas</h1>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                  <Coffee className="h-5 w-5" />
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
                    placeholder="Filtrar unidad de negocio..."
                    value={filter}
                    onChange={(e) => filterHandler(e)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-center">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        N°
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capacidad (Pers.)
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripcion
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filter.length === 0
                      ? tables.map((tab) => (
                          <tr key={tab._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {tab.number}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {tab.capacity}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${
                                  tab.active ? "green" : "red"
                                }-100 text-${tab.active ? "green" : "red"}-800`}
                              >
                                {tab.active === true ? "Activo" : "Inactivo"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {tab.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleUpdate(tab._id)}
                                  className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                >
                                  <Pencil className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteId(tab._id ? tab._id : "");
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
                      : filterData.map((tab) => (
                          <tr key={tab._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="text-sm font-medium text-gray-900">
                                {tab.number}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {tab.capacity}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${
                                  tab.active ? "green" : "red"
                                }-100 text-${tab.active ? "green" : "red"}-800`}
                              >
                                {tab.active === true ? "Activo" : "Inactivo"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {tab.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleUpdate(tab._id)}
                                  className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                >
                                  <Pencil className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteId(tab._id ? tab._id : "");
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
                    <h2 className="text-2xl font-bold mb-4">Agregar Mesa</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Número de Mesa
                        </label>
                        <input
                          type="number"
                          step={1}
                          min={1}
                          required
                          value={formData.number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              number: parseInt(e.target.value),
                            })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Capacidad (Personas)
                        </label>
                        <input
                          type="number"
                          step={1}
                          min={1}
                          required
                          value={formData.capacity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              capacity: parseInt(e.target.value),
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Estado
                        </label>
                        <select
                          value={formData.active.valueOf().toString()}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              active: e.target.value === "true",
                            })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                        >
                          <option value={"true"}>Activo</option>
                          <option value={"false"}>Inactivo</option>
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
                          type="button"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                          onClick={handleAddUnitBusiness}
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

export default Tables;

import { ChangeEvent, useEffect, useState } from "react";
import {
  createShift,
  deleteShift,
  getShifts,
  updateShift,
} from "../../../services/shiftService";
import moment from "moment";
import { IShift } from "../../../interfaces/shift";
import { getUnitBusiness } from "../../../services/unitBusinessService";
import { IUnitBusiness } from "../../../interfaces/unitBusiness";
import { Pencil, Search, Store, Trash2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);

const getColorStatus = (status: string) => {
  switch (status) {
    case "paid":
      return "#10B981	";
    case "confirmed":
      return "#3B82F6	";
    case "debt":
      return "#EF4444";
    case "cancelled":
      return "#EF4444";
    default:
      return "#FBBF24	";
  }
};
const getStatusText = (status: string) => {
  switch (status) {
    case "available":
      return "Disponible";
    case "scheduled":
      return "Reservado";
    case "completed":
      return "Completado";
    case "cancelled":
      return "Cancelado";
    default:
      return status;
  }
};

export const ListView = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showModal, setShowModal] = useState(false);
  const [shifts, setShifts] = useState<IShift[]>([]);
  const [unitBusiness, setUnitBusiness] = useState<IUnitBusiness[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [filterData, setFilterData] = useState<IShift[]>([]);
  const [research, setResearch] = useState<boolean>(true);
  const [formData, setFormData] = useState<IUnitBusiness>({
    _id: "",
    code: "",
    name: "",
    description: "",
    active: true,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchUnitBusiness = async () => {
      try {
        const unitBusinessData = (await getUnitBusiness(
          true
        )) as IUnitBusiness[];
        setUnitBusiness(unitBusinessData);
      } catch (error) {
        console.error("Error fetching unit business:", error);
      }
    };
    fetchUnitBusiness();
  }, []);
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const clientsData = (await getShifts(
          selectedDate
            ? selectedDate
            : moment(selectedDate).format("YYYY-MM-DD")
        )) as IShift[];
        setShifts(clientsData);
      } catch (error) {
        console.error("Error fetching reservations:", error);
      }
    };
    fetchShifts();
  }, [selectedDate]);

  const filterHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilter(value);
    const newUNArray = shifts.filter(
      (met) =>
        met.status?.toLocaleLowerCase().includes(value) ||
        met.client?.toLocaleLowerCase().includes(value)
    );
    setFilterData(newUNArray);
  };

  const handleAddUnitBusiness = async () => {
    try {
      let res;
      !formData._id
        ? (res = await createShift(formData))
        : (res = await updateShift(formData));

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

  const deleteHandler = async (deleteId: string) => {
    try {
      const res = await deleteShift(deleteId);
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

  const handleUpdate = (id?: string) => {
    const unit = unitBusiness.find((u) => u._id === id);
    if (unit) {
      setFormData(unit);
      //setShowModal(true);
    }
  };
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reservas</h1>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors">
            <Store className="h-5 w-5" />
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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Codigo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripcion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filter.length === 0
                ? shifts.map((reserv) => (
                    <tr key={reserv._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {reserv.date}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {reserv.client}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${
                            reserv.status ? "green" : "red"
                          }-100 text-${reserv.status ? "green" : "red"}-800`}
                        >
                          {reserv.status === "confirmado"
                            ? "Activo"
                            : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {reserv.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleUpdate(reserv._id)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
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
                : filterData.map((reserv) => (
                    <tr key={reserv._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {reserv.date}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {reserv.client}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${
                            reserv.status ? "green" : "red"
                          }-100 text-${reserv.status ? "green" : "red"}-800`}
                        >
                          {reserv.status === "confirmado"
                            ? "Activo"
                            : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {reserv.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleUpdate(reserv._id)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
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
              <h2 className="text-2xl font-bold mb-4">Agregar Turno</h2>
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
                    Código
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
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
      <Toaster position="bottom-right" />
    </div>
  );
};
